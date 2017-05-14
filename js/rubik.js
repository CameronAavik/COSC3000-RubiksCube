"use strict";
// Object representing the combination of an axis and a direction
class AxisDirection {
    constructor(axis, dir) {
        this.axis = axis;
        this.dir = dir;
    }
    // returns if the given x, y, z position is on the face belonging to the current axis direction
    isOnFace(pos, size) {
        switch (this.axis) {
            case 'X': return (pos[0] == 0 && this.dir == -1) || (pos[0] == size - 1 && this.dir == 1);
            case 'Y': return (pos[1] == 0 && this.dir == -1) || (pos[1] == size - 1 && this.dir == 1);
            case 'Z': return (pos[2] == 0 && this.dir == -1) || (pos[2] == size - 1 && this.dir == 1);
        }
    }
}
// predefined axis directions for each face of the cube
AxisDirection.L = new AxisDirection('X', -1);
AxisDirection.R = new AxisDirection('X', 1);
AxisDirection.D = new AxisDirection('Y', -1);
AxisDirection.U = new AxisDirection('Y', 1);
AxisDirection.B = new AxisDirection('Z', -1);
AxisDirection.F = new AxisDirection('Z', 1);
// maps colours to the colour codes in RGBA
const colours = new Map([
    ['White', [1, 1, 1, 1]],
    ['Blue', [0, 0x51 / 0xFF, 0xBA / 0xFF, 1]],
    ['Yellow', [1, 0xD5 / 0xFF, 0, 1]],
    ['Green', [0, 0x9E / 0xFF, 0x60 / 0xFF, 1]],
    ['Red', [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF, 1]],
    ['Orange', [1, 0x58 / 0xFF, 0, 1]],
    ['None', [0, 0, 0, 1]],
]);
// maps axis directions to the colour of the face when starting
const startingFaceColours = new Map([
    [AxisDirection.L, 'Green'],
    [AxisDirection.R, 'Blue'],
    [AxisDirection.D, 'Red'],
    [AxisDirection.U, 'Orange'],
    [AxisDirection.B, 'Yellow'],
    [AxisDirection.F, 'White'],
]);
// A cubie is an individual cube and is a component of a Rubik's Cube. The cubie class is responsible for keeping 
// track of it's spatial transformations with respect to the center of the entire cube. It is also responsible for 
// informing about the geometry of the cubie itself to be used when rendering.
class Cubie {
    constructor(pos, size) {
        this.pos = pos;
        this.size = size;
        this.axisDirMap = Cubie.genColourMap(pos, size);
    }
    getColour(axisDir) {
        const colour = this.axisDirMap.get(axisDir);
        if (colour === undefined) {
            throw Error("There is no colour for that AxisDirection.");
        }
        return colour;
    }
    // TODO: double check these axis directions, not tested and probably wrong.
    rotateToNewPos(axis, newPos) {
        this.pos = newPos;
        switch (axis) {
            case 'X':
                this.cycleAxisDirMap([AxisDirection.D, AxisDirection.B, AxisDirection.U, AxisDirection.F]);
                return;
            case 'Y':
                this.cycleAxisDirMap([AxisDirection.B, AxisDirection.F, AxisDirection.F, AxisDirection.R]);
                return;
            case 'Z':
                this.cycleAxisDirMap([AxisDirection.R, AxisDirection.U, AxisDirection.L, AxisDirection.D]);
                return;
        }
    }
    cycleAxisDirMap(axisDirs) {
        const count = axisDirs.length;
        let prev = this.getColour(axisDirs[count - 1]);
        for (let i = 0; i < count; i++) {
            const current = this.getColour(axisDirs[i]);
            this.axisDirMap.set(axisDirs[i], prev);
            prev = current;
        }
    }
    static genColourMap(pos, size) {
        const map = new Map();
        startingFaceColours.forEach((value, key) => {
            map.set(key, key.isOnFace(pos, size) ? value : 'None');
        });
        return map;
    }
}
class Layer {
    constructor(axis, layerNumber) {
        this.axis = axis;
        this.layerNumber = layerNumber;
    }
    rotate(cube, rotations) {
        for (let rot = 0; rot < rotations; rot++) {
            // 1. Perform an in-place matrix transposition of the cubes in the layer
            // Using algo from https://en.wikipedia.org/wiki/In-place_matrix_transposition#Square_matrices
            for (let i = 0; i < cube.size - 1; i++) {
                for (let j = i + 1; j < cube.size; j++) {
                    Layer.swapCubies(cube, this.getPosForElem(i, j), this.getPosForElem(j, i));
                }
            }
            // 2. Reverse the rows
            const halfCount = Math.floor(cube.size / 2);
            for (let i = 0; i < cube.size; i++) {
                for (let j = 0; j < halfCount; j++) {
                    Layer.swapCubies(cube, this.getPosForElem(i, j), this.getPosForElem(i, (cube.size - 1) - j));
                }
            }
            // 3. Call the rotate method on all the cubies in the layer
            for (let i = 0; i < cube.size; i++) {
                for (let j = 0; j < cube.size; j++) {
                    const pos = this.getPosForElem(i, j);
                    cube.getCubie(pos).rotateToNewPos(this.axis, pos);
                }
            }
        }
    }
    static swapCubies(cube, pos1, pos2) {
        const cubie = cube.getCubie(pos2);
        cube.setCubie(pos2, cube.getCubie(pos1));
        cube.setCubie(pos1, cubie);
    }
    // TODO: validate that this is correct
    getPosForElem(i, j) {
        switch (this.axis) {
            case 'X': return [this.layerNumber, i, j];
            case 'Y': return [i, this.layerNumber, j];
            case 'Z': return [i, j, this.layerNumber];
        }
    }
}
class Face extends Layer {
    constructor(axis, layerNumber, axisDir) {
        super(axis, layerNumber);
        this.axisDir = axisDir;
    }
    getColours(cube) {
        const colours = [];
        for (let i = 0; i < cube.size; i++) {
            colours[i] = [];
            for (let j = 0; j < cube.size; j++) {
                colours[i][j] = cube.getCubie(this.getPosForElem(i, j)).getColour(this.axisDir);
            }
        }
        return colours;
    }
}
class RubiksCube {
    constructor(size) {
        this.getAllFaces = () => [this.faces.f, this.faces.u, this.faces.l, this.faces.r, this.faces.d, this.faces.b];
        this.getCubie = (pos) => this.cubies[pos[0] + this.size * pos[1] + (Math.pow(this.size, 2)) * pos[2]];
        this.size = size;
        this.cubies = RubiksCube.genCubies(size);
        const layers = RubiksCube.genLayers(size);
        this.layers = layers.layers;
        this.faces = layers.faces;
    }
    setCubie(pos, cubie) {
        this.cubies[pos[0] + this.size * pos[1] + Math.pow(this.size, 2) * pos[2]] = cubie;
    }
    static genCubies(size) {
        const cubies = [];
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    cubies.push(new Cubie([x, y, z], size));
                }
            }
        }
        return cubies;
    }
    static genLayers(size) {
        const xLayers = [];
        const yLayers = [];
        const zLayers = [];
        for (let layer = 0; layer < size; layer++) {
            const isFace = layer === 0 || layer === size - 1;
            xLayers[layer] = isFace
                ? new Face("X", layer, layer === 0 ? AxisDirection.L : AxisDirection.R)
                : new Layer("X", layer);
            yLayers[layer] = isFace
                ? new Face("Y", layer, layer === 0 ? AxisDirection.D : AxisDirection.U)
                : new Layer("Y", layer);
            zLayers[layer] = isFace
                ? new Face("Z", layer, layer === 0 ? AxisDirection.B : AxisDirection.F)
                : new Layer("Z", layer);
        }
        return {
            layers: { x: xLayers, y: yLayers, z: zLayers },
            // these faces are chosen to match the OpenGL coordinate system
            faces: {
                l: xLayers[0], r: xLayers[size - 1],
                d: yLayers[0], u: yLayers[size - 1],
                b: zLayers[0], f: zLayers[size - 1]
            }
        };
    }
}
//# sourceMappingURL=rubik.js.map