#version 300 es

precision highp float;

in vec2 uvFS;
in vec3 normalFS;
in vec3 posFS;

uniform vec3    eyePos;
//LIGHT A
uniform bvec3   AType;
uniform vec4    AColor;
uniform vec3    ARotation;
uniform vec3    APosition;
uniform float   AConeIn;
uniform float   AConeOut;
uniform float   ADecay;
uniform float   ATarget;
uniform bvec2   ARefType;
uniform vec4    ARefColor;
uniform float   AGamma;
uniform bool    Atoon;
uniform float   AtoonTH;
uniform bool    ArefToon;
uniform float   ArefToonTH;

//LIGHT B
uniform bvec3   BType;
uniform vec4    BColor;
uniform vec3    BRotation;
uniform vec3    BPosition;
uniform float   BConeIn;
uniform float   BConeOut;
uniform float   BDecay;
uniform float   BTarget;
uniform bvec2   BRefType;
uniform vec4    BRefColor;
uniform float   BGamma;
uniform bool    Btoon;
uniform float   BtoonTH;
uniform bool    BrefToon;
uniform float   BrefToonTH;

//LIGHT C
uniform bvec3   CType;
uniform vec4    CColor;
uniform vec3    CRotation;
uniform vec3    CPosition;
uniform float   CConeIn;
uniform float   CConeOut;
uniform float   CDecay;
uniform float   CTarget;
uniform bvec2   CRefType;
uniform vec4    CRefColor;
uniform float   CGamma;
uniform bool    Ctoon;
uniform float   CtoonTH;
uniform bool    CrefToon;
uniform float   CrefToonTH;

//AMBIENT LIGHT
uniform bvec2   ambType;
uniform vec4    ambColor;
uniform vec4    ambBotColor;
uniform vec3    ambDirection;

out vec4 outColor;

uniform sampler2D u_texture;

vec3 lightDirection(bvec3 type, vec3 lightPosition, vec3 direction)
{
    if(type.x)
        return normalize(direction);
    
    if(type.y || type.z)
        return normalize(lightPosition - posFS);
    
    return vec3(0.0, 0.0, 0.0);
}

vec4 lightColor(vec4 lightColor, bvec3 type, float decay, float target, vec3 position, vec3 lightDirection, float coneOut, float coneIn)
{   
    if(type.x)
        return lightColor;
    
    vec3 lightObject = position - posFS;

    float compDecay;
    if(decay != 0.0)
        compDecay = pow(target/length(lightObject), decay);
    else
        compDecay = 1.0;
    
    if(type.y)
        return lightColor * compDecay;

    float coneOutCos = cos(radians(coneOut/2.0));
    float coneInCos = cos(radians(coneIn * coneOut/2.0));
    float cosSpot = dot(normalize(lightObject), lightDirection);  
    float coneDecay = clamp((cosSpot - coneOutCos)/(coneInCos - coneOutCos), 0.0, 1.0);
    
    return lightColor * compDecay * coneDecay;   
}

vec4 computeDiffuse(vec4 lightColor, vec3 lightDirection, vec4 diffColor, vec3 normalVec, bool toon, float threshold)
{
    float cosine = dot(lightDirection, normalVec);
    
    if(toon)
    {
        if(cosine >= threshold)
            return diffColor;
        else
            return vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    return diffColor * clamp(cosine, 0.0, 1.0);
}

vec4 computeReflection(bvec2 type, vec4 refColor, float gamma, vec3 direction, vec3 normal, bool toon, float threshold)
{
    vec3 eyeDir = normalize(eyePos - posFS);
    float reflection;
    
    if(type.x)
    {
        reflection = dot(eyeDir, (-reflect(direction, normal)));
    }
    else if(type.y)
    {
        reflection = dot(normal, normalize(direction + eyeDir));
    }
    else
        return vec4(0.0, 0.0, 0.0, 1.0);
    
    if(toon)
    {
        if(reflection >= threshold)
            return refColor;
        else
            return vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    return refColor * pow(clamp(reflection, 0.0, 1.0), gamma);
}

vec4 ambientLight(vec3 normal)
{
    if(ambType.x)
    {
        return ambColor;
    }
    
    if(ambType.y)
    {
        float cosAmb = dot(normal, normalize(ambDirection));
        
        return ((cosAmb + 1.0)/2.0) * ambColor + ((1.0 - cosAmb)/2.0) * ambBotColor;
    }
    
    return vec4(0.0, 0.0, 0.0, 1.0);
}

void main()
{
    vec3 normal = normalize(normalFS);
    vec4 texColor = texture(u_texture, uvFS);

    vec3 LADirection = lightDirection(AType, APosition, ARotation);
    vec4 LAColor = lightColor(AColor, AType, ADecay, ATarget, APosition, ARotation, AConeOut, AConeIn);
    vec4 diffuseA = computeDiffuse(LAColor, LADirection, texColor, normal, Atoon, AtoonTH);
    vec4 refA = computeReflection(ARefType, ARefColor, AGamma, LADirection, normal, ArefToon, ArefToonTH);
    
    vec3 LBDirection = lightDirection(BType, BPosition, BRotation);
    vec4 LBColor = lightColor(BColor, BType, BDecay, BTarget, BPosition, BRotation, BConeOut, BConeIn);
    vec4 diffuseB = computeDiffuse(LBColor, LBDirection, texColor, normal, Btoon, BtoonTH);
    vec4 refB = computeReflection(BRefType, BRefColor, BGamma, LBDirection, normal, BrefToon, BrefToonTH);

    vec3 LCDirection = lightDirection(CType, CPosition, CRotation);
    vec4 LCColor = lightColor(CColor, CType, CDecay, CTarget, CPosition, CRotation, CConeOut, CConeIn);
    vec4 diffuseC = computeDiffuse(LCColor, LCDirection, texColor, normal, Ctoon, CtoonTH);
    vec4 refC = computeReflection(CRefType, CRefColor, CGamma, LCDirection, normal, CrefToon, CrefToonTH);
    
    vec4 LAmbient = ambientLight(normal);
    
    vec4 res = LAColor * (diffuseA + refA) + LBColor * (diffuseB + refB) + LCColor * (diffuseC + refC) + LAmbient * texColor;
    
    outColor = vec4(clamp(res, 0.0, 1.0).rgb, 1.0);
}