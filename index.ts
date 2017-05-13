type CubieFace = { cubie: Cubie, colour: Num4 };
enum Entrance { Top, Bottom, Left, Right };
enum Face { Front, Back, Left, Right, Up, Down };
type FaceEntrance = { face: RubiksFace, entrance: Entrance };
type Num4 = [number, number, number, number];

class Colour {
    public static readonly White: Num4 = [1, 1, 1, 1];
    public static readonly Blue: Num4 = [0, 0x51 / 0xFF, 0xBA / 0xFF, 1];
    public static readonly Yellow: Num4 = [1, 0xD5 / 0xFF, 0, 1];
    public static readonly Green: Num4 = [0, 0x9E / 0xFF, 0x60 / 0xFF, 1];
    public static readonly Red: Num4 = [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF, 1];
    public static readonly Orange: Num4 = [1, 0x58 / 0xFF, 0, 1];
}

abstract class Cubie { }
class CornerCubie extends Cubie { }
class EdgeCubie extends Cubie { }
class CenterCubie extends Cubie { }

class RubiksFace {
    public up: FaceEntrance;
    public down: FaceEntrance;
    public left: FaceEntrance;
    public right: FaceEntrance;
    constructor(public cubies: CubieFace[][]) { }
}

type RubiksCubeFaces = {
    front: RubiksFace, back: RubiksFace,
    left: RubiksFace, right: RubiksFace,
    up: RubiksFace, down: RubiksFace,
};

class RubiksCube {
    public cubies: Cubie[];

    public faces: RubiksCubeFaces

    constructor(n: number) {
        this.cubies = RubiksCube.genCubies(n);
        this.faces = {
            front: RubiksCube.genFace(n, this.cubies, Face.Front),
            back: RubiksCube.genFace(n, this.cubies, Face.Back),
            left: RubiksCube.genFace(n, this.cubies, Face.Left),
            right: RubiksCube.genFace(n, this.cubies, Face.Right),
            up: RubiksCube.genFace(n, this.cubies, Face.Up),
            down: RubiksCube.genFace(n, this.cubies, Face.Down),
        }
        RubiksCube.genFaceEntrances(this.faces);
    }

    private static genCubies(n: number): Cubie[] {
        const cubies = new Array() as Cubie[];
        // corners
        for (let i = 0; i < 8; i++) {
            cubies.push(new CornerCubie());
        }
        // edges
        for (let i = 0; i < 12 * (n - 2); i++) {
            cubies.push(new EdgeCubie());
        }
        // centers
        for (let i = 0; i < 6 * (n - 2) ** 2; i++) {
            cubies.push(new CenterCubie());
        }
        return cubies;
    }

    private static genFace(n: number, cubies: Cubie[], face: Face): RubiksFace {
        const corners = RubiksCube.getCornerIndices(face);
        const edges = RubiksCube.getEdgeStartIndices(face);
        const centers = RubiksCube.getCenterStartIndices(face);
        const colour = RubiksCube.getColourForFace(face);
        const cubieMatrix = [] as CubieFace[][];
        for (let row = 0; row < n; row++) {
            cubieMatrix[row] = [] as CubieFace[];
            for (let col = 0; col < n; col++) {
                let index = 0; // Will get overriden
                if (row === 0) {
                    if (col === 0) {
                        index = corners[0];
                    } else if (col === n - 1) {
                        index = corners[1];
                    } else {
                        index = 8 + edges[0] * (n - 2);
                    }
                } else if (row === n - 1) {
                    if (col === 0) {
                        index = corners[2];
                    } else if (col === n - 1) {
                        index = corners[3];
                    } else {
                        index = 8 + edges[3] * (n - 2);
                    }
                } else {
                    if (col === 0) {
                        index = 8 + edges[1] * (n - 2) + n - (row + 2);
                    } else if (col === n - 1) {
                        index = 8 + edges[2] * (n - 2) + row - 1;
                    } else {
                        index = 8 + 12 * (n - 2) + centers * (n - 2) ** 2;
                    }
                }
                cubieMatrix[row].push({ cubie: cubies[index], colour });
            }
        }
        return new RubiksFace(cubieMatrix);
    }

    private static genFaceEntrances(faces: RubiksCubeFaces): void {
        // not sure of a better way to do this :/
        faces.front.up = {face: faces.up, entrance: Entrance.Bottom};
        faces.front.down = {face: faces.down, entrance: Entrance.Top};
        faces.front.left = {face: faces.left, entrance: Entrance.Right};
        faces.front.right = {face: faces.right, entrance: Entrance.Left};

        faces.back.up = {face: faces.up, entrance: Entrance.Top};
        faces.back.down = {face: faces.down, entrance: Entrance.Bottom};
        faces.back.left = {face: faces.right, entrance: Entrance.Right};
        faces.back.right = {face: faces.left, entrance: Entrance.Left};

        faces.left.up = {face: faces.up, entrance: Entrance.Left};
        faces.left.down = {face: faces.down, entrance: Entrance.Left};
        faces.left.left = {face: faces.back, entrance: Entrance.Right};
        faces.left.right = {face: faces.front, entrance: Entrance.Left};

        faces.right.up = {face: faces.up, entrance: Entrance.Right};
        faces.right.down = {face: faces.down, entrance: Entrance.Right};
        faces.right.left = {face: faces.front, entrance: Entrance.Right};
        faces.right.right = {face: faces.back, entrance: Entrance.Left};

        faces.up.up = {face: faces.back, entrance: Entrance.Top};
        faces.up.down = {face: faces.front, entrance: Entrance.Top};
        faces.up.left = {face: faces.left, entrance: Entrance.Top};
        faces.up.right = {face: faces.right, entrance: Entrance.Top};

        faces.down.up = {face: faces.front, entrance: Entrance.Bottom};
        faces.down.down = {face: faces.back, entrance: Entrance.Bottom};
        faces.down.left = {face: faces.left, entrance: Entrance.Bottom};
        faces.down.right = {face: faces.right, entrance: Entrance.Bottom};
    }

    // Gets which corners are part of the given face (in order of top-left, top-right, bottom-left, bottom-right)
    private static getCornerIndices(face: Face): Num4 {
        switch (face) {
            case Face.Front: return [0, 1, 2, 3];
            case Face.Back: return [4, 5, 6, 7];
            case Face.Left: return [5, 0, 7, 2];
            case Face.Right: return [1, 4, 3, 6];
            case Face.Up: return [5, 4, 0, 1];
            case Face.Down: return [2, 3, 7, 6];
        }
    }


    // Gets relative index of each edge (in order of top, left, right, down)
    private static getEdgeStartIndices(face: Face): Num4 {
        switch (face) {
            case Face.Front: return [0, 1, 2, 3];
            case Face.Back: return [4, 5, 6, 7];
            case Face.Left: return [8, 6, 9, 1];
            case Face.Right: return [10, 2, 5, 11];
            case Face.Up: return [4, 8, 10, 0];
            case Face.Down: return [3, 9, 11, 7];
        }
    }

    // Gets relative index of center cubi
    private static getCenterStartIndices(face: Face): number {
        switch (face) {
            case Face.Front: return 0;
            case Face.Back: return 1;
            case Face.Left: return 2;
            case Face.Right: return 3;
            case Face.Up: return 4;
            case Face.Down: return 5;
        }
    }

    // Gets default colour for each face
    private static getColourForFace(face: Face): Num4 {
        switch (face) {
            case Face.Front: return Colour.Yellow;
            case Face.Back: return Colour.White;
            case Face.Left: return Colour.Orange;
            case Face.Right: return Colour.Red;
            case Face.Up: return Colour.Blue;
            case Face.Down: return Colour.Green;
        }
    }
}

class WebGLDemo {

    constructor(private canvasId: string, private vertexShaderPath: string, private fragmentShaderPath: string) { }

    public load(): Promise<{ gl: WebGLRenderingContext, program: WebGLProgram }> {
        const glContext = WebGLDemo.loadGLContext(this.canvasId);
        const vertexShaderPath = WebGLDemo.loadFile(this.vertexShaderPath);
        const fragmentShaderPath = WebGLDemo.loadFile(this.fragmentShaderPath);
        const shaders = Promise.all([glContext, vertexShaderPath, fragmentShaderPath]).then(([gl, vert, frag]) => WebGLDemo.loadShaders(gl, vert, frag));
        const program = Promise.all([glContext, shaders]).then(([gl, shaders]) => WebGLDemo.createProgram(gl, shaders.vertexShader, shaders.fragmentShader));
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

    private static loadShaders(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string): Promise<{ vertexShader: WebGLShader, fragmentShader: WebGLShader }> {
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

    private static createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): Promise<WebGLProgram> {
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