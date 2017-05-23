"use strict";
var Rubik;
(function (Rubik) {
    /**
     * Creates a new Cube of a given size
     * @param size The size of the cube. a 3x3 cube is size 3
     */
    function createCube(size) {
        const cubies = [];
        range(size).forEach(z => {
            range(size).forEach(y => {
                range(size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5] });
                });
            });
        });
        return { cubies, size };
    }
    Rubik.createCube = createCube;
    /**
    * Rotates a given layer of the cube and returns the new cube
    * @param cube The cube which is getting it's layer rotated
    * @param rotationLayer The information about the layer being rotated
    */
    function rotateLayer(cube, rotationLayer) {
        const getCubieIndex = (i, j) => getCubieIndexInLayerPos(cube.size, i, j, rotationLayer);
        const cubies = cube.cubies.slice(); // Create a copy of the cube
        range(cube.size).forEach(i => {
            range(cube.size).forEach(j => {
                const oldCubie = cube.cubies[getCubieIndex(cube.size - j - 1, i)];
                const newFaceMap = getFacesAfterRotation(oldCubie.faces, rotationLayer.axis);
                cubies[getCubieIndex(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap };
            });
        });
        return { cubies, size: cube.size };
    }
    Rubik.rotateLayer = rotateLayer;
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
    function getCubieIndexInLayerPos(cubeSize, i, j, layer) {
        const pos = [i, j];
        pos.splice(layer.axis, 0, layer.layerNum);
        return pos[0] + cubeSize * pos[1] + (Math.pow(cubeSize, 2)) * pos[2];
    }
    // Helper function for generation the interval [0, max)
    const range = (max) => Array.from({ length: max }, (_, k) => k);
})(Rubik || (Rubik = {}));
//# sourceMappingURL=rubik.js.map