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
        return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
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
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1 / (near - far);
        return [
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (far + near) * rangeInv, 2 * far * near * rangeInv],
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
    type CubieData = { readonly startPos: Position, readonly faces: FaceMap, readonly index: number, }

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
        let count = 0;
        Utils.range(size).forEach(z => {
            Utils.range(size).forEach(y => {
                Utils.range(size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5], index: count});
                    count += 1;
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
                cubies[getCubie(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap, index: oldCubie.index };
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
            case 0: cycle = [0, 1, 5, 4, 2, 3]; break;
            case 1: cycle = [4, 5, 2, 3, 1, 0]; break;
            case 2: cycle = [3, 2, 0, 1, 4, 5]; break;
        }
        return faces.map(f => cycle[f]) as FaceMap;
    }

    /**
     * Will return the index into the cubies array belonging to the (i, j)th cubie in the layer
     * @param cubeSize The size of the cube
     * @param i The ith row of the layer
     * @param j The jth column of the layer
     * @param layer The layer information
     */
    function getCubieIndex(cubeSize: number, i: number, j: number, layer: Layer): number {
        let pos: number[];
        switch(layer.axis) {
            case 0: pos = [layer.layerNum, j, i]; break;
            case 1: pos = [i, layer.layerNum, j]; break;
            case 2: pos = [i, j, layer.layerNum]; break;
            default: throw Error("The axis should only be 0, 1, or 2");
        }
        return pos[0] + pos[1] * cubeSize + pos[2] * (cubeSize) ** 2
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
        startPerms.forEach(startPerm => {
            let mat = Utils.Mat4Identity;
            let faceMap: FaceMap = [0, 1, 2, 3, 4, 5];
            startPerm.forEach(turn => {
                mat = Utils.mulMats(rots[turn], mat)
                faceMap = getFacesAfterRotation(faceMap, turn);
            });
            Utils.range(4).forEach(_ => {
                rotMap.set(JSON.stringify(faceMap), mat);
                mat = Utils.mulMats(rots[0], mat)
                faceMap = getFacesAfterRotation(faceMap, 0);
            });
        });
        return rotMap;
    }

    export type AnimationStatus = {
        isActive: boolean,
        rotMatrix: Utils.Mat4<number>,
        angleTurn: number,
        layer: Layer,
        startTime: number
    }

    export type Cube = {
        readonly data: CubeData,
        readonly cubies: Cubie[],
        readonly tMat: Utils.Mat4<number>,
        readonly rMat: Utils.Mat4<number>,
        readonly animation: AnimationStatus
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
        const startingRot = Utils.mulMats(Utils.getRotationMatrix([1, 0, 0], Math.PI/8), Utils.getRotationMatrix([0, 1, 0], -Math.PI/4))
        return {
            data,
            cubies,
            tMat: Utils.getTranslationMatrix([0, 0, -2]),
            rMat: startingRot,
            animation: {
                isActive: false,
                rotMatrix: Utils.Mat4Identity,
                layer: {axis: 0, layerNum: 0},
                angleTurn: 0,
                startTime: 0
            }
        }
    }

    export type Move = "L" | "R" | "D" | "U" | "B" | "F";
    export function applyMove(cube: Cube, move: Move, rotations: number): Cube {
        if (cube.animation.isActive) {
            console.log("Can't apply move while the animation is still active");
            return cube;
        }
        const boundRotations = rotations % 4; // Will only be between -3 and 3
        const positiveRotations = boundRotations < 0 ? 4 - Math.abs(boundRotations) : boundRotations;
        const axis: Axis = (move === "L" || move === "R") ? 0 : (move === "D" || move === "U") ? 1 : 2;
        const isOpposite = move === "R" || move === "U" || move === "F";
        const layerNum = isOpposite ? cube.data.size - 1 : 0;
        const reverseRotations = move === "R" || move === "U" || move === "B";
        const rotationCount = reverseRotations ? (4 - (positiveRotations % 4)) % 4 : positiveRotations % 4;
        let newCube = cube.data;
        Utils.range(rotationCount).forEach(_ => {
            newCube = rotateLayer(newCube, { axis, layerNum });
        });
        const newAnimation: AnimationStatus = {
            isActive: true,
            rotMatrix: Utils.Mat4Identity,
            layer: {axis, layerNum},
            angleTurn: (isOpposite ? -1 : 1) * (rotations % 4) * Math.PI/2,
            startTime: performance.now()
        }

        return { data: newCube, cubies: cube.cubies, tMat: cube.tMat, rMat: cube.rMat, animation: newAnimation }
    }

    const timeToTurnRadian = 1/(2*Math.PI) * 1000; // it takes 1/4 second to turn 90 degrees

    export function progressAnimation(cube: Cube, currentTime: number): Cube {
        const anim = cube.animation;
        if (anim.isActive) {
            const rotationAxis: Utils.Vec3<number> = [0, 0, 0];
            rotationAxis[anim.layer.axis] = 1;
            const turnTime = Math.abs(anim.angleTurn * timeToTurnRadian);
            const progress = (currentTime - anim.startTime)/turnTime;
            if (progress >= 1) {
                anim.isActive = false;
                // Update all the cubies to their new rotation matrices as the animation is over
                const newWebGLCubies = cube.data.cubies.map(c => getWebGLCubieFromCubie(c, cube.data.size));
                return { data: cube.data, cubies: newWebGLCubies, tMat: cube.tMat, rMat: cube.rMat, animation: anim }
            }
            anim.rotMatrix = Utils.getRotationMatrix(rotationAxis, anim.angleTurn * progress);
        }
        return cube;
    }

    export function cubieIsInLayer(index: number, layer: Layer, cubeSize: number) {
        let posInAxis: number;
        switch(layer.axis) {
            case 0: posInAxis = index % cubeSize; break;
            case 1: posInAxis = (index / cubeSize) % cubeSize; break;
            case 2: posInAxis = (index / (cubeSize**2)) % cubeSize; break;
            default: throw Error("The axis was not valid");
        }
        return Math.floor(posInAxis) == layer.layerNum;
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
        const mapPos = (x: number) => (x / size + n) - 0.5;
        return pos.map(mapPos);
    }
}

namespace Program {
    export type InputVars = {
        readonly canvasId: string,
        readonly vertexShaderPath: string,
        readonly fragmentShaderPath: string
    }

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
        cube.cubies.forEach(cubie => {
            const [verts, indices] = getCubieVertData(cubie);
            indexData = indexData.concat(indices.map(i => i + vertData.length / 9));
            vertData = vertData.concat(verts);
        });
        // Initialise the vertex buffer, which contains position and colour data
        vertBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertData), gl.STATIC_DRAW);
        // Initialise the index buffer, which contains the offsets for each vertex in the vertex buffer
        indexBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        // Initialise the keypress handler
        window.addEventListener("keypress", onKeyPress, false);
        // Set the animation loop callback
        window.requestAnimationFrame(onAnimationLoop);
    }

    function onWindowResize(): void {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        gl.viewport(0, 0, canvas.width, canvas.height);
        pMat = Utils.getPerspectiveMatrix(Math.PI / 2, canvas.width / canvas.height, 0.1, 1024);
    }

    function onKeyPress(ev: KeyboardEvent): void {
        const key = ev.key.toUpperCase();
        const isShift = ev.shiftKey;
        if (key === "X" || key === "Y" || key === "Z") {
            let axis: Utils.Vec3<number>;
            const dir = isShift ? -1 : 1;
            switch (key) {
                case "X": axis = [dir, 0, 0]; break;
                case "Y": axis = [0, dir, 0]; break;
                case "Z": axis = [0, 0, dir]; break;
                default: return;
            }
            const cubeRotMat = Utils.mulMats(Utils.getRotationMatrix(axis, 0.1), cube.rMat);
            cube = { data: cube.data, cubies: cube.cubies, tMat: cube.tMat, rMat: cubeRotMat, animation: cube.animation }
        } else if (key === 'F' || key === "B" || key === "L" || key === "R" || key === "U" || key === "D") {
            const rotations = isShift ? -1 : 1;
            cube = Rubik.applyMove(cube, key, rotations);
        }
    }

     function onAnimationLoop(time: number) {
        window.requestAnimationFrame(onAnimationLoop);
        cube = Rubik.progressAnimation(cube, time);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        render();
    }

    function render() {
        // Set the uniform matrices which are all in common
        const projectionMat = gl.getUniformLocation(glProg, "projectionMat") as WebGLUniformLocation;
        gl.uniformMatrix4fv(projectionMat, false, Utils.matToFloatArray(pMat));

        const modelMat = gl.getUniformLocation(glProg, "modelMat") as WebGLUniformLocation;
        const cubeMat = Utils.mulMats(cube.tMat, cube.rMat);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Position Attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(0);
        // Colour Attribute
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(1);
        // Normal Attribute
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(2);

        cube.cubies.forEach((cubie, i) => {
            const offset = cubie.data.index;
            let animationMatrix = Utils.Mat4Identity;
            if (cube.animation.isActive) {
                const anim = cube.animation;
                if (Rubik.cubieIsInLayer(i, anim.layer, cube.data.size)) {
                    animationMatrix = anim.rotMatrix;
                }
            }
            const cubieMat = Utils.mulMats(animationMatrix, Utils.mulMats(cubie.rMat, cubie.tMat));
            gl.uniformMatrix4fv(modelMat, false, Utils.matToFloatArray(Utils.mulMats(cubeMat, cubieMat)));
            const numIndices = 36;
            gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, offset * numIndices * 2);
        });
    }

    function getCubieVertData(cubie: Rubik.Cubie): [number[], number[]] {
        const colours = Rubik.getCubieFaceColours(cubie, cube.data.size);
        const n = 1 / (2 * cube.data.size);
        const verts = [
            // LEFT
            -n, -n, -n, ...colours[0], -1, 0, 0,
            -n, n, -n, ...colours[0], -1, 0, 0,
            -n, n, n, ...colours[0], -1, 0, 0,
            -n, -n, n, ...colours[0], -1, 0, 0,
            // RIGHT
            n, -n, -n, ...colours[1], 1, 0, 0,
            n, n, -n, ...colours[1], 1, 0, 0,
            n, n, n, ...colours[1], 1, 0, 0,
            n, -n, n, ...colours[1], 1, 0, 0,
            // DOWN
            -n, -n, -n, ...colours[2], 0, -1, 0,
            n, -n, -n, ...colours[2], 0, -1, 0,
            n, -n, n, ...colours[2], 0, -1, 0,
            -n, -n, n, ...colours[2], 0, -1, 0,
            // UP
            -n, n, -n, ...colours[3], 0, 1, 0,
            n, n, -n, ...colours[3], 0, 1, 0,
            n, n, n, ...colours[3], 0, 1, 0,
            -n, n, n, ...colours[3], 0, 1, 0,
            // BACK
            -n, -n, -n, ...colours[4], 0, 0, -1,
            n, -n, -n, ...colours[4], 0, 0, -1,
            n, n, -n, ...colours[4], 0, 0, -1,
            -n, n, -n, ...colours[4], 0, 0, -1,
            // FRONT
            -n, -n, n, ...colours[5], 0, 0, 1,
            n, -n, n, ...colours[5], 0, 0, 1,
            n, n, n, ...colours[5], 0, 0, 1,
            -n, n, n, ...colours[5], 0, 0, 1,
        ];
        const indexes = [
            ...[0, 2, 1, 0, 3, 2].map(i => i + 0), // L
            ...[0, 1, 2, 0, 2, 3].map(i => i + 4), // R
            ...[0, 1, 2, 0, 2, 3].map(i => i + 8), // D
            ...[0, 2, 1, 0, 3, 2].map(i => i + 12), // U
            ...[0, 2, 1, 0, 3, 2].map(i => i + 16), // B
            ...[0, 1, 2, 0, 2, 3].map(i => i + 20) // F
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