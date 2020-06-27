#version 300 es

in vec3 infoPosition;
in vec2 infoUV;

uniform mat4 infoMatrix;

out vec2 infoUVFS;

void main()
{
    infoUVFS = infoUV;
    gl_Position = infoMatrix * vec4(infoPosition, 1.0);
}