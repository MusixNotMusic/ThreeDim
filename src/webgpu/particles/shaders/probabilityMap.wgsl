struct UBO {
    width: u32,
}

@binding(0) @group(0) var<uniform> ubo: UBO;
@binding(1) @group(0) var<storage, read> buf_in: array<f32>;
@binding(2) @group(0) var<storage, read_write> buf_out: array<f32>;
@binding(3) @group(0) var tex_in: texture_2d<f32>;
@binding(3) @group(0) var tex_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(64)
fn import_level(@builtin(global_invocation_id) coord: vec3u) {
    _ = &buf_in;
    if (!all(coord.xy < vec2u(textureDimensions(tex_in)))) {
        return;
    }

    let offset = coord.x + coord.y * ubo.width;
    buf_out[offset] = textureLoad(tex_in, vec2i(coord.xy), 0).w;
}

@compute @workgroup_size(64)
fn export_level(@builtin(global_invocation_id) coord: vec3u) {
    if (!all(coord.xy < vec2u(textureDimensions(tex_out)))) {
        return;
    }

    let dst_offset = coord.x + coord.y * ubo.width;
    let src_offset = coord.x * 2u + coord.y * 2u * ubo.width;

    let a = buf_in[src_offset + 0u];
    let b = buf_in[src_offset + 1u];
    let c = buf_in[src_offset + 0u + ubo.width];
    let d = buf_in[src_offset + 1u + ubo.width];
    let sum = a + b + c + d;

    buf_out[dst_offset] = sum * 0.25;

    let probabilites = vec4f(a, a + b, a + b + c, sum) / max(sum, 0.0001);
    textureStore(tex_out, vec2i(coord.xy), probabilites);
}


