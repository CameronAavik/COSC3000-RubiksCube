precision mediump float;
varying lowp vec3 vColour;

void main() {
    gl_FragColor = vec4(vColour, 1);
}