"use strict";
var WebGLDemo = (function () {
    function WebGLDemo(canvasId, vertexShaderPath, fragmentShaderPath) {
        this.canvasId = canvasId;
        this.vertexShaderPath = vertexShaderPath;
        this.fragmentShaderPath = fragmentShaderPath;
    }
    WebGLDemo.prototype.load = function () {
        var glContext = WebGLDemo.loadGLContext(this.canvasId);
        var vertexShaderPath = WebGLDemo.loadFile(this.vertexShaderPath);
        var fragmentShaderPath = WebGLDemo.loadFile(this.fragmentShaderPath);
        var shaders = Promise.all([glContext, vertexShaderPath, fragmentShaderPath])
            .then(function (_a) {
            var gl = _a[0], vert = _a[1], frag = _a[2];
            return WebGLDemo.loadShaders(gl, vert, frag);
        });
        var program = Promise.all([glContext, shaders])
            .then(function (_a) {
            var gl = _a[0], shaders = _a[1];
            return WebGLDemo.createProgram(gl, shaders.vertexShader, shaders.fragmentShader);
        });
        return Promise.all([glContext, program]).then(function (_a) {
            var gl = _a[0], program = _a[1];
            return ({ gl: gl, program: program });
        });
    };
    WebGLDemo.prototype.drawTriangle = function (glVars) {
        var gl = glVars.gl, program = glVars.program;
        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // four 3d points (square)
        var positions = [
            0.5, 0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, -0.5, 0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        // Near things obscure far things
        gl.depthFunc(gl.LEQUAL);
        // Clear the color as well as the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var bufferOffset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, bufferOffset);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    WebGLDemo.loadGLContext = function (canvasId) {
        return new Promise(function (resolve, reject) {
            var canvas = document.getElementById(canvasId);
            var ctx = canvas.getContext("webgl");
            if (ctx !== null) {
                resolve(ctx);
            }
            else {
                reject(new Error("WebGL not available"));
            }
        });
    };
    WebGLDemo.loadFile = function (filePath) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        resolve(xhr.responseText);
                    }
                    else {
                        reject(new Error("Failed to load " + filePath));
                    }
                }
            };
            xhr.open("GET", filePath);
            xhr.send();
        });
    };
    WebGLDemo.loadShaders = function (gl, vertexShader, fragmentShader) {
        return Promise.all([
            WebGLDemo.createShader(gl, vertexShader, gl.VERTEX_SHADER),
            WebGLDemo.createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
        ]).then(function (_a) {
            var vertexShader = _a[0], fragmentShader = _a[1];
            return ({ vertexShader: vertexShader, fragmentShader: fragmentShader });
        });
    };
    WebGLDemo.createShader = function (gl, source, type) {
        return new Promise(function (resolve, reject) {
            var shader = gl.createShader(type);
            if (shader === null) {
                reject(new Error("Unable to create WebGL Shader"));
                return;
            }
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (success) {
                resolve(shader);
            }
            else {
                var log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                reject(log);
            }
        });
    };
    WebGLDemo.createProgram = function (gl, vertexShader, fragmentShader) {
        return new Promise(function (resolve, reject) {
            var program = gl.createProgram();
            if (program === null) {
                reject(new Error("Unable to create WebGL Program"));
                return;
            }
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            var success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (success) {
                resolve(program);
            }
            else {
                var log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                reject(log);
            }
        });
    };
    return WebGLDemo;
}());
var demo = new WebGLDemo("glCanvas", "shaders/vertex-shader.glsl", "shaders/fragment-shader.glsl");
demo.load().then(demo.drawTriangle).catch(console.log);
//# sourceMappingURL=index.js.map