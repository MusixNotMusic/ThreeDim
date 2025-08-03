uniform sampler2D terrainTex;
varying vec2 vUv;

void main() {

    vUv = uv;

    vec4 tex = texture2D(terrainTex, uv);

    float z = -10000.0 + ((tex.r * 256.0 * 256.0 + tex.g * 256.0 + tex.b) * 0.1);

    z = (z + 10000.0) - 50.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(position.x, position.y, z), 1.);
}