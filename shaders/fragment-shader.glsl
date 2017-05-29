precision mediump float;
varying lowp vec3 diffuseColour;
varying lowp vec3 worldSpaceVertexPos;
varying lowp vec3 eyeDirection;
varying lowp vec3 worldSpaceLightDirection;
varying lowp vec3 worldSpaceNormal;

void main() {
    // White light with intensity of 50
    vec3 lightColour = vec3(1, 1, 1);
    float lightPower = 5.0;
    // Light is located above the camera
    vec3 worldSpaceLightPos = vec3(0, 2, 0);
    // Create normalized versions of the normal, light direction, and eye direction vectors
    vec3 n = normalize(worldSpaceNormal);
    vec3 l = normalize(worldSpaceLightDirection);
    vec3 e = normalize(eyeDirection);
    // Define the ambient and specular colour (diffuse is passed in)
    vec3 ambientColour = vec3(0.5, 0.5, 0.5) * diffuseColour;
    vec3 specularColor = vec3(0.1, 0.1, 0.1);
    // Calculate the distance from the light
    float distanceToLight = length(worldSpaceLightPos - worldSpaceVertexPos);
    // Calculate cosine of the angle between the normal and the light, but clamping between 0 and 1
    float cosTheta = clamp(dot(n, l), 0.0, 1.0);
    vec3 r = reflect(-l, n);
    float cosAlpha = clamp(dot(e, r), 0.0, 1.0);    
    // Calculate the fragment colour
    gl_FragColor = vec4(ambientColour + 
                   diffuseColour * lightColour * lightPower * cosTheta / (distanceToLight*distanceToLight) +
                   specularColor * lightColour * lightPower * pow(cosAlpha, 5.0) / (distanceToLight*distanceToLight), 1.0);

}