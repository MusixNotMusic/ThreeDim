precision mediump float;

uniform sampler2D u_screen;
uniform float u_opacity;

varying vec2 v_uv;

void main() {
    vec4 color = texture2D(u_screen, 1.0 - v_uv);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}
