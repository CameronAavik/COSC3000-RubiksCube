"use strict";
class Program {
    constructor(canvasId, vertexShaderPath, fragmentShaderPath) {
        this.canvasId = canvasId;
        this.vertexShaderPath = vertexShaderPath;
        this.fragmentShaderPath = fragmentShaderPath;
    }
    load() {
        const glContext = this.loadGLContext();
        const vertexShaderPath = this.loadFile(this.vertexShaderPath);
        const fragmentShaderPath = this.loadFile(this.fragmentShaderPath);
        const shaders = Promise.all([glContext, vertexShaderPath, fragmentShaderPath]).then(s => this.loadShaders(s[0], s[1], s[2]));
        const program = Promise.all([glContext, shaders]).then(s => this.createProgram(s[0], s[1].vertexShader, s[1].fragmentShader));
        return Promise.all([glContext, program]).then(s => ({ gl: s[0], program: s[1] }));
    }
    drawTriangle(glVars) {
        const { gl, program } = glVars;
        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // three 2d points
        const positions = [
            -0.5, -0.5,
            0.5, -0.5,
            0, 0.5,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2; // 2 components per iteration
        const type = gl.FLOAT; // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        const bufferOffset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, bufferOffset);
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 3;
        gl.drawArrays(primitiveType, offset, count);
    }
    loadFile(filePath) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        resolve(xhr.responseText);
                    }
                    else {
                        reject(new Error(`Failed to load ${filePath}`));
                    }
                }
            };
            xhr.open("GET", filePath);
            xhr.send();
        });
    }
    loadGLContext() {
        return new Promise((resolve, reject) => {
            const canvas = document.getElementById(this.canvasId);
            const ctx = canvas.getContext("webgl");
            if (ctx !== null) {
                resolve(ctx);
            }
            else {
                reject(new Error("WebGL not available"));
            }
        });
    }
    loadShaders(gl, vertexShader, fragmentShader) {
        return Promise.all([
            this.createShader(gl, vertexShader, gl.VERTEX_SHADER),
            this.createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
        ]).then(shaders => ({ vertexShader: shaders[0], fragmentShader: shaders[1] }));
    }
    createShader(gl, source, type) {
        return new Promise((resolve, reject) => {
            const shader = gl.createShader(type);
            if (shader === null) {
                reject(new Error("Unable to create WebGL Shader"));
                return;
            }
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (success) {
                resolve(shader);
            }
            else {
                const log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                reject(log);
            }
        });
    }
    createProgram(gl, vertexShader, fragmentShader) {
        return new Promise((resolve, reject) => {
            const program = gl.createProgram();
            if (program === null) {
                reject(new Error("Unable to create WebGL Program"));
                return;
            }
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            const success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (success) {
                resolve(program);
            }
            else {
                const log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                reject(log);
            }
        });
    }
}
const program = new Program("glCanvas", "shaders/vertex-shader.glsl", "shaders/fragment-shader.glsl");
program.load().then(program.drawTriangle).catch(console.log);
//# sourceMappingURL=index.js.map