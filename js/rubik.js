"use strict";
var Rubik;
(function (Rubik) {
    const IdentityMatrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    /**
     * Multiplies two matrices and returns the result
     * @param a A 3x3 Matrix
     * @param b A 3x3 Matrix
     */
    function multiplyMatrix(a, b) {
        return [0, 1, 2].map(i => [0, 1, 2].map(j => [0, 1, 2].map(k => a[i][k] * b[k][j]).reduce((a, b) => a + b, 0)));
    }
    /**
     * See https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
     * @param axis The axis of rotation
     * @param angle The angle being rotated in radians (use right handed rule)
     */
    function getRotationMatrix(axis, angle) {
        const [x, y, z] = axis;
        const cos = Math.cos(angle);
        const mcos = 1 - cos;
        const sin = Math.sin(angle);
        return [
            [cos + x * x * mcos, x * y * mcos - x * sin, x * z * mcos + y * sin],
            [y * x * mcos + z * sin, cos + y * y * mcos, y * z * mcos - x * sin],
            [z * x * mcos - y * sin, z * y * mcos + x * sin, cos + z * z * mcos]
        ];
    }
    /**
     * Creates a new Cube of a given size
     * @param size The size of the cube. a 3x3 cube is size 3
     */
    function createCube(size) {
        const cubies = [];
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    cubies.push({ startPos: [x, y, z], rotationMatrix: IdentityMatrix });
                }
            }
        }
        return { cubies, size };
    }
    Rubik.createCube = createCube;
    /**
     * Will return the index into the cubies array belonging to the (i, j)th cubie in the layer
     * @param cubeSize The size of the cube
     * @param i The ith row of the layer
     * @param j The jth column of the layer
     * @param layer The layer information
     */
    function getCubieIndexInLayerPos(cubeSize, i, j, layer) {
        const pos = [i, j];
        pos.splice(layer.axisNumber, 0, layer.layerNum);
        return pos[0] + cubeSize * pos[1] + (Math.pow(cubeSize, 2)) * pos[2];
    }
    /**
     * Rotates a given layer of the cube and returns the new cube
     * @param cube The cube which is getting it's layer rotated
     * @param rotationLayer The information about the layer being rotated
     */
    function rotateLayer(cube, rotationLayer) {
        const axis = IdentityMatrix[rotationLayer.axisNumber];
        const rotationMatrix = getRotationMatrix(axis, Math.PI / 2);
        const getCubieIndex = (i, j) => getCubieIndexInLayerPos(cube.size, i, j, rotationLayer);
        const cubies = cube.cubies.slice(); // Create a copy of the cube
        for (let i = 0; i < cube.size; i++) {
            for (let j = 0; j < cube.size; j++) {
                const oldCubie = cube.cubies[getCubieIndex(cube.size - j - 1, i)];
                const newCubieRotMatrix = multiplyMatrix(oldCubie.rotationMatrix, rotationMatrix);
                cubies[getCubieIndex(i, j)] = { startPos: oldCubie.startPos, rotationMatrix: newCubieRotMatrix };
            }
        }
        return { cubies, size: cube.size };
    }
    Rubik.rotateLayer = rotateLayer;
})(Rubik || (Rubik = {}));
//# sourceMappingURL=rubik.js.map