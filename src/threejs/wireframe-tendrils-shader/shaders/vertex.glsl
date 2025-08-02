uniform float uTime;
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {

    vUv = uv;

    vec4 tex = texture2D(tDiffuse, uv);

    float scrollSpeed = 75.;

    vec4 tex2 = texture2D(tDiffuse, vec2(tex.r + uTime * scrollSpeed, tex.b + (uTime * scrollSpeed * 1.234)));

gl_Position = projectionMatrix * modelViewMatrix * vec4(tex2.rgb - vec3(.5, .5, .5), 1.);

}