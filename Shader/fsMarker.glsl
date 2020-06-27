#version 300 es

precision mediump float;

in vec3 markerFS;
in vec4 colorFS;

uniform float markerAlpha;

out vec4 color;

void main()
{
    
    color = colorFS;   
}