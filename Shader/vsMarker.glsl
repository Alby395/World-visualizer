#version 300 es

in vec3 markerPosition;
in vec4 markerColor;

out vec4 colorFS;
out vec3 markerFS;
uniform mat4 markerMatrix;

void main()
{
    colorFS = markerColor;
    markerFS = markerPosition;
    gl_Position = markerMatrix * vec4(markerPosition, 1.0);
}