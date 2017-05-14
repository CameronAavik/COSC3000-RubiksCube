class WebGLDemo {

    constructor(private canvasId: string, private vertexShaderPath: string, private fragmentShaderPath: string) { }

    public load(): Promise<{ gl: WebGLRenderingContext, program: WebGLProgram }> {
        const glContext = WebGLDemo.loadGLContext(this.canvasId);
        const vertexShaderPath = WebGLDemo.loadFile(this.vertexShaderPath);
        const fragmentShaderPath = WebGLDemo.loadFile(this.fragmentShaderPath);
        const shaders = Promise.all([glContext, vertexShaderPath, fragmentShaderPath])
            .then(([gl, vert, frag]) => WebGLDemo.loadShaders(gl, vert, frag));
        const program = Promise.all([glContext, shaders])
            .then(([gl, shaders]) => WebGLDemo.createProgram(gl, shaders.vertexShader, shaders.fragmentShader));
        return Promise.all([glContext, program]).then(([gl, program]) => ({ gl, program }));
    }

    public drawTriangle(glVars: { gl: WebGLRenderingContext, program: WebGLProgram }) {
        const { gl, program } = glVars;
        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // four 3d points (square)
        const positions = [
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
        const size = 3;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const bufferOffset = 0;  // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, bufferOffset);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private static loadGLContext(canvasId: string): Promise<WebGLRenderingContext> {
        return new Promise<WebGLRenderingContext>((resolve, reject) => {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            const ctx = canvas.getContext("webgl");
            if (ctx !== null) {
                resolve(ctx);
            } else {
                reject(new Error("WebGL not available"));
            }
        });
    }

    private static loadFile(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`Failed to load ${filePath}`));
                    }
                }
            };
            xhr.open("GET", filePath);
            xhr.send();
        });
    }

    private static loadShaders(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string):
        Promise<{ vertexShader: WebGLShader, fragmentShader: WebGLShader }> {
        return Promise.all([
            WebGLDemo.createShader(gl, vertexShader, gl.VERTEX_SHADER),
            WebGLDemo.createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
        ]).then(([vertexShader, fragmentShader]) => ({ vertexShader, fragmentShader }));
    }

    private static createShader(gl: WebGLRenderingContext, source: string, type: number): Promise<WebGLShader> {
        return new Promise<WebGLShader>((resolve, reject) => {
            const shader = gl.createShader(type);
            if (shader === null) {
                reject(new Error("Unable to create WebGL Shader"));
                return;
            }
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as GLboolean;
            if (success) {
                resolve(shader)
            } else {
                const log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                reject(log);
            }
        });
    }

    private static createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader):
        Promise<WebGLProgram> {
        return new Promise<WebGLProgram>((resolve, reject) => {
            const program = gl.createProgram();
            if (program === null) {
                reject(new Error("Unable to create WebGL Program"));
                return;
            }
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            const success = gl.getProgramParameter(program, gl.LINK_STATUS) as GLboolean;
            if (success) {
                resolve(program);
            } else {
                const log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                reject(log);
            }
        });
    }
}

const demo = new WebGLDemo("glCanvas", "shaders/vertex-shader.glsl", "shaders/fragment-shader.glsl");
demo.load().then(demo.drawTriangle).catch(console.log);