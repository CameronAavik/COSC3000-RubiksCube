"use strict";
var Utils;
(function (Utils) {
    const indexes = [0, 1, 2, 3];
    Utils.Mat4Identity = indexes.map(i => indexes.map(j => i === j ? 1 : 0));
    function mulMats(a, b) {
        return indexes.map(i => indexes.map(j => indexes.map(k => a[i][k] * b[k][j]).reduce(sum, 0)));
    }
    Utils.mulMats = mulMats;
    function mulMatVec(a, b) {
        return indexes.map(i => indexes.map(j => a[i][j] * b[j]).reduce(sum, 0));
    }
    Utils.mulMatVec = mulMatVec;
    function VecToFloatArray(vec) {
        return new Float32Array(vec);
    }
    Utils.VecToFloatArray = VecToFloatArray;
    function MatToFloatArray(mat) {
        return new Float32Array([
            mat[0][0], mat[0][1], mat[0][2], mat[0][3],
            mat[1][0], mat[1][1], mat[1][2], mat[1][3],
            mat[2][0], mat[2][1], mat[2][2], mat[2][3],
            mat[3][0], mat[3][1], mat[3][2], mat[3][3],
        ]);
    }
    Utils.MatToFloatArray = MatToFloatArray;
    function getTranslationMatrix([x, y, z]) {
        return [[x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]];
    }
    Utils.getTranslationMatrix = getTranslationMatrix;
    function getRotationMatrix([x, y, z], angle) {
        const cos = Math.cos(angle);
        const mcos = 1 - cos;
        const sin = Math.sin(angle);
        return [
            [cos + x * x * mcos, x * y * mcos - x * sin, x * z * mcos + y * sin, 0],
            [y * x * mcos + z * sin, cos + y * y * mcos, y * z * mcos - x * sin, 0],
            [z * x * mcos - y * sin, z * y * mcos + x * sin, cos + z * z * mcos, 0],
            [0, 0, 0, 1]
        ];
    }
    Utils.getRotationMatrix = getRotationMatrix;
    function getPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov) / 2;
        const nf = 1 / (near - far);
        return [[f / aspect, 0, 0, 0], [0, f, 0, 0], [0, 0, (far + near) * nf, -1], [0, 0, 2 * far * near * nf, 0]];
    }
    Utils.getPerspectiveMatrix = getPerspectiveMatrix;
    // Helper function for generation the interval [0, max)
    Utils.range = (max) => Array.from({ length: max }, (_, k) => k);
    const sum = (a, b) => a + b;
})(Utils || (Utils = {}));
var Rubik;
(function (Rubik) {
    /**
     * Creates a new Cube of a given size
     * @param size The size of the cube. a 3x3 cube is size 3
     */
    function createCubeData(size) {
        const cubies = [];
        Utils.range(size).forEach(z => {
            Utils.range(size).forEach(y => {
                Utils.range(size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5] });
                });
            });
        });
        return { cubies, size };
    }
    /**
    * Rotates a given layer of the cube and returns the new cube
    * @param cube The cube which is getting it's layer rotated
    * @param rotationLayer The information about the layer being rotated
    */
    function rotateLayer(cube, rotationLayer) {
        const getCubie = (i, j) => getCubieIndex(cube.size, i, j, rotationLayer);
        const cubies = cube.cubies.slice(); // Create a copy of the cube
        Utils.range(cube.size).forEach(i => {
            Utils.range(cube.size).forEach(j => {
                const oldCubie = cube.cubies[getCubie(cube.size - j - 1, i)];
                const newFaceMap = getFacesAfterRotation(oldCubie.faces, rotationLayer.axis);
                cubies[getCubie(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap };
            });
        });
        return { cubies, size: cube.size };
    }
    /**
     * Returns the FaceMap after a rotation on a given axis
     * @param faces A FaceMap which is being rotated
     * @param axis The axis of rotation
     */
    function getFacesAfterRotation(faces, axis) {
        let cycle;
        switch (axis) {
            case 0:
                cycle = [0, 1, 4, 5, 2, 3];
                break;
            case 1:
                cycle = [5, 4, 2, 3, 0, 1];
                break;
            case 2:
                cycle = [2, 3, 1, 0, 4, 5];
                break;
        }
        return faces.map(f => faces[cycle[f]]);
    }
    /**
     * Will return the index into the cubies array belonging to the (i, j)th cubie in the layer
     * @param cubeSize The size of the cube
     * @param i The ith row of the layer
     * @param j The jth column of the layer
     * @param layer The layer information
     */
    function getCubieIndex(cubeSize, i, j, layer) {
        const pos = [i, j];
        pos.splice(layer.axis, 0, layer.layerNum);
        return pos[0] + cubeSize * pos[1] + (Math.pow(cubeSize, 2)) * pos[2];
    }
    function getRotMatrixFromFaceMap(faces) {
        const mat = rotMatrixMapping.get(JSON.stringify(faces));
        if (mat === undefined) {
            throw Error("Could not find rotation matrix for that face mapping");
        }
        return mat;
    }
    const rotMatrixMapping = generateRotMatrixMapping();
    function generateRotMatrixMapping() {
        const rots = [Utils.getRotationMatrix([1, 0, 0], Math.PI / 2), Utils.getRotationMatrix([0, 1, 0], Math.PI / 2)];
        const startPerms = [[], [1], [1, 1], [1, 1, 1], [0, 1], [0, 0, 0, 1]];
        const rotMap = new Map();
        for (let startPerm of startPerms) {
            let mat = Utils.Mat4Identity;
            let faceMap = [0, 1, 2, 3, 4, 5];
            for (let turn of startPerm) {
                mat = Utils.mulMats(mat, rots[turn]);
                faceMap = getFacesAfterRotation(faceMap, turn);
            }
            for (let i = 0; i < 4; i++) {
                rotMap.set(JSON.stringify(faceMap), mat);
                mat = Utils.mulMats(mat, rots[0]);
                faceMap = getFacesAfterRotation(faceMap, 0);
            }
        }
        return rotMap;
    }
    Rubik.colours = {
        white: [1, 1, 1],
        blue: [0, 0x51 / 0xFF, 0xBA / 0xFF],
        yellow: [1, 0xD5 / 0xFF, 0],
        green: [0, 0x9E / 0xFF, 0x60 / 0xFF],
        red: [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF],
        orange: [1, 0x58 / 0xFF, 0],
        none: [0, 0, 0]
    };
    function getCubieFaceColours(cubie, size) {
        const pos = cubie.data.startPos;
        const n = size - 1;
        return [
            pos[0] === 0 ? Rubik.colours.blue : Rubik.colours.none,
            pos[0] === n ? Rubik.colours.green : Rubik.colours.none,
            pos[1] === 0 ? Rubik.colours.orange : Rubik.colours.none,
            pos[1] === n ? Rubik.colours.red : Rubik.colours.none,
            pos[2] === 0 ? Rubik.colours.yellow : Rubik.colours.none,
            pos[2] === n ? Rubik.colours.white : Rubik.colours.none,
        ];
    }
    Rubik.getCubieFaceColours = getCubieFaceColours;
    function createGLCube(size) {
        const data = createCubeData(size);
        const cubies = data.cubies.map(getWebGLCubieFromCubie);
        return {
            data,
            cubies,
            tMat: Utils.getTranslationMatrix([0, 0, 1]),
            rMat: Utils.mulMats(Utils.getRotationMatrix([0, 1, 0], Math.PI / 4), Utils.getRotationMatrix([0, 0, 1], Math.PI / 4))
        };
    }
    Rubik.createGLCube = createGLCube;
    function applyMove(cube, move, rotations) {
        const axis = (move === "L" || move === "R") ? 0 : (move === "D" || move === "U") ? 1 : 2;
        const isOpposite = move === "R" || move === "U" || move === "F";
        const layerNum = isOpposite ? cube.data.size - 1 : 0;
        const rotationCount = isOpposite ? (4 - (rotations % 4)) : rotations % 4;
        let newCube = cube.data;
        Utils.range(rotationCount).forEach(_ => {
            newCube = rotateLayer(newCube, { axis, layerNum });
        });
        const newWebGLCubies = newCube.cubies.map(getWebGLCubieFromCubie);
        return { data: newCube, cubies: newWebGLCubies, tMat: cube.tMat, rMat: cube.rMat };
    }
    Rubik.applyMove = applyMove;
    function getWebGLCubieFromCubie(cubieData) {
        return {
            data: cubieData,
            tMat: Utils.getTranslationMatrix(cubieData.startPos),
            rMat: getRotMatrixFromFaceMap(cubieData.faces)
        };
    }
})(Rubik || (Rubik = {}));
var Program;
(function (Program) {
    let cube;
    let gl;
    let glProg;
    let canvas;
    let pMat;
    let vertData = [];
    let indexData = [];
    let vertBuffer;
    let indexBuffer;
    function loadState(input) {
        const canvasElem = document.getElementById(input.canvasId);
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
    Program.loadState = loadState;
    function runProgram() {
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
            vertData = vertData.concat(verts);
            indexData = indexData.concat(indices.map(i => i + vertData.length));
        }
        // Initialise the vertex buffer, which contains position and colour data
        vertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertData), gl.STATIC_DRAW);
        // Initialise the index buffer, which contains the offsets for each vertex in the vertex buffer
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        // Set the animation loop callback
        window.requestAnimationFrame(onAnimationLoop);
    }
    Program.runProgram = runProgram;
    function onWindowResize() {
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
        const projectionMat = gl.getUniformLocation(glProg, "projectionMat");
        const cubeTranslationMat = gl.getUniformLocation(glProg, "cubeTranslationMat");
        const cubeRotationMat = gl.getUniformLocation(glProg, "cubeRotationMat");
        const cubieTranslationMat = gl.getUniformLocation(glProg, "cubieTranslationMat");
        const cubieRotationMat = gl.getUniformLocation(glProg, "cubieRotationMat");
        gl.uniformMatrix4fv(projectionMat, false, Utils.MatToFloatArray(pMat));
        gl.uniformMatrix4fv(cubeTranslationMat, false, Utils.MatToFloatArray(cube.tMat));
        gl.uniformMatrix4fv(cubeRotationMat, false, Utils.MatToFloatArray(cube.rMat));
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
            gl.uniformMatrix4fv(cubieTranslationMat, false, Utils.MatToFloatArray(cubie.tMat));
            gl.uniformMatrix4fv(cubieRotationMat, false, Utils.MatToFloatArray(cubie.rMat));
            const numVertices = 36;
            gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_SHORT, i * numVertices * 2);
        }
    }
    function getCubieVertData(cubie) {
        const colours = Rubik.getCubieFaceColours(cubie, cube.data.size);
        const n = 1 / (2 * cube.data.size);
        const verts = [
            // LEFT
            -n, -n, n, ...colours[0],
            -n, -n, -n, ...colours[0],
            -n, n, n, ...colours[0],
            -n, n, -n, ...colours[0],
            // RIGHT
            n, -n, -n, ...colours[1],
            n, -n, n, ...colours[1],
            n, n, -n, ...colours[1],
            n, n, n, ...colours[1],
            // DOWN
            n, -n, -n, ...colours[2],
            -n, -n, -n, ...colours[2],
            n, -n, n, ...colours[2],
            -n, -n, n, ...colours[2],
            // UP
            n, n, n, ...colours[3],
            -n, n, n, ...colours[3],
            n, n, -n, ...colours[3],
            -n, n, -n, ...colours[3],
            // BACK
            -n, -n, -n, ...colours[4],
            n, -n, -n, ...colours[4],
            -n, n, -n, ...colours[4],
            n, n, -n, ...colours[4],
            // FRONT
            n, -n, n, ...colours[5],
            -n, -n, n, ...colours[5],
            n, n, n, ...colours[5],
            -n, n, n, ...colours[5],
        ];
        const indexes = [
            0, 1, 2, 2, 1, 3,
            4, 5, 6, 6, 5, 7,
            8, 9, 10, 10, 9, 11,
            12, 13, 14, 14, 13, 15,
            16, 17, 18, 18, 17, 19,
            20, 21, 22, 22, 21, 23,
        ];
        return [verts, indexes];
    }
    function loadGLContext(canvas) {
        return new Promise((resolve, reject) => {
            const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (ctx !== null) {
                resolve(ctx);
            }
            else {
                reject(new Error("WebGL not available"));
            }
        });
    }
    function loadFile(filePath) {
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
    function loadShaders(gl, vertexShader, fragmentShader) {
        return Promise.all([
            createShader(gl, vertexShader, gl.VERTEX_SHADER),
            createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
        ]).then(([vertexShader, fragmentShader]) => ({ vertexShader, fragmentShader }));
    }
    function createShader(gl, source, type) {
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
    function createProgram(gl, vertexShader, fragmentShader) {
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
                gl.useProgram(program);
                resolve(program);
            }
            else {
                const log = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                reject(log);
            }
        });
    }
})(Program || (Program = {}));
const inputs = {
    canvasId: "glCanvas",
    vertexShaderPath: "shaders/vertex-shader.glsl",
    fragmentShaderPath: "shaders/fragment-shader.glsl"
};
Program.loadState(inputs).then(Program.runProgram).catch(console.log);
//# sourceMappingURL=rubik.js.map