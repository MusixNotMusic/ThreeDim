// @title: msdfText
const pos = array(vec2f(0, -1), vec2f(1, -1), vec2f(0, 0), vec2f(1, 0));

struct VertexInput {
    @builtin(vertex_index) vertex :u32,
    @builtin(instance_index) instance : u32,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
};

struct Char {
    texOffset: vec2f,
    texExtent: vec2f,
    size: vec2f,
    offset: vec2f,
};

struct FormattedText {
    tranform: mat4x4f,
    color: vec4f,
    scale: f32,
    chars: array<vec3f>,
};

struct Camera {
    projection: mat4x4f,
    view: mat4x4f,
};

@group(0) @binding(0) var fontTexture: texture_2d<f32>;
@group(0) @binding(1) var fontSampler: sampler;
@group(0) @binding(2) var<storage> chars: array<Char>;

@group(1) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(1) var<storage> text: FormattedText;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
   let textElement = text.chars[input.instance];
   let char = chars[u32(textElement.z)];
   let charPos = (pos[input.vertex] * char.size + textElement.xy + char.offset) * text.scale;

   var output: VertexOutput;
   output.position = camera.projection * camera.view *  text.tranform * vec4f(charPos, 0, 1); 
 
   output.texcoord = pos[input.vertex] * vec2f(1, -1);
   output.texcoord *= char.texExtent;
   output.texcoord += char.texOffset;

   return output;
}


fn sampleMsdf(texcoord: vec2f) -> f32 {
    let c = textureSample(fontTexture, fontSampler, texcoord);
    return max(min(c.r, c.g), min(max(c.r, c.g), c.b));
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let pxRange = 4.0;
    let sz = vec2f(textureDimensions(fontTexture, 0));
    let dx = sz.x * length(vec2f(dpdxFine(input.texcoord.x), dpdyFine(input.texcoord.x)));
    let dy = sz.y * length(vec2f(dpdxFine(input.texcoord.y), dpdyFine(input.texcoord.y)));
    let toPixels = pxRange * inverseSqrt(dx * dx + dy * dy);
    let sigDist = sampleMsdf(input.texcoord) - 0.5;
    let pxDist = sigDist * toPixels;

    let adgeWidth = 0.5;

    let alpha = smoothstep(-adgeWidth, adgeWidth, pxDist);

    if (alpha < 0.001) {
        discard;
    }

    return vec4f(text.color.rgb, text.color.a * alpha);
}