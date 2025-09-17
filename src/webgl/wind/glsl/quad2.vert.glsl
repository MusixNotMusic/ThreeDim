precision mediump float;

// in vec3 position;
// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform vec3 cameraPosition;
// uniform vec2 uv;

varying vec2 v_uv;

void main() {
    v_uv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
