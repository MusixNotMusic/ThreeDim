import { mat4 } from 'wgpu-matrix';

import msdfTextWGSL from './shaders/msdfText.wgsl';

// The kerning map stores a spare map of character ID pairs with an associated
// X offset that should be applied to the character spacing when the second
// character ID is rendered after the first.



export class MsdfFont {
  constructor(
    pipeline,
    bindGroup,
    lineHeight,
    chars,
    kernings
  ) {
    this.pipeline = pipeline;
    this.bindGroup = bindGroup;
    this.lineHeight = lineHeight;
    this.chars = chars;
    this.kernings = kernings;

    const charArray = Object.values(chars);
    this.charCount = charArray.length;
    this.defaultChar = charArray[0];
  }

  getChar(charCode) {
    let char = this.chars[charCode];
    if (!char) {
      char = this.defaultChar;
    }
    return char;
  }

  // Gets the distance in pixels a line should advance for a given character code. If the upcoming
  // character code is given any kerning between the two characters will be taken into account.
  getXAdvance(charCode, nextCharCode = -1) {
    const char = this.getChar(charCode);
    if (nextCharCode >= 0) {
      const kerning = this.kernings.get(charCode);
      if (kerning) {
        return char.xadvance + (kerning.get(nextCharCode) ?? 0);
      }
    }
    return char.xadvance;
  }
}

export class MsdfText {

  constructor(
    device,
    renderBundle,
    measurements,
    font,
    textBuffer
  ) {
    this.device = device;
    this.renderBundle = renderBundle;
    this.measurements = measurements;
    this.font = font;
    this.textBuffer = textBuffer;

    this.bufferArray = new Float32Array(24);

    mat4.identity(this.bufferArray);
    this.setColor(1, 1, 1, 1);
    this.setPixelScale(1 / 512);
    this.bufferArrayDirty = true;
  }

  getRenderBundle() {
    if (this.bufferArrayDirty) {
      this.bufferArrayDirty = false;
      this.device.queue.writeBuffer(
        this.textBuffer,
        0,
        this.bufferArray,
        0,
        this.bufferArray.length
      );
    }
    return this.renderBundle;
  }

  setTransform(matrix) {
    mat4.copy(matrix, this.bufferArray);
    this.bufferArrayDirty = true;
  }

  setColor(r, g, b, a = 1.0) {
    this.bufferArray[16] = r;
    this.bufferArray[17] = g;
    this.bufferArray[18] = b;
    this.bufferArray[19] = a;
    this.bufferArrayDirty = true;
  }

  setPixelScale(pixelScale) {
    this.bufferArray[20] = pixelScale;
    this.bufferArrayDirty = true;
  }
}



export class MsdfTextRenderer {
  constructor(
    device,
    colorFormat,
    depthFormat
  ) {

    this.device = device;
    this.colorFormat = colorFormat;
    this.depthFormat = depthFormat;

    this.cameraArray = new Float32Array(16 * 2);


    this.renderBundleDescriptor = {
      colorFormats: [colorFormat],
      depthStencilFormat: depthFormat,
    };

    this.sampler = device.createSampler({
      label: 'MSDF text sampler',
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      maxAnisotropy: 16,
    });

    this.cameraUniformBuffer = device.createBuffer({
      label: 'MSDF camera uniform buffer',
      size: this.cameraArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    this.fontBindGroupLayout = device.createBindGroupLayout({
      label: 'MSDF font group layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    this.textBindGroupLayout = device.createBindGroupLayout({
      label: 'MSDF text group layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    const shaderModule = device.createShaderModule({
      label: 'MSDF text shader',
      code: msdfTextWGSL,
    });

    this.pipelinePromise = device.createRenderPipelineAsync({
      label: `msdf text pipeline`,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.fontBindGroupLayout, this.textBindGroupLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: colorFormat,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-strip',
        stripIndexFormat: 'uint32',
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: depthFormat,
      },
    });
  }

  async loadTexture(url) {
    const response = await fetch(url);
    const imageBitmap = await createImageBitmap(await response.blob());

    const texture = this.device.createTexture({
      label: `MSDF font texture ${url}`,
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );
    return texture;
  }

  async createFont(fontJsonUrl) {
    const response = await fetch(fontJsonUrl);
    const json = await response.json();

    const i = fontJsonUrl.lastIndexOf('/');
    const baseUrl = i !== -1 ? fontJsonUrl.substring(0, i + 1) : undefined;

    const pagePromises = [];
    for (const pageUrl of json.pages) {
      pagePromises.push(this.loadTexture(baseUrl + pageUrl));
    }

    const charCount = json.chars.length;
    const charsBuffer = this.device.createBuffer({
      label: 'MSDF character layout buffer',
      size: charCount * Float32Array.BYTES_PER_ELEMENT * 8,
      usage: GPUBufferUsage.STORAGE,
      mappedAtCreation: true,
    });

    const charsArray = new Float32Array(charsBuffer.getMappedRange());

    const u = 1 / json.common.scaleW;
    const v = 1 / json.common.scaleH;

    const chars = {};

    let offset = 0;
    for (const [i, char] of json.chars.entries()) {
      chars[char.id] = char;
      chars[char.id].charIndex = i;
      charsArray[offset] = char.x * u; // texOffset.x
      charsArray[offset + 1] = char.y * v; // texOffset.y
      charsArray[offset + 2] = char.width * u; // texExtent.x
      charsArray[offset + 3] = char.height * v; // texExtent.y
      charsArray[offset + 4] = char.width; // size.x
      charsArray[offset + 5] = char.height; // size.y
      charsArray[offset + 6] = char.xoffset; // offset.x
      charsArray[offset + 7] = -char.yoffset; // offset.y
      offset += 8;
    }

    charsBuffer.unmap();

    const pageTextures = await Promise.all(pagePromises);

    const bindGroup = this.device.createBindGroup({
      label: 'msdf font bind group',
      layout: this.fontBindGroupLayout,
      entries: [
        {
          binding: 0,
          // TODO: Allow multi-page fonts
          resource: pageTextures[0].createView(),
        },
        {
          binding: 1,
          resource: this.sampler,
        },
        {
          binding: 2,
          resource: { buffer: charsBuffer },
        },
      ],
    });

    const kernings = new Map();

    if (json.kernings) {
      for (const kearning of json.kernings) {
        let charKerning = kernings.get(kearning.first);
        if (!charKerning) {
          charKerning = new Map();
          kernings.set(kearning.first, charKerning);
        }
        charKerning.set(kearning.second, kearning.amount);
      }
    }

    return new MsdfFont(
      await this.pipelinePromise,
      bindGroup,
      json.common.lineHeight,
      chars,
      kernings
    );
  }

  formatText( font, text, options = {} ) {
    const textBuffer = this.device.createBuffer({
      label: 'msdf text buffer',
      size: (text.length + 6) * Float32Array.BYTES_PER_ELEMENT * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    const textArray = new Float32Array(textBuffer.getMappedRange());
    let offset = 24; // Accounts for the values managed by MsdfText internally.

    let measurements;
    if (options.centered) {
      measurements = this.measureText(font, text);

      this.measureText(
        font,
        text,
        (textX, textY, line, char) => {
          const lineOffset =
            measurements.width * -0.5 -
            (measurements.width - measurements.lineWidths[line]) * -0.5;

          textArray[offset] = textX + lineOffset;
          textArray[offset + 1] = textY + measurements.height * 0.5;
          textArray[offset + 2] = char.charIndex;
          offset += 4;
        }
      );
    } else {
      measurements = this.measureText(
        font,
        text,
        (textX, textY, line, char) => {
          textArray[offset] = textX;
          textArray[offset + 1] = textY;
          textArray[offset + 2] = char.charIndex;
          offset += 4;
        }
      );
    }

    textBuffer.unmap();

    const bindGroup = this.device.createBindGroup({
      label: 'msdf text bind group',
      layout: this.textBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraUniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: textBuffer },
        },
      ],
    });

    const encoder = this.device.createRenderBundleEncoder(
      this.renderBundleDescriptor
    );
    encoder.setPipeline(font.pipeline);
    encoder.setBindGroup(0, font.bindGroup);
    encoder.setBindGroup(1, bindGroup);
    encoder.draw(4, measurements.printedCharCount);
    const renderBundle = encoder.finish();

    const msdfText = new MsdfText(
      this.device,
      renderBundle,
      measurements,
      font,
      textBuffer
    );
    if (options.pixelScale !== undefined) {
      msdfText.setPixelScale(options.pixelScale);
    }

    if (options.color !== undefined) {
      msdfText.setColor(...options.color);
    }

    return msdfText;
  }

  measureText(
    font,
    text,
    charCallback
  ) {
    let maxWidth = 0;
    const lineWidths = [];

    let textOffsetX = 0;
    let textOffsetY = 0;
    let line = 0;
    let printedCharCount = 0;
    let nextCharCode = text.charCodeAt(0);
    for (let i = 0; i < text.length; ++i) {
      const charCode = nextCharCode;
      nextCharCode = i < text.length - 1 ? text.charCodeAt(i + 1) : -1;

      switch (charCode) {
        case 10: // Newline
          lineWidths.push(textOffsetX);
          line++;
          maxWidth = Math.max(maxWidth, textOffsetX);
          textOffsetX = 0;
          textOffsetY -= font.lineHeight;
        case 13: // CR
          break;
        case 32: // Space
          // For spaces, advance the offset without actually adding a character.
          textOffsetX += font.getXAdvance(charCode);
          break;
        default: {
          if (charCallback) {
            charCallback(
              textOffsetX,
              textOffsetY,
              line,
              font.getChar(charCode)
            );
          }
          textOffsetX += font.getXAdvance(charCode, nextCharCode);
          printedCharCount++;
        }
      }
    }

    lineWidths.push(textOffsetX);
    maxWidth = Math.max(maxWidth, textOffsetX);

    return {
      width: maxWidth,
      height: lineWidths.length * font.lineHeight,
      lineWidths,
      printedCharCount,
    };
  }

  updateCamera(projection, view) {
    this.cameraArray.set(projection, 0);
    this.cameraArray.set(view, 16);
    this.device.queue.writeBuffer(
      this.cameraUniformBuffer,
      0,
      this.cameraArray
    );
  }

  render(renderPass, text) {
    const renderBundles = text.map((t) => t.getRenderBundle());
    renderPass.executeBundles(renderBundles);
  }
}
