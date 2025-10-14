var<private> rand_seed : vec2f;

fn init_rand(invocation_id : u32, seed : vec4f) {
  rand_seed = seed.xz;
  rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));
  rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));
}

fn rand() -> f32 {
  rand_seed.x = fract(cos(dot(rand_seed, vec2f(23.14077926, 232.61690225))) * 136.8168);
  rand_seed.y = fract(cos(dot(rand_seed, vec2f(54.47856553, 345.84153136))) * 534.7645);
  return rand_seed.y;
}

struct RenderParams {
  modelViewProjectionMatrix : mat4x4f,
  right : vec3f,
  up : vec3f
}

@binding(0) @group(0) var<uniform> render_params: RenderParams;

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    @location(2) quad_pos: vec2f, // -1 +1
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) quad_pos: vec2f,
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var quad_pos = mat2x3f(render_params.right, render_params.up) * in.quad_pos;
    var position = in.position + quad_pos * 0.01;
    var out: VertexOutput;
    out.position = render_params.modelViewProjectionMatrix * vec4f(position, 1.0);
    out.color = in.color;
    out.quad_pos = in.quad_pos;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    var color = in.color;
    color.a = color.a * max(1.0 - length(in.quad_pos), 0.0);
    return color;
}

struct SimulationParams {
    deltaTime: f32,
    brightnessFactor: f32,
    seed: vec4f,
}

struct Particle {
    position: vec3f,
    lifetime: f32,
    color: vec4f,
    velocity: vec3f,
}

struct Particles {
    particles: array<Particle>,
}

@binding(0) @group(0) var<uniform> sim_params: SimulationParams;
@binding(1) @group(0) var<storage, read_write> data: Particles;
@binding(2) @group(0) var texture: texture_2d<f32>;

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id: vec3u) {
    let idx = global_invocation_id.x;

    init_rand(idx, sim_params.seed);

    var particle = data.particles[idx];

    particle.velocity.z = particle.velocity.z - sim_params.deltaTime * 0.5;

    particle.position = particle.position + sim_params.deltaTime * particle.velocity;

    particle.lifetime = particle.lifetime - sim_params.deltaTime;
    particle.color.a = smoothstep(0.0, 0.5, particle.lifetime);

    if (particle.lifetime < 0.0) {
        var coord: vec2i;
        for(var level = u32(textureNumLevels(texture) - 1); level > 0; level--) {
            let probabilites = textureLoad(texture, coord, level);
            let value = vec4f(rand());
            let mask = (value >= vec4f(0.0, probabilites.xyz)) & (value < probabilites);
            coord = coord * 2;
            coord.x = coord.x + select(0, 1, any(mask.yw));
            coord.y = coord.y + select(0, 1, any(mask.zw));
        }

        let uv = vec2f(coord) / vec2f(textureDimensions(texture));
        particle.position = vec3f((uv - 0.5) * 3.0 * vec2f(1.0, -1.0), 0.0);
        particle.color = textureLoad(texture, coord, 0);
        particle.color.r *= sim_params.brightnessFactor;
        particle.color.g *= sim_params.brightnessFactor;
        particle.color.b *= sim_params.brightnessFactor;

        particle.velocity.x = (rand() - 0.5) * 0.1;
        particle.velocity.y = (rand() - 0.5) * 0.1;
        particle.velocity.z = rand() * 0.3;

        particle.lifetime = 0.5 + rand() * 3.0;
    }

    data.particles[idx] = particle;
}
