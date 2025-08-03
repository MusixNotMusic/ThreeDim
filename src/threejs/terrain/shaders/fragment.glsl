uniform sampler2D terrainTex;
varying vec2 vUv;

void main() {

    vec4 tex = texture2D(terrainTex, vUv);

    gl_FragColor = vec4(tex.rgb * 1.5, .27);

}