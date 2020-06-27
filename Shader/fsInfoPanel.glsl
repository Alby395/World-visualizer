#version 300 es

precision mediump float;

in vec2 infoUVFS;

uniform sampler2D infoTexture;

out vec4 color;

void main()
{
    color = texture(infoTexture, infoUVFS);
}