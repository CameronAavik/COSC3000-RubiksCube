uniform mat4 projectionMat;
uniform mat4 modelMat;

attribute vec3 aVertexPosition;
attribute vec3 aVertexColour;

varying lowp vec3 vColour;

void main() {
    gl_Position = projectionMat * modelMat * vec4(aVertexPosition, 1.0);
    vColour = aVertexColour;
}