var program = [];
var gl;
var canvas;
var infoCanvas;
var canvasTexture;
var ctx;
var checkbox;

var width;
var height;

//EVENT VARIABLES
var mouseState = false;
var lastMouseX = 0;
var lastMouseY = 0;

var lat = 0.0;
var long = 0.0;
var latRad = 0.0;
var longRad = 0.0;

var markerMatrix = utils.identityMatrix();
var markerRingMatrix = utils.identityMatrix();
var infoMatrix = utils.identityMatrix();
var showInfo = false;

var selectedCity = -1;
var lookRadius = 10.0;

//ANIMATION VARIABLES
var blockRotation = false;
var quaternions;

var speedTime = 1.7;
var lastTime = 0.0;
var time = 0.0;

var infoAnim = false;
var prevInfoStatus = false;
//MATRIX
var perspectiveMatrix;
var viewMatrix;
var rotationMatrix;

//MODEL
var earthVertices;
var earthIndices;
var earthTexCoord;
var earthNormal;
var image;

//LIGHT CLASS
class LightClass
{
    constructor(lightName)
    {
        this._lightName     = lightName;
        
        this._type          = "None";
        this._typeVal       = [false, false, false];
        
        this._colorHex      = "#FFFFFF";
        this._color         = [1.0, 1.0, 1.0];
        
        this._toon          = false;
        this._toonTH        = 0.5;
        
        this._phi           = 0.0;
        this._theta         = 90.0;
        this._rotVect       = [0, 0, 0];
        
        this._x             = 0.0;
        this._y             = 0.0;
        this._z             = 80.0;
        
        this._decay         = 1.0;
        this._target        = 50.0;
        
        this._coneOut       = 80.0;
        this._coneIn        = 50.0;
        
        this._refType       = "None";
        this._refTypeVal    = [false, false];
        this._refColorHex   = "#FFFFFF";
        this._refColor      = [1.0, 1.0, 1.0];
        this._gamma         = 100.0;
        this._refToon       = false;
        this._refToonTH     = 0.5;
        
        this._event         = new Event("change");
        
        this._uniforms      = [];
    }
    
    setUniforms()
    {
        this._uniforms["type"]      = gl.getUniformLocation(program[0], this._lightName + "Type");
        this._uniforms["color"]     = gl.getUniformLocation(program[0], this._lightName + "Color");
        
        this._uniforms["toon"]      = gl.getUniformLocation(program[0], this._lightName + "toon");
        this._uniforms["toonTH"]    = gl.getUniformLocation(program[0], this._lightName + "toonTH");
        
        this._uniforms["rotation"]  = gl.getUniformLocation(program[0], this._lightName + "Rotation");
        this._uniforms["position"]  = gl.getUniformLocation(program[0], this._lightName + "Position");
        
        this._uniforms["coneIn"]    = gl.getUniformLocation(program[0], this._lightName + "ConeIn");
        this._uniforms["coneOut"]   = gl.getUniformLocation(program[0], this._lightName + "ConeOut");
        this._uniforms["decay"]     = gl.getUniformLocation(program[0], this._lightName + "Decay");
        this._uniforms["target"]    = gl.getUniformLocation(program[0], this._lightName + "Target");
        
        this._uniforms["refType"]   = gl.getUniformLocation(program[0], this._lightName + "RefType");
        this._uniforms["refColor"]  = gl.getUniformLocation(program[0], this._lightName + "RefColor");
        this._uniforms["gamma"]     = gl.getUniformLocation(program[0], this._lightName + "Gamma");
        
        this._uniforms["refToon"]   = gl.getUniformLocation(program[0], this._lightName + "refToon");
        this._uniforms["refToonTH"] = gl.getUniformLocation(program[0], this._lightName + "refToonTH");
        
    }
    
    update()
    {
        this._type = document.getElementById("light-type").value;
        
        switch (this._type)
        {
            case "Directional" :    this._typeVal = [1, 0, 0];
                                    break;
                
            case "Point":           this._typeVal = [0, 1, 0];
                                    break;
            
            case "Spotlight":       this._typeVal = [0, 0, 1];
                                    break;
            
            default:                this._typeVal = [0, 0, 0];
                
        }
        
        if(this._type == "None")
            return;

        this._toon = document.getElementById("light-toon").checked;
        
        if(this._toon)
        {
            this._toonTH = document.getElementById("light-toon-threshold").value;
        }
        
        this._colorHex = document.getElementById("light-color").value;
        this._color = decodeColor(this._colorHex); 

        this._refType = document.getElementById("ref-type").value;
        
        switch (this._refType)
        {
            case "Phong" :    this._refTypeVal  = [1, 0];
                              break;
                
            case "Blinn":     this._refTypeVal  = [0, 1];
                              break;
        
            default:          this._refTypeVal  = [0, 0];
                
        }
        
        if(this._refType != "None")
        {
            this._refColorHex = document.getElementById("ref-color").value;
            this._refColor = decodeColor(this._refColorHex);
            this._gamma = document.getElementById("gamma").value;
            
            this._refToon = document.getElementById("ref-toon").checked;
        
            if(this._refToon)
            {
                this._refToonTH = document.getElementById("ref-toon-threshold").value;
            }
        }
        
        if(this._type == "Directional")
        {
            this._theta = document.getElementById("theta-rot").value;
            this._phi = document.getElementById("phi-rot").value;
            this.updateRotValue();
            return;
        }

        if(this._type == "Spotlight")
        {
            this._theta = document.getElementById("theta-rot").value;
            this._phi = document.getElementById("phi-rot").value;
            this.updateRotValue();
            this._coneIn = document.getElementById("cone-in").value;
            this._coneOut = document.getElementById("cone-out").value;
        }
          
        this._x = document.getElementById("x-pos").value;
        this._y = document.getElementById("y-pos").value;
        this._z = document.getElementById("z-pos").value;
        this._decay = document.getElementById("decay").value;
        this._target = document.getElementById("distance").value;
    }
    
    load()
    {
        document.getElementById("light-type").value     = this._type;
        document.getElementById("light-type").dispatchEvent(this._event);
        
        document.getElementById("light-toon").checked     = this._toon;
        document.getElementById("light-toon-threshold").value = this._toonTH;
        
        document.getElementById("ref-type").value       = this._refType;
        document.getElementById("ref-type").dispatchEvent(this._event);
        
        document.getElementById("ref-toon").checked    = this._refToon;
        document.getElementById("ref-toon-threshold").value = this._refToonTH;
        
        document.getElementById("ref-color").value      = this._refColorHex;
        document.getElementById("gamma").value          = this._gamma;

        document.getElementById("light-color").value    = this._colorHex; 

        document.getElementById("theta-rot").value      = this._theta;
        document.getElementById("phi-rot").value        = this._phi;
        document.getElementById("cone-in").value        = this._coneIn;
        document.getElementById("cone-out").value       = this._coneOut;
          
        document.getElementById("x-pos").value          = this._x;
        document.getElementById("y-pos").value          = this._y;
        document.getElementById("z-pos").value          = this._z;
        document.getElementById("decay").value          = this._decay;
        document.getElementById("distance").value       = this._target;

    }
    
    webGl()
    {

        gl.uniform3iv(this._uniforms["type"],       this._typeVal);
        gl.uniform4f(this._uniforms["color"],       this._color[0], this._color[1], this._color[2], 1.0);
        
        gl.uniform1i(this._uniforms["toon"],        this._toon);
        gl.uniform1f(this._uniforms["toonTH"],      this._toonTH/100.0);
        
        gl.uniform3fv(this._uniforms["rotation"],   this._rotVect);
        gl.uniform3f(this._uniforms["position"],    this._x/10, this._y/10, this._z/10);
        
        gl.uniform1f(this._uniforms["coneIn"],      this._coneIn/100);
        gl.uniform1f(this._uniforms["coneOut"],     this._coneOut);
        gl.uniform1f(this._uniforms["decay"],       this._decay);
        gl.uniform1f(this._uniforms["target"],      this._target/10);
        
        gl.uniform2fv(this._uniforms["refType"],    this._refTypeVal);
        gl.uniform4f(this._uniforms["refColor"],    this._refColor[0], this._refColor[1], this._refColor[2], 1.0);
        gl.uniform1f(this._uniforms["gamma"],       this._gamma);
        
        gl.uniform1i(this._uniforms["refToon"],        this._refToon);
        gl.uniform1f(this._uniforms["refToonTH"],      this._refToonTH/100.0);
    }
    
    updateRotValue()
    {
        var thetaR = utils.degToRad(this._theta);
        var phiR = utils.degToRad(this._phi);
        this._rotVect[0] = Math.sin(thetaR) * Math.sin(phiR);
        this._rotVect[1] = Math.cos(thetaR);
        this._rotVect[2] = Math.sin(thetaR) * Math.cos(phiR);
    }

}

var lights = [new LightClass("A"), new LightClass("B"), new LightClass("C")];
var current = 0;

//EVENT HANDLER
function mouseDown(event)
{
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    mouseState = true;
}

function mouseUp(event)
{
    mouseState = false;
    lastMouseX = 0;
    lastMouseY = 0;
    deltaLat = 0.0;
    deltaLong = 0.0;
    
}

function mouseMove(event)
{
    if(mouseState && !blockRotation)
    {
        var dx = event.pageX - lastMouseX;
        var dy = event.pageY - lastMouseY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if(dx != 0.0 || dy != 0.0)
        {    
            lat = clamp(lat + 0.5 * dy, -90.0, 90.0);
            long = period(long + 0.5 * dx, -180.0, 180.0, 0.5 * dx);
        }
    }
}

function mouseWheel(event)
{
    if(!blockRotation)
    {
        var nLookRadius = lookRadius + event.wheelDelta/1000.0;

        if(nLookRadius > 6.0 && nLookRadius < 10.0)
            lookRadius = nLookRadius;
    }
}

//MAIN SCRIPT
function main()
{
    init();
    
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl2", {  premultipliedAlpha: false});
    
    var toResize = false;
    window.onresize = updateCanvasDimension;
    canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("mousewheel", mouseWheel, false);
    
    var a;
    updateCanvasDimension();
    
    infoCanvas = document.getElementById("infoCanvas");
    infoCanvas.width = 512;
    infoCanvas.height = 512;
    infoCanvas.clientWidth = 512;
    infoCanvas.clientHeight = 512;
    ctx = infoCanvas.getContext("2d");
    var shaderDir = "http://127.0.0.1:8887/WorldBased/Shader/";	
    var modelsDir = "http://127.0.0.1:8887/WorldBased/Asset/";
 
    if(!gl)
    {   
        return;
    }
    
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    utils.loadFiles([shaderDir + 'vsPlanet.glsl', shaderDir + 'fsPlanet.glsl'], loadShader);
    utils.loadFiles([shaderDir + 'vsMarker.glsl', shaderDir + 'fsMarker.glsl'], loadShader);
    utils.loadFiles([shaderDir + 'vsInfoPanel.glsl', shaderDir + 'fsInfoPanel.glsl'], loadShader);

    
    var vao = [gl.createVertexArray(), gl.createVertexArray(), gl.createVertexArray(), gl.createVertexArray()];
    
    //Marker initialization
    gl.useProgram(program[1]);
    gl.bindVertexArray(vao[1]);
    
    var markerVertexLocation = gl.getAttribLocation(program[1], "markerPosition");
    var markerVertexBuffer = gl.createBuffer();
    var xSpike = 0.135;
    var ySpike = 0.27;
    var yCenter = 0.19;
    var r = 2/3;
    var xMiddle = (yCenter * r) * xSpike/ySpike;
    
    var markerVertices = [0.0, 0.0, 0.0,
                          0.0, yCenter * r, 0.0,
                          xMiddle, yCenter * r, 0.0,
                          xSpike, ySpike, 0.0,
                          0.0, yCenter, 0.0,
                          -xSpike, ySpike, 0.0,
                          -xMiddle, yCenter * r, 0.0];
    
    var markerIndices = [   0, 2, 1,
                            1, 2, 3,
                            1, 3, 4,
                            1, 4, 5,
                            1, 5, 6,
                            0, 1, 6
                        ];

    var colorIn = [255.0 / 255.0, 95.0 / 255.0, 0.0 / 255.0];
    var colorOut = [140.0 / 255.0, 38.0 / 255.0, 0 / 255.0];
    var markerColors = [
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                            colorIn[0], colorIn[1], colorIn[2], 1.0,
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                            colorOut[0], colorOut[1], colorOut[2], 1.0,
                        ];
    
    
    var markerIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, markerIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(markerIndices), gl.STATIC_DRAW);
    
    var colorBuffer = gl.createBuffer();
    var colorLocation = gl.getAttribLocation(program[1], "markerColor");
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(markerColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
        
    gl.bindBuffer(gl.ARRAY_BUFFER, markerVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(markerVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(markerVertexLocation);
    gl.vertexAttribPointer(markerVertexLocation, 3, gl.FLOAT, false, 0, 0);
    
    var markerMatrixLocation = gl.getUniformLocation(program[1], "markerMatrix");
    var markerAlphaUniform = gl.getUniformLocation(program[1], "markerAlpha");
    
    //Info panel initialization
    gl.useProgram(program[2]);
    gl.bindVertexArray(vao[2]);
    
    var infoVertexPosition = gl.getAttribLocation(program[2], "infoPosition");
    var infoVertexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, infoVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.6, -0.6, 0.0, 0.6, 0.6, 0.0, -0.6, 0.6, 0.0, -0.6, -0.6, 0.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(infoVertexPosition);
    gl.vertexAttribPointer(infoVertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    var infoIndBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, infoIndBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 2, 3, 0]), gl.STATIC_DRAW);
    
    var uvInfoBuffer = gl.createBuffer();
    var uvInfoLocation = gl.getAttribLocation(program[2], "infoUV")
    gl.bindBuffer(gl.ARRAY_BUFFER, uvInfoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvInfoLocation);
    gl.vertexAttribPointer(uvInfoLocation, 2, gl.FLOAT, false, 0, 0);
     
    var infoMatrixUniform = gl.getUniformLocation(program[2], "infoMatrix");
    
    canvasTexture = gl.createTexture();
    var infoTextureLocation = gl.getUniformLocation(program[2], "infoTexture");
    
    //Background
    gl.bindVertexArray(vao[3]);
    
    var backgroundVertexPosition = gl.getAttribLocation(program[2], "infoPosition");
    var backgroundVertexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([2.0, -1.0, 0.0, 2.0, 1.0, 0.0, -2.0, 1.0, 0.0, -2.0, -1.0, 0.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(backgroundVertexPosition);
    gl.vertexAttribPointer(backgroundVertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    var backgroundIndBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, backgroundIndBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 2, 3, 0]), gl.STATIC_DRAW);
    
    var uvBackgroundBuffer = gl.createBuffer();
    var uvBackgroundLocation = gl.getAttribLocation(program[2], "infoUV")
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBackgroundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvBackgroundLocation);
    gl.vertexAttribPointer(uvBackgroundLocation, 2, gl.FLOAT, false, 0, 0);
     
    var backgroundMatrixUniform = gl.getUniformLocation(program[2], "infoMatrix");
    
    var backgroundTexture = gl.createTexture();
    var backgroundTextureLocation = gl.getUniformLocation(program[2], "infoTexture");
    
    var backImage = new Image();
    backImage.src = modelsDir + "stars.jpg";
    backImage.onload = loadTextureBackground;
    
    var backMatrix = utils.MakeScaleMatrix(12.5);
    backMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(0.0, 0.0, -15.0 + lookRadius), backMatrix);
    
    //Planet initialization
    gl.useProgram(program[0]);

    gl.enable(gl.DEPTH_TEST);

    utils.get_json(modelsDir + "Earth2k.json", loadModel);

    var positionAttributeLocation = gl.getAttribLocation(program[0], "inPosition");
    var uvAttributeLocation = gl.getAttribLocation(program[0], "a_uv");
    var normalAttributeLocation = gl.getAttribLocation(program[0], "inNormal");
    
    var textureLocation = gl.getUniformLocation(program[0], "u_texture");
    var matrixLocation = gl.getUniformLocation(program[0], "matrix");
    
    gl.bindVertexArray(vao[0]);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earthVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earthTexCoord), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(earthIndices), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earthNormal), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    
    var textLocation = gl.getUniformLocation(program[0], "u_texture");
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var planetTexture = gl.createTexture();

    var cameraPos = gl.getUniformLocation(program[0], "eyePos");
    
    lights[0].setUniforms();
    lights[1].setUniforms();
    lights[2].setUniforms();
    
    var ambUniforms = [];
    
    var wmUniform = gl.getUniformLocation(program[0], "worldMatrix");
    var nmUniform = gl.getUniformLocation(program[0], "normalMatrix");
    
    ambUniforms["type"]         = gl.getUniformLocation(program[0], "ambType");
    ambUniforms["color"]        = gl.getUniformLocation(program[0], "ambColor");
    ambUniforms["botColor"]     = gl.getUniformLocation(program[0], "ambBotColor");
    ambUniforms["direction"]    = gl.getUniformLocation(program[0], "ambDirection");
    
    image = new Image();
    image.src = modelsDir + "EarthTex.png";
    image.onload = loadTexture;    
    
    
    function loadModel(model)
    {
        earthVertices = model.meshes[0].vertices;
        earthIndices = [].concat.apply([], model.meshes[0].faces);
        earthTexCoord = model.meshes[0].texturecoords[0];
        earthNormal = model.meshes[0].normals;
    }
    
    function loadShader(shader)
    {
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, shader[0]);
        gl.compileShader(vertexShader);
        
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
            alert("ERROR IN VS SHADER : "+gl.getShaderInfoLog(vertexShader));
        }
        
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shader[1]);
        gl.compileShader(fragmentShader);
        
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
            alert("ERROR IN FS SHADER : "+gl.getShaderInfoLog(fragmentShader));
        }
        program.push(gl.createProgram());
        gl.attachShader(program[program.length - 1] , vertexShader);
        gl.attachShader(program[program.length - 1], fragmentShader);
        gl.linkProgram(program[program.length - 1]);
        
    }
    
    function loadTexture()
    {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, planetTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        drawScene();
    }
    
    function loadTextureBackground()
    {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    }
    
    function drawScene()
    {
        if(toResize)
        {
            updateCanvasDimension();
            toResize = false;
        }
        
        if(blockRotation)
        {
            rotationMatrix = makeViewRotation(); 
        }
        else
        {
            longRad = utils.degToRad(long);
            latRad = utils.degToRad(lat);
            rotationMatrix = Quaternion.fromEuler(0.0, latRad, longRad).toMatrix4();
            viewMatrix = utils.MakeView(0, 0, lookRadius, 0, 0);
        }
        
        drawPlanet();
        drawBackground();
        if(selectedCity != -1)
        {
            drawMarker();
            if((showInfo || infoAnim) && !blockRotation)
                drawInfoPanel();
        }            
        
        window.requestAnimationFrame(drawScene);

    }
    
    function drawPlanet()
    {
        //updateCanvasDimension();
        gl.useProgram(program[0]);
        var vwmatrix = utils.multiplyMatrices(viewMatrix, rotationMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, vwmatrix);
        var normalMatrix = utils.invertMatrix(utils.transposeMatrix(vwmatrix));

        lights[current].update();
        for(var i = 0; i < lights.length; i++)
        {
            lights[i].webGl();
        };
        
        loadAmbientLight();
        
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(wmUniform, gl.FALSE, utils.transposeMatrix(rotationMatrix));
        gl.uniformMatrix4fv(nmUniform, gl.FALSE, utils.transposeMatrix(normalMatrix));
        gl.uniform3f(cameraPos, 0.0, 0.0, lookRadius);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(textLocation, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(vao[0]);
        gl.drawElements(gl.TRIANGLES, earthIndices.length, gl.UNSIGNED_SHORT, 0);
        
        
    }
    
    function drawBackground()
    {
        gl.useProgram(program[2]);
        gl.bindVertexArray(vao[3]);
        
        var matrix = utils.multiplyMatrices(viewMatrix, backMatrix);
        matrix = utils.multiplyMatrices(perspectiveMatrix, matrix);

        gl.uniformMatrix4fv(backgroundMatrixUniform, gl.FALSE, utils.transposeMatrix(matrix));
        
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.uniform1i(backgroundTextureLocation, 2);
        
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); 
    }
    
    function drawMarker()
    {
        gl.useProgram(program[1]);
        gl.bindVertexArray(vao[1]);
        
        var matrix = utils.multiplyMatrices(rotationMatrix, markerMatrix);
        matrix = utils.multiplyMatrices(viewMatrix, matrix);
        matrix = utils.multiplyMatrices(perspectiveMatrix, matrix);
        
        gl.uniformMatrix4fv(markerMatrixLocation, gl.FALSE, utils.transposeMatrix(matrix));
        gl.uniform1f(markerAlphaUniform, 1.0);
        
        gl.drawElements(gl.TRIANGLES, markerIndices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    function drawInfoPanel()
    {
        gl.useProgram(program[2]);
        gl.bindVertexArray(vao[2]);
        var matrix;
        if(checkbox.checked)
        {
            var x = 0.0;//2.46;
            var y = 0.0;//-0.925;
            matrix = utils.MakeTranslateMatrix(x , y, lookRadius - 2.78);
        }
        else
            matrix = utils.multiplyMatrices(rotationMatrix, infoMatrix);
        
        if(infoAnim)
        {
            var now = (new Date()).getTime();
            time += (now - lastTime) / 1000;
            lastTime = now;
            
            var size;
            if(showInfo)
                size = lerp(0.01, 1.0, time/0.3);
            else
                size = lerp(1.0, 0.01, time/0.3);
            matrix = utils.multiplyMatrices(matrix, utils.MakeScaleMatrix(size));
            if(time >= 0.30)
            {
                infoAnim = false;
                time = 0.0;
            }
        }
        matrix = utils.multiplyMatrices(viewMatrix, matrix);
        matrix = utils.multiplyMatrices(perspectiveMatrix, matrix);

        gl.uniformMatrix4fv(infoMatrixUniform, gl.FALSE, utils.transposeMatrix(matrix));
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
        gl.uniform1i(infoTextureLocation, 1);
        
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); 
    }
    
    function updateCanvasDimension()
    {
        var height = canvas.clientHeight;
        var width = canvas.clientWidth;
        if(canvas.width != width || canvas.height != height)
        {
            canvas.width = width;
            canvas.height = height;
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.viewport(0.0, 0.0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            perspectiveMatrix = utils.MakePerspective(60, width/height, 0.1, 1000.0);
            a = width/height;
            toResize = true;
        }
    }
    
    function loadAmbientLight()
    {
        var typeVec;
        
        switch(document.getElementById("amb-type").value)
        {
            case "Ambient":     typeVec = [1, 0];
                                break;
                
            case "Hemispheric": typeVec = [0, 1];
                                break;
            
            default:            typeVec = [0, 0];
        }
        
        gl.uniform2iv(ambUniforms["type"], typeVec);
        
        var color = decodeColor(document.getElementById("amb-color").value);
        gl.uniform4f(ambUniforms["color"], color[0], color[1], color[2], 1.0);
        
        color = decodeColor(document.getElementById("amb-bot-color").value);
        gl.uniform4f(ambUniforms["botColor"], color[0], color[1], color[2], 1.0);
        
        var theta   = utils.degToRad(document.getElementById("amb-theta-rot").value);
        var phi     = utils.degToRad(document.getElementById("amb-phi-rot").value);

        var rot = [];
        rot[0] = Math.sin(theta) * Math.sin(phi);
        rot[1] = Math.cos(theta);
        rot[2] = Math.sin(theta) * Math.cos(phi);
        

        gl.uniform3fv(ambUniforms["direction"], rot);
    }
}

function makeView()
{    
    camX = lookRadius * Math.sin(longRad) * Math.cos(latRad);
    camY = lookRadius * Math.sin(latRad);
    camZ = lookRadius * Math.cos(latRad) * Math.cos(longRad);
    
    return utils.MakeView(camX, camY, camZ, -lat, long);
}

function clamp(value, min, max)
{
    if(value < min)
        return min;
    
    if(value > max)
        return max;
    
    return value;
}

function period(value, start, end, inc)
{
    if(value < start)
        return end + (inc - Math.abs(start - value));
    
    if(value > end)
        return start - (inc - Math.abs(end - value));
    
    return value;
}

function decodeColor(color)
{
    var r = parseInt(color.substr(1,2), 16)/255;
    var g = parseInt(color.substr(3,2), 16)/255;
    var b = parseInt(color.substr(5,2), 16)/255;

    return [r, g, b];
}

function init()
{
    //Light menu button event
    var elem = document.getElementsByClassName("light-button");

    for(var i = 0; i < elem.length; i++)
    {      
        elem[i].addEventListener("click", function()
        {
            if(this.name == "light")
            {
                document.getElementById("light-menu").style.display = "block";
                document.getElementById("general-lights").style.display = "none";
            }
            else
            {
                document.getElementById("light-menu").style.display = "none";
                document.getElementById("general-lights").style.display = "block";
            }
        });  
    }
    
    //Light type SELECT event
    document.getElementById("light-type").addEventListener("change", function()
    {        
        if(this.value == "None")
        {
            document.getElementById("light-settings-div").style.display = "none";
            
            return;
        }
        else
        {
            document.getElementById("light-settings-div").style.display = "block";
            
            if(this.value == "Directional")
            {
                document.getElementById("rot-values-table").style.display = "table";
                document.getElementById("pos-values-table").style.display = "none";
                document.getElementById("info-values-table").style.display = "none";
                
                //TODO Add assignment of type
                
                return;
            }
            
            if(this.value == "Point")
            {
                document.getElementById("rot-values-table").style.display = "none";
                document.getElementById("pos-values-table").style.display = "table";
                document.getElementById("info-values-table").style.display = "table";
                
                document.getElementById("cone-out-row").style.display = "none";
                document.getElementById("cone-in-row").style.display = "none";
                
                return;
            }
            
            if(this.value == "Spotlight")
            {
                document.getElementById("rot-values-table").style.display = "table";
                document.getElementById("pos-values-table").style.display = "table";
                document.getElementById("info-values-table").style.display = "table";
                
                document.getElementById("cone-out-row").style.display = "";
                document.getElementById("cone-in-row").style.display = "";
            }
            
        }
    });
    
    //Ambient light SELECT event
    elem = document.getElementById("amb-type");
    elem.addEventListener("change", function()
    {        
        if(this.value == "None")
        {
            document.getElementById("amb-color-row").style.display = "none";
            document.getElementById("amb-bot-row").style.display = "none";
            document.getElementById("theta-row").style.display = "none";
            document.getElementById("phi-row").style.display = "none";
        }
        else
        {
            document.getElementById("amb-color-row").style.display = "";
            
            if(this.value == "Hemispheric")
            {
                document.getElementById("amb-bot-row").style.display = "";
                document.getElementById("theta-row").style.display = "";
                document.getElementById("phi-row").style.display = "";

            }
            else
            {
                document.getElementById("amb-bot-row").style.display = "none";
                document.getElementById("theta-row").style.display = "none";
                document.getElementById("phi-row").style.display = "none";
            }
        }
    });
    elem.value = "Ambient";
    elem.dispatchEvent(new Event("change"));
    
    document.getElementById("light-option-button").addEventListener("click", function()
    {
        var div = document.getElementById("light-controller");
        
        if(div.style.display == "none" || div.style.display == "")
        {
            div.style.display = "block";
        }
        else
        {
            div.style.display = "none";
        }
        
    });
    
    document.getElementById("light-selection").addEventListener("change", function()
    {
        lights[current].update();
        
        var sel = this.value;
        
        current = sel.charCodeAt(6) - 'A'.charCodeAt(0);
        
        lights[current].load();
    });
    
    document.getElementById("ref-type").addEventListener("change", function()
    {
        if(this.value == "None")
        {
            document.getElementById("ref-color-row").style.display = "none";
            document.getElementById("ref-gamma-row").style.display = "none";
    
            return;
        } 
        
        document.getElementById("ref-color-row").style.display = "";
        document.getElementById("ref-gamma-row").style.display = "";
        
    });
    
    lights[current]._type = "Directional";
    
    lights[current].load();
    
    elem = document.getElementById("city-select");
    
    for(var i = 0; i < cities.length; i++)
    {
        var option = document.createElement("option");
        
        option.value = i;
        
        option.appendChild(document.createTextNode(cities[i].cityName));
        
        elem.appendChild(option);  
    };
    
    document.getElementById("go-button").addEventListener("click", activatePlace);
    
    document.getElementById("show-button").addEventListener("click", function()
    {   
        if(!blockRotation)
        {
            showInfo = !showInfo;
            lastTime = (new Date()).getTime();
            time = 0.0;
            infoAnim = true;
        }
    })
    
    checkbox = document.getElementById("fixed-info");
}

function activatePlace()
{
    selectedCity = parseInt(document.getElementById("city-select").value);

    if(selectedCity == -1 || blockRotation || (-long == cities[selectedCity].longitude && lat == cities[selectedCity].latitude))
        return;
    
    showInfo = false;
    quaternions = [];
    
    var city = cities[selectedCity];
    var latCity = utils.degToRad(city.latitude);
    var longCity = utils.degToRad(-city.longitude);
    
    updateTexture(city);
    
    blockRotation = true;
    
    var x = Math.cos(latCity) * Math.sin(-longCity);
    var y = Math.sin(latCity);
    var z = Math.cos(latCity) * Math.cos(longCity);
    var distance;
    quaternions[0] = Quaternion.fromEuler(0.0, latRad, longRad);
    
    if(Math.sign(long) != Math.sign(city.longitude))
        distance = Math.abs(-long - city.longitude);
    else
    {
        var pathOne = Math.abs(-long - city.longitude);
        var pathTwo = Math.abs(180 - Math.abs(long) + 180 - Math.abs(city.longitude));
        
        distance = Math.min(pathOne, pathTwo);
        
        console.log("ONE: " + pathOne);
        console.log("TWO: " + pathTwo);
        
        console.log("RESULT: " + distance);
    }
    
    var vertDistance = Math.abs(lat - city.latitude);
    
    if(distance > 70)
    {
        quaternions.push(Quaternion.fromEuler(0.0, 0.0, longRad));
        quaternions.push(Quaternion.fromEuler(0.0, 0.0, longCity));
    }
    
    quaternions.push(Quaternion.fromEuler(0.0, latCity, longCity));
    
    distance = Math.sqrt(Math.pow(distance, 2) + Math.pow(vertDistance, 2));
    
    distance = distance / 254.56;
    
    speedTime = 0.15 + 3.7 * distance;
    
    markerMatrix = utils.MakeRotateXMatrix(-city.latitude);
    markerMatrix = utils.multiplyMatrices(utils.MakeRotateYMatrix(city.longitude), markerMatrix);
    infoMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(3.22 * x, 3.22 * y, 3.22 * z), markerMatrix);
    markerMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(3.175 * x, 3.175 * y, 3.175 * z), markerMatrix);

    long = -city.longitude;
    lat = city.latitude;
    lastTime = (new Date()).getTime();
    time = 0.0;
    infoAnim = false;
}

function makeViewRotation()
{
    var quatArr = quaternions.slice(0);
    var now = (new Date()).getTime();
    time += (now - lastTime) / 1000;
    lastTime = now;
    var alpha = clamp(time/speedTime, 0.0, 1.0);
    
//    do
//    {
//        for(var i = 0; i < quatArr.length - 1; i++)
//        {
//            quatArr[i] = slerp(quatArr[i], quatArr[i+1], alpha);
//        }
//        
//        quatArr.pop();
//    }while(quatArr.length > 1);
    
    do
    {
        for(var i = 0; i < quatArr.length - 1; i++)
        {
            quatArr[i] = quatArr[i].slerp(quatArr[i+1])(alpha);
        }
        
        quatArr.pop();
    }while(quatArr.length > 1);
    
    var rad;
    if(speedTime > 0.8 && lookRadius < 7.5)
    {
        rad = lerp(lerp(lookRadius, 9.5, alpha), lerp(9.5, 6.0, alpha), alpha);
    }
    else
        rad = lerp(lookRadius, 6.0, alpha);
    
    if(time >= speedTime)
    {
        blockRotation = false;
        time = 0.0;
        lookRadius = rad;
    }
    viewMatrix = utils.MakeView(0.0, 0.0, rad, 0.0, 0.0);
    return quatArr[0].toMatrix4();

}

function lerp(a, b, alpha)
{
    return a * (1 - alpha) + b * alpha;
}

function slerp(a, b, alpha)
{
    var theta = Math.acos(a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z);
    var res;
    
    if(theta != 0)
    {
        var sin = Math.sin(theta);
        var res = [];

        a = a.scale(Math.sin((1 - alpha)*theta)/sin)
        b = b.scale(Math.sin(alpha*theta)/sin);
        
        res = a.add(b);
    }
    else
        res = a;

    return res;
}

function distance(latX, longX, latY, longY)
{
    var long = Math.min(Math.abs(longX - longY), Math.abs(longX + longY));
    var lat = Math.abs(latX - latY);
    
    return Math.sqrt(long * long + lat * lat);
}

function updateTexture(city)
{
    ctx.clearRect(0,0, infoCanvas.width, infoCanvas.height);
    
    ctx.fillStyle = "#FFEADD";
    ctx.fillRect(0, 0, infoCanvas.width, infoCanvas.height);
    
    ctx.lineWidth = "10";
    ctx.strokeStyle = "#DD6C2A";
    ctx.strokeRect(0, 0, infoCanvas.width, infoCanvas.height);
    
    ctx.fillStyle = "black";
    ctx.font = "bold small-caps 65px Arial";
    ctx.textAlign = "center";
    ctx.fillText(city.cityName, infoCanvas.width/2, 70);
    
    ctx.font = "small-caps 37px Arial";
    ctx.textAlign = "start";
    
    ctx.fillText("Latitude:", 15, 130);
    ctx.fillText(city.realLatitude, 260, 130);
    
    ctx.fillText("Longitude:", 15, 200);
    ctx.fillText(city.realLongitude, 260, 200);
    
    ctx.fillText("Country:", 15, 270);
    ctx.fillText(city.country, 260, 270);
    
    ctx.fillText("Population:", 15, 340);
    ctx.fillText(city.population, 260, 340);
    
    ctx.fillText("Zip code:", 15, 410);
    ctx.fillText(city.zipCode, 260, 410);
    
    ctx.fillText("Timezone:", 15, 480);
    ctx.fillText(city.timeZone, 260, 480);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, infoCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D); 
}

main();