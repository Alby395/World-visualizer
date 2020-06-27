#version 300 es

in vec3 inPosition;
in vec2 a_uv;
in vec3 inNormal;

out vec3 normalFS;
out vec2 uvFS;
out vec3 posFS;

uniform mat4 matrix;
uniform mat4 worldMatrix;
uniform mat4 normalMatrix;

void main()
{
    uvFS = a_uv;
    normalFS = mat3(normalMatrix) * inNormal;
    
    posFS = (worldMatrix * vec4(inPosition, 1.0)).xyz;
    gl_Position = matrix * vec4(inPosition, 1.0);
}
