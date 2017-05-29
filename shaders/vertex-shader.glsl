uniform mat4 projectionMat;
uniform mat4 modelMat;

attribute vec3 aVertexPosition;
attribute vec3 aVertexColour;
attribute vec3 aVertexNormal;

varying lowp vec3 diffuseColour;
varying lowp vec3 worldSpaceVertexPos;
varying lowp vec3 eyeDirection;
varying lowp vec3 worldSpaceLightDirection;
varying lowp vec3 worldSpaceNormal;

void main() {
    // Light is located above the camera
    vec3 worldSpaceLightPos = vec3(0, 1, 0);
    vec4 worldSpaceVertexCoord = modelMat * vec4(aVertexPosition, 1.0);

    // Set the position
    gl_Position = projectionMat * worldSpaceVertexCoord;

    // And the varying values to be interpolated in the fragment shader
    worldSpaceVertexPos = worldSpaceVertexCoord.xyz;
    eyeDirection = vec3(0, 0, 0) - worldSpaceVertexPos;
    worldSpaceLightDirection = worldSpaceLightPos + eyeDirection;
    worldSpaceNormal = (modelMat * vec4(aVertexNormal, 1.0)).xyz;
    diffuseColour = aVertexColour;
}