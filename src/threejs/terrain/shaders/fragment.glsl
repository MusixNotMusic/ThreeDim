uniform sampler2D terrainTex;
uniform sampler2D tileTex;
varying vec2 vUv;

void main() {

    vec4 tex = texture2D(tileTex, vUv);

    gl_FragColor = vec4(tex.rgb * 1.5, 0.27);
    // gl_FragColor = vec4(tex.rgb * 1.5, .27);

}