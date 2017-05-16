namespace Rubik {
    /** A colour contains an rgba vector. The colours map contains the official rubik's cube colours */
    export type Colour = [number, number, number, number] & { 4?: void };
    export const colours = {
        white: [1, 1, 1, 1] as Colour,
        blue: [0, 0x51 / 0xFF, 0xBA / 0xFF, 1] as Colour,
        yellow: [1, 0xD5 / 0xFF, 0, 1] as Colour,
        green: [0, 0x9E / 0xFF, 0x60 / 0xFF, 1] as Colour,
        red: [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF, 1] as Colour,
        orange: [1, 0x58 / 0xFF, 0, 1] as Colour,
        none: [0, 0, 0, 1] as Colour
    }

    export type Axis = 0 | 1 | 2;
    export const axes = { x: 0 as Axis, y: 1 as Axis, z: 2 as Axis };

    export type Direction = 1 | -1;
    export const dirs = { neg: -1 as Direction, pos: 1 as Direction };

    export type Face = { axis: Axis, dir: Direction, startingColour: Colour };
    export const faces: Face[] = [
        { axis: axes.x, dir: dirs.neg, startingColour: colours.green },
        { axis: axes.y, dir: dirs.neg, startingColour: colours.red },
        { axis: axes.z, dir: dirs.neg, startingColour: colours.yellow },
        { axis: axes.x, dir: dirs.pos, startingColour: colours.blue },
        { axis: axes.y, dir: dirs.pos, startingColour: colours.orange },
        { axis: axes.z, dir: dirs.pos, startingColour: colours.white }
    ];

    export type Position = [number, number, number] & { 3?: void };

    /** 
     * A cubie is an individual cube and is a component of a Rubik's Cube. The cubie class is responsible for keeping 
     * track of the colours of each of it's 6 sides in the direction of each face.
     */
    export class Cubie {
        private faceMap: Map<Face, Colour>;

        constructor(public pos: Position, public size: number) {
            this.faceMap = Cubie.getStartingColourMap(pos, size);
        }

        public getColour(face: Face): Colour {
            const colour = this.faceMap.get(face);
            if (colour === undefined) {
                throw Error("There is no colour for that Face.");
            }
            return colour;
        }

        public rotateToNewPos(axis: Axis, newPos: Position): void {
            this.pos = newPos;
            const start = 2 * axis + 2;
            const end = start + 3;
            let prev = this.getColour(faces[end % 6]);
            for (let i = start; i < end; i++) {
                const current = this.getColour(faces[i % 6]);
                this.faceMap.set(faces[i % 6], prev);
                prev = current;
            }
        }

        private static getStartingColourMap(pos: Position, size: number): Map<Face, Colour> {
            const map = new Map<Face, Colour>();
            faces.forEach(face => {
                map.set(face, Cubie.isOnFace(face, pos, size) ? face.startingColour : colours.none);
            });
            return map;
        }

        private static isOnFace = (face: Face, pos: Position, size: number): boolean =>
            (pos[face.axis] === 0 && face.dir === dirs.neg) || (pos[face.axis] === size - 1 && face.dir === dirs.pos);
    }

    export type Layer = { axis: Axis, layerNumber: number };

    export class Cube {
        /** 
         * We maintain a list of all the cubies in the cube. These cubies are sorted such that the 0th cube is LDB and 
         * the last cube is RUF and that it first increases in the x direction, then y, then z
         */
        public cubies: Cubie[];

        constructor(public size: number) {
            this.cubies = Cube.genCubies(size);
        }

        public rotate(rotations: number, layer: Layer) {
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

        public getColoursOnFace(face: Face): Colour[][] {
            const layer: Layer = { axis: face.axis, layerNumber: face.dir === dirs.neg ? 0 : this.size - 1 };
            const colours: Colour[][] = [];
            for (let i = 0; i < this.size; i++) {
                colours[i] = [];
                for (let j = 0; j < this.size; j++) {
                    colours[i][j] = this.getCubie(this.getPosOnLayer(i, j, layer)).getColour(face);
                }
            }
            return colours;
        }

        private getCubie = (pos: Position) => this.cubies[pos[0] + this.size * pos[1] + (this.size ** 2) * pos[2]];

        private setCubie(pos: Position, cubie: Cubie): void {
            this.cubies[pos[0] + this.size * pos[1] + this.size ** 2 * pos[2]] = cubie;
        }

        private static genCubies(size: number): Cubie[] {
            const cubies: Cubie[] = [];
            for (let z = 0; z < size; z++) {
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        cubies.push(new Cubie([x, y, z], size));
                    }
                }
            }
            return cubies;
        }

        private swapCubies(pos1: Position, pos2: Position): void {
            const cubie = this.getCubie(pos2);
            this.setCubie(pos2, this.getCubie(pos1));
            this.setCubie(pos1, cubie);
        }

        private getPosOnLayer(i: number, j: number, layer: Layer): Position {
            switch (layer.axis) {
                case 0: return [layer.layerNumber, i, j];
                case 1: return [i, layer.layerNumber, j];
                case 2: return [i, j, layer.layerNumber];
            }
        }
    }
}