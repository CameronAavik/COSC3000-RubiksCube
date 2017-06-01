precision mediump float;
varying lowp vec3 diffuseColour;
varying lowp vec3 cameraDirection;
varying lowp vec3 lightDirection;
varying lowp vec3 normal;

float lightPower = 1.3;
float shininess = 1.0;

#define PI 3.14159265359

void main() {
    // Create normalized versions of the normal, light direction, and cameron direction vectors
    vec3 n = normalize(normal);
    vec3 w_i = normalize(lightDirection);
    vec3 w_r = normalize(cameraDirection);

    // Calculate ambient light
    vec3 ambientLight = diffuseColour * 0.4;

    // Calculate diffuse light
    float cosTheta = clamp(dot(n, w_i), 0.0, 1.0);
    vec3 diffuseContribution = cosTheta * lightPower * diffuseColour;

    // Calculate specular light
    vec3 h = normalize(w_r + w_i);
    float specularReflection = ((shininess + 2.0)/(2.0*PI))*pow(dot(n, h), shininess);
    vec3 specularContribution = cosTheta * lightPower * specularReflection * diffuseColour;

    // Calculate the resulting colour
    vec3 resultingColour = ambientLight + diffuseContribution + specularContribution;
    gl_FragColor = vec4(resultingColour, 1.0);
}