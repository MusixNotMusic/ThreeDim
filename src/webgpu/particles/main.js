import { mat4, vec3 } from 'wgpu-matrix';
import { GUI } from 'dat.gui';

import particleWGSL from './shaders/particle.wgsl';
import probabilityMapWGSL from './shaders/probabilityMap.wgsl';
import { quitIfWebGPUNotAvailable } from '../utils/expection';

const numberParticles = 50000;
const particlePositionOffset = 0;
const particleColorOffset = 4 * 4;
const particleInstanceByteSize = 
  3 * 4 + // position
  1 * 4 + // lifetime
  4 * 4 + // color
  3 * 4 + // velocity
  1 * 4;  // padding 

const canvas = document.querySelector('canvas');
const adapter = await navigator.gpu.requestAdapter({
featureLevel: 'compatibility'
});

const device = await adapter.requestDevice();
quitIfWebGPUNotAvailable(adapter, device);

const context = canvas.getContext('webgpu');

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;
const presentationFormat = 'rgba16float';

function configureContext() { 
    context.configure({
        device,
        format: presentationFormat,
        toneMapping: { mode: simulationParams.toneMappingMode },
    });
    hdrFolder.name = getHdrFolderName();
}

const particlesBuffer = device.createBuffer({
    size: numParticles * particleInstanceByteSize,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
});

const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
        module: device.createShaderModule({ code: particleWGSL }),
        buffers: [
            {
                arrayStride: particleInstanceByteSize,
                stepMode: 'instance',
                attributes: [
                    { shaderLocation: 0, offset: particlePositionOffset,  format: 'float32x3' },
                    { shaderLocation: 1, offset: particleColorOffset,  format: 'float32x4' },
                ]
            },
            {
                arrayStride: 2 * 4, // vec2f
                stepMode: 'vertex',
                attributes: [
                    { shaderLocation: 2, offset: 0, format: 'float32x2' },
                ]
            }
        ]
    },

    fragment: {
        module: device.createShaderModule({
            code: particleWGSL,
        }),
        targets: [
            {
              format: presentationFormat,
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'zero',
                  dstFactor: 'one',
                  operation: 'add',
                },
              },
            },
        ],
    },

    primitive: {
        topology: 'triangle-list',
    },

    depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus',
    }
})

const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const uniformBufferSize = 
    4 * 4 * 4 + // mvpMatrix
    3 * 4 + // right vec3f
    4 + // padding
    3 * 4 + // up vec3f
    4; // padding

const unifromBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const uniformBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: unifromBuffer,
            }
        }
    ]
})

const renderPassDescriptor = {
    colorAttachments: [
        {
            view: undefined,
            clearValue: [0, 0, 0, 1],
            loadOp: 'clear',
            storeOp: 'store'
        }
    ],
    depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
    }
};


//////////////////////////////////////////////////////////////////////////////
// Quad vertex buffer
//////////////////////////////////////////////////////////////////////////////
const quadVertexBuffer = device.craeteBuffer({
    size: 6 * 2 * 4, // 6 vertices * 2 floats * 4 bytes per float
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
})

const vertexData = [
    -1, -1,
    -1, +1,
    +1, -1,
    +1, -1,
    -1, +1,
    +1, +1,
]
new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
quadVertexBuffer.unmap();

//////////////////////////////////////////////////////////////////////////////
// Texture
//////////////////////////////////////////////////////////////////////////////
const isPowerOf2 = (v) => Math.log2(v) % 1 === 0;
const response = await fetch('/textures/webgpu.png');
const imageBitmap = await createImageBitmap(await response.blob());
console.warn(imageBitmap.width === imageBitmap.height, 'image must be square');
console.warn(isPowerOf2(imageBitmap.width), 'image must be a power of 2');

const mipLevelCount = (Math.log2(Math.max(imageBitmap.width, imageBitmap.height)) + 1) | 0;
const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    mipLevelCount,
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING 
        | GPUTextureUsage.STORAGE_BINDING 
        | GPUTextureUsage.COPY_DST 
        | GPUTextureUsage.RENDER_ATTACHMENT,
});

device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]
);



const probabilityMapImportLevelPipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: device.createShaderModule({ code: probabilityMapWGSL }),
      entryPoint: 'import_level',
    },
});

const probabilityMapExportLevelPipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
        module: device.createShaderModule({ code: probabilityMapWGSL }),
        entryPoint: 'export_level',
    },
});

const probabilityMapUBOBufferSize =
    1 * 4 + // stride
    3 * 4 + // padding
    0;

const probabilityMapUBOBuffer = device.createBuffer({
    size: probabilityMapUBOBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const buffer_a = device.createBuffer({
    size: texture.width * texture.height * 4,
    usage: GPUBufferUsage.STORAGE,
});

const buffer_b = device.createBuffer({
    size: buffer_a.size,
    usage: GPUBufferUsage.STORAGE,
});

device.queue.writeBuffer(
    probabilityMapUBOBuffer,
    0,
    new Uint32Array([texture.width])
);

const commandEncoder = device.createCommandEncoder();