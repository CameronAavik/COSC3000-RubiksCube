"use strict";
var Rubik;
(function (Rubik) {
    Rubik.colours = {
        white: [1, 1, 1, 1],
        blue: [0, 0x51 / 0xFF, 0xBA / 0xFF, 1],
        yellow: [1, 0xD5 / 0xFF, 0, 1],
        green: [0, 0x9E / 0xFF, 0x60 / 0xFF, 1],
        red: [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF, 1],
        orange: [1, 0x58 / 0xFF, 0, 1],
        none: [0, 0, 0, 1]
    };
    Rubik.axes = { x: 0, y: 1, z: 2 };
    Rubik.dirs = { neg: -1, pos: 1 };
    Rubik.faces = [
        { axis: Rubik.axes.x, dir: Rubik.dirs.neg, startingColour: Rubik.colours.green },
        { axis: Rubik.axes.y, dir: Rubik.dirs.neg, startingColour: Rubik.colours.red },
        { axis: Rubik.axes.z, dir: Rubik.dirs.neg, startingColour: Rubik.colours.yellow },
        { axis: Rubik.axes.x, dir: Rubik.dirs.pos, startingColour: Rubik.colours.blue },
        { axis: Rubik.axes.y, dir: Rubik.dirs.pos, startingColour: Rubik.colours.orange },
        { axis: Rubik.axes.z, dir: Rubik.dirs.pos, startingColour: Rubik.colours.white }
    ];
    /**
     * A cubie is an individual cube and is a component of a Rubik's Cube. The cubie class is responsible for keeping
     * track of the colours of each of it's 6 sides in the direction of each face.
     */
    class Cubie {
        constructor(pos, size) {
            this.pos = pos;
            this.size = size;
            this.faceMap = Cubie.getStartingColourMap(pos, size);
        }
        getColour(face) {
            const colour = this.faceMap.get(face);
            if (colour === undefined) {
                throw Error("There is no colour for that Face.");
            }
            return colour;
        }
        rotateToNewPos(axis, newPos) {
            this.pos = newPos;
            const start = 2 * axis + 2;
            const end = start + 3;
            let prev = this.getColour(Rubik.faces[end % 6]);
            for (let i = start; i < end; i++) {
                const current = this.getColour(Rubik.faces[i % 6]);
                this.faceMap.set(Rubik.faces[i % 6], prev);
                prev = current;
            }
        }
        static getStartingColourMap(pos, size) {
            const map = new Map();
            Rubik.faces.forEach(face => {
                map.set(face, Cubie.isOnFace(face, pos, size) ? face.startingColour : Rubik.colours.none);
            });
            return map;
        }
    }
    Cubie.isOnFace = (face, pos, size) => (pos[face.axis] === 0 && face.dir === Rubik.dirs.neg) || (pos[face.axis] === size - 1 && face.dir === Rubik.dirs.pos);
    Rubik.Cubie = Cubie;
    class Cube {
        constructor(size) {
            this.size = size;
            this.getCubie = (pos) => this.cubies[pos[0] + this.size * pos[1] + (Math.pow(this.size, 2)) * pos[2]];
            this.cubies = Cube.genCubies(size);
        }
        rotate(rotations, layer) {
            for (let rot = 0; rot < rotations; rot++) {
                // 1. Perform an in-place matrix transposition of the cubes in the layer
                // Using algo from https://en.wikipedia.org/wiki/In-place_matrix_transposition#Square_matrices
                for (let i = 0; i < this.size - 1; i++) {
                    for (let j = i + 1; j < this.size; j++) {
                        this.swapCubies(this.getPosOnLayer(i, j, layer), this.getPosOnLayer(j, i, layer));
                    }
                }
                // 2. Reverse the rows
                const halfCount = Math.floor(this.size / 2);
                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < halfCount; j++) {
                        this.swapCubies(this.getPosOnLayer(i, j, layer), this.getPosOnLayer(i, (this.size - 1) - j, layer));
                    }
                }
                // 3. Call the rotate method on all the cubies in the layer
                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < this.size; j++) {
                        const pos = this.getPosOnLayer(i, j, layer);
                        this.getCubie(pos).rotateToNewPos(layer.axis, pos);
                    }
                }
            }
        }
        getColoursOnFace(face) {
            const layer = { axis: face.axis, layerNumber: face.dir === Rubik.dirs.neg ? 0 : this.size - 1 };
            const colours = [];
            for (let i = 0; i < this.size; i++) {
                colours[i] = [];
                for (let j = 0; j < this.size; j++) {
                    colours[i][j] = this.getCubie(this.getPosOnLayer(i, j, layer)).getColour(face);
                }
            }
            return colours;
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
        swapCubies(pos1, pos2) {
            const cubie = this.getCubie(pos2);
            this.setCubie(pos2, this.getCubie(pos1));
            this.setCubie(pos1, cubie);
        }
        getPosOnLayer(i, j, layer) {
            switch (layer.axis) {
                case 0: return [layer.layerNumber, i, j];
                case 1: return [i, layer.layerNumber, j];
                case 2: return [i, j, layer.layerNumber];
            }
        }
    }
    Rubik.Cube = Cube;
})(Rubik || (Rubik = {}));
//# sourceMappingURL=rubik.js.map