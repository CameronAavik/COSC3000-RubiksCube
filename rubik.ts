namespace Utils {
    export type Vec3<T> = [T, T, T] & { 3?: void }
    export type Vec4<T> = [T, T, T, T] & { 4?: void };
    export type Mat4<T> = [Vec4<T>, Vec4<T>, Vec4<T>, Vec4<T>] & { 4?: void };
    const indexes: Vec4<0 | 1 | 2 | 3> = [0, 1, 2, 3];
    export const Mat4Identity: Mat4<number> = indexes.map(i => indexes.map(j => i === j ? 1 : 0));

    export function mulMats(a: Mat4<number>, b: Mat4<number>): Mat4<number> {
        return indexes.map(i => indexes.map(j => indexes.map(k => a[i][k] * b[k][j]).reduce(sum, 0)));
    }

    export function mulMatVec(a: Mat4<number>, b: Vec4<number>): Vec4<number> {
        return indexes.map(i => indexes.map(j => a[i][j] * b[j]).reduce(sum, 0));
    }

    export function vecToFloatArray(vec: Vec4<number>): Float32Array {
        return new Float32Array(vec);
    }

    export function matToFloatArray(mat: Mat4<number>): Float32Array {
        return new Float32Array([
            mat[0][0], mat[1][0], mat[2][0], mat[3][0],
            mat[0][1], mat[1][1], mat[2][1], mat[3][1],
            mat[0][2], mat[1][2], mat[2][2], mat[3][2],
            mat[0][3], mat[1][3], mat[2][3], mat[3][3]
        ]);
    }

    export function getTranslationMatrix([x, y, z]: Vec3<number>): Mat4<number> {
        return [[x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]];
    }

    export function getRotationMatrix([x, y, z]: Vec3<number>, angle: number): Mat4<number> {
        const cos = Math.cos(angle);
        const mcos = 1 - cos;
        const sin = Math.sin(angle);
        return [
            [cos + x * x * mcos, x * y * mcos - z * sin, x * z * mcos + y * sin, 0],
            [y * x * mcos + z * sin, cos + y * y * mcos, y * z * mcos - x * sin, 0],
            [z * x * mcos - y * sin, z * y * mcos + x * sin, cos + z * z * mcos, 0],
            [0, 0, 0, 1]
        ];
    }

    export function getPerspectiveMatrix(fov: number, aspect: number, near: number, far: number): Mat4<number> {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (far + near) * nf, 2 * far * near * nf],
            [0, 0, -1, 0]
        ];
    }

    // Helper function for generation the interval [0, max)
    export const range = (max: number) => Array.from({ length: max }, (_, k) => k);
    const sum = (a: number, b: number) => a + b;
}

namespace Rubik {
    // There are 6 faces, 0=L,1=R,2=D,3=U,4=B,5=F
    type Face = 0 | 1 | 2 | 3 | 4 | 5;
    // Tracks the face that each original face has ended up on
    type FaceMap = [Face, Face, Face, Face, Face, Face] & { 6?: void };
    // A position vector that tracks x, y, and z values
    type Position = Utils.Vec3<number>;

    /**
     * A cubie is an individual cube inside the Rubik's Cube. It is completely represented by it's starting position 
     * and a rotation matrix
     */
    type CubieData = { readonly startPos: Position, readonly faces: FaceMap }

    /** 
     * We maintain a list of all the cubies in the cube. These cubies are sorted such that the 0th cube is LDB and 
     * the last cube is RUF and that it first increases in the x direction, then y, then z. We also maintain the size
     * of the cube as described by createCube.
     */
    type CubeData = { readonly cubies: ReadonlyArray<CubieData>, readonly size: number };

    /**
     * Creates a new Cube of a given size
     * @param size The size of the cube. a 3x3 cube is size 3
     */
    function createCubeData(size: number): CubeData {
        const cubies: CubieData[] = [];
        Utils.range(size).forEach(z => {
            Utils.range(size).forEach(y => {
                Utils.range(size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5] });
                });
            });
        });
        return { cubies, size };
    }

    // There are three axes, 0=x, 1=y, 2=z
    type Axis = 0 | 1 | 2;
    type Layer = { readonly axis: Axis, readonly layerNum: number };

    /**
    * Rotates a given layer of the cube and returns the new cube
    * @param cube The cube which is getting it's layer rotated
    * @param rotationLayer The information about the layer being rotated
    */
    function rotateLayer(cube: CubeData, rotationLayer: Layer): CubeData {
        const getCubie = (i: number, j: number) => getCubieIndex(cube.size, i, j, rotationLayer);
        const cubies = cube.cubies.slice(); // Create a copy of the cube
        Utils.range(cube.size).forEach(i => {
            Utils.range(cube.size).forEach(j => {
                const oldCubie = cube.cubies[getCubie(cube.size - j - 1, i)];
                const newFaceMap = getFacesAfterRotation(oldCubie.faces, rotationLayer.axis);
                cubies[getCubie(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap };
            });
        });
        return { cubies, size: cube.size }
    }

    /**
     * Returns the FaceMap after a rotation on a given axis
     * @param faces A FaceMap which is being rotated
     * @param axis The axis of rotation
     */
    function getFacesAfterRotation(faces: FaceMap, axis: Axis): FaceMap {
        let cycle: FaceMap;
        switch (axis) {
            case 0: cycle = [0, 1, 4, 5, 2, 3]; break;
            case 1: cycle = [5, 4, 2, 3, 0, 1]; break;
            case 2: cycle = [2, 3, 1, 0, 4, 5]; break;
        }
        return faces.map(f => faces[cycle[f]]) as FaceMap;
    }

    /**
     * Will return the index into the cubies array belonging to the (i, j)th cubie in the layer
     * @param cubeSize The size of the cube
     * @param i The ith row of the layer
     * @param j The jth column of the layer
     * @param layer The layer information
     */
    function getCubieIndex(cubeSize: number, i: number, j: number, layer: Layer): number {
        const pos = [i, j];
        pos.splice(layer.axis, 0, layer.layerNum);
        return pos[0] + cubeSize * pos[1] + (cubeSize ** 2) * pos[2]
    }

    function getRotMatrixFromFaceMap(faces: FaceMap): Utils.Mat4<number> {
        const mat = rotMatrixMapping.get(JSON.stringify(faces));
        if (mat === undefined) {
            throw Error("Could not find rotation matrix for that face mapping");
        }
        return mat;
    }

    const rotMatrixMapping = generateRotMatrixMapping();
    function generateRotMatrixMapping(): Map<string, Utils.Mat4<number>> {
        const rots = [Utils.getRotationMatrix([1, 0, 0], Math.PI / 2), Utils.getRotationMatrix([0, 1, 0], Math.PI / 2)];
        const startPerms: Axis[][] = [[], [1], [1, 1], [1, 1, 1], [0, 1], [0, 0, 0, 1]];
        const rotMap = new Map<string, Utils.Mat4<number>>();
        for (let startPerm of startPerms) {
            let mat = Utils.Mat4Identity;
            let faceMap: FaceMap = [0, 1, 2, 3, 4, 5];
            for (let turn of startPerm) {
                mat = Utils.mulMats(mat, rots[turn])
                faceMap = getFacesAfterRotation(faceMap, turn);
            }
            for (let i = 0; i < 4; i++) {
                rotMap.set(JSON.stringify(faceMap), mat);
                mat = Utils.mulMats(mat, rots[0])
                faceMap = getFacesAfterRotation(faceMap, 0);
            }
        }
        return rotMap;
    }

    export type Cube = {
        readonly data: CubeData,
        readonly cubies: Cubie[],
        readonly tMat: Utils.Mat4<number>,
        readonly rMat: Utils.Mat4<number>
    }

    export type Cubie = {
        readonly data: CubieData,
        readonly tMat: Utils.Mat4<number>,
        readonly rMat: Utils.Mat4<number>
    }

    export const colours = {
        white: [1, 1, 1],
        blue: [0, 0x51 / 0xFF, 0xBA / 0xFF],
        yellow: [1, 0xD5 / 0xFF, 0],
        green: [0, 0x9E / 0xFF, 0x60 / 0xFF],
        red: [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF],
        orange: [1, 0x58 / 0xFF, 0],
        none: [0, 0, 0]
    }

    export function getCubieFaceColours(cubie: Cubie, size: number): number[][] {
        const pos = cubie.data.startPos;
        const n = size - 1;
        return [
            pos[0] === 0 ? colours.blue : colours.none,
            pos[0] === n ? colours.green : colours.none,
            pos[1] === 0 ? colours.orange : colours.none,
            pos[1] === n ? colours.red : colours.none,
            pos[2] === 0 ? colours.yellow : colours.none,
            pos[2] === n ? colours.white : colours.none,
        ];
    }

    export function createGLCube(size: number): Cube {
        const data = createCubeData(size);
        const cubies = data.cubies.map(c => getWebGLCubieFromCubie(c, size));
        return {
            data,
            cubies,
            tMat: Utils.getTranslationMatrix([2, 2, 2]),
            rMat: Utils.Mat4Identity
        }
    }

    export type Move = "L" | "R" | "D" | "U" | "B" | "F";
    export function applyMove(cube: Cube, move: Move, rotations: number): Cube {
        const axis: Axis = (move === "L" || move === "R") ? 0 : (move === "D" || move === "U") ? 1 : 2;
        const isOpposite = move === "R" || move === "U" || move === "F";
        const layerNum = isOpposite ? cube.data.size - 1 : 0;
        const rotationCount = isOpposite ? (4 - (rotations % 4)) : rotations % 4;
        let newCube = cube.data;
        Utils.range(rotationCount).forEach(_ => {
            newCube = rotateLayer(newCube, { axis, layerNum })
        })
        const newWebGLCubies = newCube.cubies.map(c => getWebGLCubieFromCubie(c, cube.data.size));
        return { data: newCube, cubies: newWebGLCubies, tMat: cube.tMat, rMat: cube.rMat }
    }

    function getWebGLCubieFromCubie(cubieData: CubieData, size: number): Cubie {
        return {
            data: cubieData,
            tMat: Utils.getTranslationMatrix(getGlPosFromCubiePos(cubieData, size)),
            rMat: getRotMatrixFromFaceMap(cubieData.faces)
        }
    }

    function getGlPosFromCubiePos(cubieData: CubieData, size: number): Utils.Vec3<number> {
        const pos = cubieData.startPos;
        const n = 1 / (size * 2);
        const mapPos = (x: number) => (x / (size + 1) + n) - 0.5;
        return pos.map(mapPos);
    }
}

namespace Program {
    export type InputVars = {
        readonly canvasId: string,
        readonly vertexShaderPath: string,
        readonly fragmentShaderPath: string
    }

    let counter = 0;

    let cube: Rubik.Cube;
    let gl: WebGLRenderingContext;
    let glProg: WebGLProgram;
    let canvas: HTMLCanvasElement;
    let pMat: Utils.Mat4<number>;

    let vertData: number[] = [];
    let indexData: number[] = [];

    let vertBuffer: WebGLBuffer;
    let indexBuffer: WebGLBuffer;

    export function loadState(input: InputVars) {
        const canvasElem = document.getElementById(input.canvasId) as HTMLCanvasElement;
        const glContext = loadGLContext(canvasElem);
        const vertexShader = loadFile(input.vertexShaderPath);
        const fragmentShader = loadFile(input.fragmentShaderPath);
        const shaders = Promise.all([glContext, vertexShader, fragmentShader])
            .then(([gl, vert, frag]) => loadShaders(gl, vert, frag));
        const program = Promise.all([glContext, shaders])
            .then(([gl, shaders]) => createProgram(gl, shaders.vertexShader, shaders.fragmentShader));
        return Promise.all([glContext, program]).then(([glContext, glProgram]) => {
            cube = Rubik.createGLCube(3);
            gl = glContext;
            glProg = glProgram;
            canvas = canvasElem;
            pMat = Utils.Mat4Identity;
        });
    }

    export function runProgram() {
        // Firstly we want to fix up the viewport and perspective every the screen is resized
        window.addEventListener("resize", onWindowResize, false);
        // And then run the handler initially
        onWindowResize();
        // Clear the colour, enable depth testing and culling
        gl.clearColor(0.1, 0.2, 0.3, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        // Initialise the data to be put in the buffers
        for (let cubie of cube.cubies) {
            const [verts, indices] = getCubieVertData(cubie);
            indexData = indexData.concat(indices.map(i => i + vertData.length / 6));
            vertData = vertData.concat(verts);
        }
        // Initialise the vertex buffer, which contains position and colour data
        vertBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertData), gl.STATIC_DRAW);
        // Initialise the index buffer, which contains the offsets for each vertex in the vertex buffer
        indexBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        // Set the animation loop callback
        window.requestAnimationFrame(onAnimationLoop);
    }

    function onWindowResize(): void {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        gl.viewport(0, 0, canvas.width, canvas.height);
        pMat = Utils.getPerspectiveMatrix(Math.PI / 2, canvas.width / canvas.height, 0.1, 1024);
    }

    function onAnimationLoop() {
        window.requestAnimationFrame(onAnimationLoop);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        render();
    }

    function render() {
        // Set the uniform matrices which are all in common
        const projectionMat = gl.getUniformLocation(glProg, "projectionMat") as WebGLUniformLocation;
        const cubeTranslationMat = gl.getUniformLocation(glProg, "cubeTranslationMat") as WebGLUniformLocation;
        const cubeRotationMat = gl.getUniformLocation(glProg, "cubeRotationMat") as WebGLUniformLocation;
        const cubieTranslationMat = gl.getUniformLocation(glProg, "cubieTranslationMat") as WebGLUniformLocation;
        const cubieRotationMat = gl.getUniformLocation(glProg, "cubieRotationMat") as WebGLUniformLocation;

        gl.uniformMatrix4fv(projectionMat, false, Utils.matToFloatArray(pMat));
        gl.uniformMatrix4fv(cubeTranslationMat, false, Utils.matToFloatArray(cube.tMat));
        counter += 1;
        const rotToApply = Utils.mulMats(Utils.getRotationMatrix([0, 1, 0], counter * 0.01), Utils.getRotationMatrix([0, 0, 1], counter * 0.02))
        const rotationMat = Utils.mulMats(cube.rMat, rotToApply);
        gl.uniformMatrix4fv(cubeRotationMat, false, Utils.matToFloatArray(rotationMat));

        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Position Attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(0);
        // Colour Attribute
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        gl.enableVertexAttribArray(1);

        for (let i = 0; i < cube.cubies.length; i++) {
            const cubie = cube.cubies[i];
            gl.uniformMatrix4fv(cubieTranslationMat, false, Utils.matToFloatArray(cubie.tMat));
            gl.uniformMatrix4fv(cubieRotationMat, false, Utils.matToFloatArray(cubie.rMat));
            const numIndices = 36;
            gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, i * numIndices * 2);
        }
    }

    function getCubieVertData(cubie: Rubik.Cubie): [number[], number[]] {
        const colours = Rubik.getCubieFaceColours(cubie, cube.data.size);
        const n = 1 / (2 * cube.data.size);
        const verts = [
            // LEFT
            -n, -n, n, ...colours[0],
            -n, n, n, ...colours[0],
            -n, -n, -n, ...colours[0],
            -n, n, -n, ...colours[0],
            // RIGHT
            n, -n, -n, ...colours[1],
            n, -n, n, ...colours[1],
            n, n, -n, ...colours[1],
            n, n, n, ...colours[1],
            // DOWN
            n, -n, -n, ...colours[2],
            n, -n, n, ...colours[2],
            -n, -n, -n, ...colours[2],
            -n, -n, n, ...colours[2],
            // UP
            n, n, n, ...colours[3],
            -n, n, n, ...colours[3],
            n, n, -n, ...colours[3],
            -n, n, -n, ...colours[3],
            // BACK
            -n, -n, -n, ...colours[4],
            -n, n, -n, ...colours[4],
            n, -n, -n, ...colours[4],
            n, n, -n, ...colours[4],
            // FRONT
            n, -n, n, ...colours[5],
            -n, -n, n, ...colours[5],
            n, n, n, ...colours[5],
            -n, n, n, ...colours[5]
        ];
        const indexes = [
            0, 1, 2, 2, 1, 3, // L
            4, 5, 6, 6, 5, 7, // R
            8, 9, 10, 10, 9, 11, // D
            12, 13, 14, 14, 13, 15, // U
            16, 17, 18, 18, 17, 19, // B
            20, 21, 22, 22, 21, 23 // F
        ];
        return [verts, indexes];
    }

    function loadGLContext(canvas: HTMLCanvasElement): Promise<WebGLRenderingContext> {
        return new Promise<WebGLRenderingContext>((resolve, reject) => {
            const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (ctx !== null) {
                resolve(ctx);
            } else {
                reject(new Error("WebGL not available"));
            }
        });
    }

    function loadFile(filePath: string): Promise<string> {
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

    function loadShaders(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string):
        Promise<{ vertexShader: WebGLShader, fragmentShader: WebGLShader }> {
        return Promise.all([
            createShader(gl, vertexShader, gl.VERTEX_SHADER),
            createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
        ]).then(([vertexShader, fragmentShader]) => ({ vertexShader, fragmentShader }));
    }

    function createShader(gl: WebGLRenderingContext, source: string, type: number): Promise<WebGLShader> {
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

    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader):
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
                gl.useProgram(program);
                resolve(program);
            } else {
                const log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                reject(log);
            }
        });
    }
}

const inputs: Program.InputVars = {
    canvasId: "glCanvas",
    vertexShaderPath: "shaders/vertex-shader.glsl",
    fragmentShaderPath: "shaders/fragment-shader.glsl"
}

Program.loadState(inputs).then(Program.runProgram).catch(console.log);