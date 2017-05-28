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
    function vecToFloatArray(vec) {
        return new Float32Array(vec);
    }
    Utils.vecToFloatArray = vecToFloatArray;
    function matToFloatArray(mat) {
        return new Float32Array([
            mat[0][0], mat[1][0], mat[2][0], mat[3][0],
            mat[0][1], mat[1][1], mat[2][1], mat[3][1],
            mat[0][2], mat[1][2], mat[2][2], mat[3][2],
            mat[0][3], mat[1][3], mat[2][3], mat[3][3]
        ]);
    }
    Utils.matToFloatArray = matToFloatArray;
    function getTranslationMatrix([x, y, z]) {
        return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
    }
    Utils.getTranslationMatrix = getTranslationMatrix;
    function getRotationMatrix([x, y, z], angle) {
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
    Utils.getRotationMatrix = getRotationMatrix;
    function getPerspectiveMatrix(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1 / (near - far);
        return [
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (far + near) * rangeInv, 2 * far * near * rangeInv],
            [0, 0, -1, 0]
        ];
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
        let count = 0;
        Utils.range(size).forEach(z => {
            Utils.range(size).forEach(y => {
                Utils.range(size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5], index: count });
                    count += 1;
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
                cubies[getCubie(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap, index: oldCubie.index };
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
                cycle = [0, 1, 5, 4, 2, 3];
                break;
            case 1:
                cycle = [4, 5, 2, 3, 1, 0];
                break;
            case 2:
                cycle = [3, 2, 0, 1, 4, 5];
                break;
        }
        return faces.map(f => cycle[f]);
    }
    /**
     * Will return the index into the cubies array belonging to the (i, j)th cubie in the layer
     * @param cubeSize The size of the cube
     * @param i The ith row of the layer
     * @param j The jth column of the layer
     * @param layer The layer information
     */
    function getCubieIndex(cubeSize, i, j, layer) {
        let pos;
        switch (layer.axis) {
            case 0:
                pos = [layer.layerNum, j, i];
                break;
            case 1:
                pos = [i, layer.layerNum, j];
                break;
            case 2:
                pos = [i, j, layer.layerNum];
                break;
            default: throw Error("The axis should only be 0, 1, or 2");
        }
        return pos[0] + pos[1] * cubeSize + pos[2] * Math.pow((cubeSize), 2);
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
        startPerms.forEach(startPerm => {
            let mat = Utils.Mat4Identity;
            let faceMap = [0, 1, 2, 3, 4, 5];
            startPerm.forEach(turn => {
                mat = Utils.mulMats(rots[turn], mat);
                faceMap = getFacesAfterRotation(faceMap, turn);
            });
            Utils.range(4).forEach(_ => {
                rotMap.set(JSON.stringify(faceMap), mat);
                mat = Utils.mulMats(rots[0], mat);
                faceMap = getFacesAfterRotation(faceMap, 0);
            });
        });
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
        const cubies = data.cubies.map(c => getWebGLCubieFromCubie(c, size));
        return {
            data,
            cubies,
            tMat: Utils.getTranslationMatrix([0, 0, -2]),
            rMat: Utils.Mat4Identity,
            animation: {
                isActive: false,
                rotMatrix: Utils.Mat4Identity,
                layer: { axis: 0, layerNum: 0 },
                angleTurn: 0,
                startTime: 0
            }
        };
    }
    Rubik.createGLCube = createGLCube;
    function applyMove(cube, move, rotations) {
        if (cube.animation.isActive) {
            console.log("Can't apply move while the animation is still active");
            return cube;
        }
        const axis = (move === "L" || move === "R") ? 0 : (move === "D" || move === "U") ? 1 : 2;
        const isOpposite = move === "R" || move === "U" || move === "F";
        const layerNum = isOpposite ? cube.data.size - 1 : 0;
        const reverseRotations = move === "R" || move === "U" || move === "B";
        const rotationCount = reverseRotations ? (4 - (rotations % 4)) % 4 : rotations % 4;
        let newCube = cube.data;
        Utils.range(rotationCount).forEach(_ => {
            newCube = rotateLayer(newCube, { axis, layerNum });
        });
        const newAnimation = {
            isActive: true,
            rotMatrix: Utils.Mat4Identity,
            layer: { axis, layerNum },
            angleTurn: (isOpposite ? -1 : 1) * (rotations % 4) * Math.PI / 2,
            startTime: performance.now()
        };
        return { data: newCube, cubies: cube.cubies, tMat: cube.tMat, rMat: cube.rMat, animation: newAnimation };
    }
    Rubik.applyMove = applyMove;
    const timeToTurnRadian = 2 / Math.PI * 1000; // it takes 1 second to turn 90 degrees
    function progressAnimation(cube, currentTime) {
        const anim = cube.animation;
        if (anim.isActive) {
            const rotationAxis = [0, 0, 0];
            rotationAxis[anim.layer.axis] = 1;
            const turnTime = Math.abs(anim.angleTurn * timeToTurnRadian);
            const progress = (currentTime - anim.startTime) / turnTime;
            if (progress >= 1) {
                anim.isActive = false;
                // Update all the cubies to their new rotation matrices as the animation is over
                const newWebGLCubies = cube.data.cubies.map(c => getWebGLCubieFromCubie(c, cube.data.size));
                return { data: cube.data, cubies: newWebGLCubies, tMat: cube.tMat, rMat: cube.rMat, animation: anim };
            }
            anim.rotMatrix = Utils.getRotationMatrix(rotationAxis, anim.angleTurn * progress);
        }
        return cube;
    }
    Rubik.progressAnimation = progressAnimation;
    function cubieIsInLayer(index, layer, cubeSize) {
        let posInAxis;
        switch (layer.axis) {
            case 0:
                posInAxis = index % cubeSize;
                break;
            case 1:
                posInAxis = (index / cubeSize) % cubeSize;
                break;
            case 2:
                posInAxis = (index / (Math.pow(cubeSize, 2))) % cubeSize;
                break;
            default: throw Error("The axis was not valid");
        }
        return Math.floor(posInAxis) == layer.layerNum;
    }
    Rubik.cubieIsInLayer = cubieIsInLayer;
    function getWebGLCubieFromCubie(cubieData, size) {
        return {
            data: cubieData,
            tMat: Utils.getTranslationMatrix(getGlPosFromCubiePos(cubieData, size)),
            rMat: getRotMatrixFromFaceMap(cubieData.faces)
        };
    }
    function getGlPosFromCubiePos(cubieData, size) {
        const pos = cubieData.startPos;
        const n = 1 / (size * 2);
        const mapPos = (x) => (x / size + n) - 0.5;
        return pos.map(mapPos);
    }
})(Rubik || (Rubik = {}));
var Program;
(function (Program) {
    let counter = 0;
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
        cube.cubies.forEach(cubie => {
            const [verts, indices] = getCubieVertData(cubie);
            indexData = indexData.concat(indices.map(i => i + vertData.length / 6));
            vertData = vertData.concat(verts);
        });
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
    function onAnimationLoop(time) {
        window.requestAnimationFrame(onAnimationLoop);
        cube = Rubik.progressAnimation(cube, time);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        render();
    }
    function render() {
        // Set the uniform matrices which are all in common
        const projectionMat = gl.getUniformLocation(glProg, "projectionMat");
        gl.uniformMatrix4fv(projectionMat, false, Utils.matToFloatArray(pMat));
        const modelMat = gl.getUniformLocation(glProg, "modelMat");
        counter += 1;
        const rotToApply = Utils.mulMats(Utils.getRotationMatrix([0, 1, 0], counter * 0.005), Utils.getRotationMatrix([0, 0, 1], counter * 0.01));
        const rotationMat = Utils.mulMats(cube.rMat, rotToApply);
        const cubeMat = Utils.mulMats(cube.tMat, rotationMat);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // Position Attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(0);
        // Colour Attribute
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        gl.enableVertexAttribArray(1);
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
        if (counter % 200 === 0) {
            const index = Math.floor(Math.random() * 6);
            const move = "LRDUBF"[index];
            console.log(move);
            cube = Rubik.applyMove(cube, move, 1);
        }
    }
    function getCubieVertData(cubie) {
        const colours = Rubik.getCubieFaceColours(cubie, cube.data.size);
        const n = 1 / (2 * cube.data.size);
        const verts = [
            // LEFT
            -n, -n, -n, ...colours[0],
            -n, n, -n, ...colours[0],
            -n, n, n, ...colours[0],
            -n, -n, n, ...colours[0],
            // RIGHT
            n, -n, -n, ...colours[1],
            n, n, -n, ...colours[1],
            n, n, n, ...colours[1],
            n, -n, n, ...colours[1],
            // DOWN
            -n, -n, -n, ...colours[2],
            n, -n, -n, ...colours[2],
            n, -n, n, ...colours[2],
            -n, -n, n, ...colours[2],
            // UP
            -n, n, -n, ...colours[3],
            n, n, -n, ...colours[3],
            n, n, n, ...colours[3],
            -n, n, n, ...colours[3],
            // BACK
            -n, -n, -n, ...colours[4],
            n, -n, -n, ...colours[4],
            n, n, -n, ...colours[4],
            -n, n, -n, ...colours[4],
            // FRONT
            -n, -n, n, ...colours[5],
            n, -n, n, ...colours[5],
            n, n, n, ...colours[5],
            -n, n, n, ...colours[5]
        ];
        const indexes = [
            ...[0, 2, 1, 0, 3, 2].map(i => i + 0),
            ...[0, 1, 2, 0, 2, 3].map(i => i + 4),
            ...[0, 1, 2, 0, 2, 3].map(i => i + 8),
            ...[0, 2, 1, 0, 3, 2].map(i => i + 12),
            ...[0, 2, 1, 0, 3, 2].map(i => i + 16),
            ...[0, 1, 2, 0, 2, 3].map(i => i + 20) // F
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