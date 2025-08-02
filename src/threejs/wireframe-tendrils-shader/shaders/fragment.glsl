uniform float uTime;
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {

    vec4 tex = texture2D(tDiffuse, vUv + uTime * 250.);

    gl_FragColor = vec4(tex.rgb * 1.5, .07);

}