uniform mat4 projectionMat;
uniform mat4 cubeTranslationMat;
uniform mat4 cubeRotationMat;
uniform mat4 cubieTranslationMat;
uniform mat4 cubieRotationMat;

attribute vec3 aVertexPosition;
attribute vec3 aVertexColour;

varying lowp vec3 vColour;

void main() {
    gl_Position = cubeTranslationMat * cubeRotationMat * cubieTranslationMat * cubieRotationMat * vec4(aVertexPosition, 1.0);
    vColour = aVertexColour;
}