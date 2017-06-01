uniform mat4 projectionMat;
uniform mat4 modelMat;

attribute vec3 aVertexPosition;
attribute vec3 aVertexColour;
attribute vec3 aVertexNormal;

varying lowp vec3 diffuseColour;
varying lowp vec3 cameraDirection;
varying lowp vec3 lightDirection;
varying lowp vec3 normal;

// Light is located above the camera
vec3 worldLightPos = vec3(0.0, 0.75, 0.0);
// Camera is located at origin
vec3 cameraPos = vec3(0, 0, 0);

void main() {
    // The world-space position
    vec4 worldPosition = modelMat * vec4(aVertexPosition, 1.0);
    // The screen-space position
    gl_Position = projectionMat * worldPosition;
    // The diffuse colour
    diffuseColour = aVertexColour;
    // The direction from the world-space position to the camera
    cameraDirection = normalize(cameraPos - worldPosition.xyz);
    // The direction from the world-space position to the light
    lightDirection = normalize(worldLightPos - worldPosition.xyz);
    // The world-space normal
    normal = normalize((modelMat * vec4(aVertexNormal, 0.0)).xyz);
}