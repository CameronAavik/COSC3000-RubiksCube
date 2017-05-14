// TODO: replace with proper Vector class with multiplication and all that jazz
type Vec3<T> = [T, T, T] & { 3?: void };
type Vec4<T> = [T, T, T, T] & { 4?: void };

// string literals representing each of the axes in WebGL
// see https://www.tutorialspoint.com/webgl/images/webgl_coordinate_system.jpg for more info
type Axis = 'X' | 'Y' | 'Z';
// number literals representing the direction along the axis
type Direction = 1 | -1;

// Object representing the combination of an axis and a direction
class AxisDirection {
    // predefined axis directions for each face of the cube
    public static readonly L = new AxisDirection('X', -1);
    public static readonly R = new AxisDirection('X', 1);
    public static readonly D = new AxisDirection('Y', -1);
    public static readonly U = new AxisDirection('Y', 1);
    public static readonly B = new AxisDirection('Z', -1);
    public static readonly F = new AxisDirection('Z', 1);

    constructor(public axis: Axis, public dir: Direction) { }

    // returns if the given x, y, z position is on the face belonging to the current axis direction
    public isOnFace(pos: Vec3<number>, size: number): boolean {
        switch (this.axis) {
            case 'X': return (pos[0] == 0 && this.dir == -1) || (pos[0] == size - 1 && this.dir == 1);
            case 'Y': return (pos[1] == 0 && this.dir == -1) || (pos[1] == size - 1 && this.dir == 1);
            case 'Z': return (pos[2] == 0 && this.dir == -1) || (pos[2] == size - 1 && this.dir == 1);
        }
    }
}

type Colour = 'White' | 'Blue' | 'Yellow' | 'Green' | 'Red' | 'Orange' | 'None';

// maps colours to the colour codes in RGBA
const colours = new Map<Colour, Vec4<number>>([
    ['White', [1, 1, 1, 1]],
    ['Blue', [0, 0x51 / 0xFF, 0xBA / 0xFF, 1]],
    ['Yellow', [1, 0xD5 / 0xFF, 0, 1]],
    ['Green', [0, 0x9E / 0xFF, 0x60 / 0xFF, 1]],
    ['Red', [0xC4 / 0xFF, 0x1E / 0xFF, 0x3A / 0xFF, 1]],
    ['Orange', [1, 0x58 / 0xFF, 0, 1]],
    ['None', [0, 0, 0, 1]],
]);

// maps axis directions to the colour of the face when starting
const startingFaceColours = new Map<AxisDirection, Colour>([
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
    // TODO: translation and rotation matrix relative to center of cube
    public pos: Vec3<number>
    private size: number;
    private axisDirMap: Map<AxisDirection, Colour>;

    constructor(pos: Vec3<number>, size: number) {
        this.pos = pos;
        this.size = size;
        this.axisDirMap = Cubie.genColourMap(pos, size);
    }

    public getColour(axisDir: AxisDirection): Colour {
        const colour = this.axisDirMap.get(axisDir);
        if (colour === undefined) {
            throw Error("There is no colour for that AxisDirection.");
        }
        return colour;
    }

    // TODO: double check these axis directions, not tested and probably wrong.
    public rotateToNewPos(axis: Axis, newPos: Vec3<number>): void {
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

    private cycleAxisDirMap(axisDirs: AxisDirection[]): void {
        const count = axisDirs.length;
        let prev = this.getColour(axisDirs[count - 1]);
        for (let i = 0; i < count; i++) {
            const current = this.getColour(axisDirs[i]);
            this.axisDirMap.set(axisDirs[i], prev);
            prev = current;
        }
    }

    private static genColourMap(pos: Vec3<number>, size: number): Map<AxisDirection, Colour> {
        const map = new Map<AxisDirection, Colour>();
        startingFaceColours.forEach((value, key) => {
            map.set(key, key.isOnFace(pos, size) ? value : 'None');
        });
        return map;
    }
}

class Layer {
    // Represents the axis of rotation for this layer
    public readonly axis: Axis;
    // Represents which layer on the axis of rotation this is
    public readonly layerNumber: number;

    constructor(axis: Axis, layerNumber: number) {
        this.axis = axis;
        this.layerNumber = layerNumber;
    }

    public rotate(cube: RubiksCube, rotations: number) {
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

    private static swapCubies(cube: RubiksCube, pos1: Vec3<number>, pos2: Vec3<number>): void {
        const cubie = cube.getCubie(pos2);
        cube.setCubie(pos2, cube.getCubie(pos1));
        cube.setCubie(pos1, cubie);
    }

    // TODO: validate that this is correct
    protected getPosForElem(i: number, j: number): Vec3<number> {
        switch (this.axis) {
            case 'X': return [this.layerNumber, i, j];
            case 'Y': return [i, this.layerNumber, j];
            case 'Z': return [i, j, this.layerNumber];
        }
    }
}

class Face extends Layer {
    constructor(axis: Axis, layerNumber: number, public axisDir: AxisDirection) {
        super(axis, layerNumber);
    }

    public getColours(cube: RubiksCube): Colour[][] {
        const colours: Colour[][] = [];
        for (let i = 0; i < cube.size; i++) {
            colours[i] = [];
            for (let j = 0; j < cube.size; j++) {
                colours[i][j] = cube.getCubie(this.getPosForElem(i, j)).getColour(this.axisDir);
            }
        }
        return colours;
    }
}

type RubiksCubeLayers = { x: Layer[], y: Layer[], z: Layer[] }
type RubiksCubeFaces = { f: Face, b: Face, l: Face, r: Face, u: Face, d: Face };

class RubiksCube {
    // We maintain a list of all the cubies in the cube
    // These cubies are sorted such that the 0th cube is LDB and last cube is RUF and that it first increases in the x direction, then y, then z
    public cubies: Cubie[];
    // We maintain every layer that can be rotated
    public layers: RubiksCubeLayers;
    // We maintain every faces for convenience for solvers
    public faces: RubiksCubeFaces;
    // We also store the size of the cube. This is 3 in a typical Rubik's Cube
    public size: number;

    constructor(size: number) {
        this.size = size;
        this.cubies = RubiksCube.genCubies(size);
        const layers = RubiksCube.genLayers(size);
        this.layers = layers.layers;
        this.faces = layers.faces;
    }

    public getAllFaces = () =>
        [this.faces.f, this.faces.u, this.faces.l, this.faces.r, this.faces.d, this.faces.b];

    public getCubie = (pos: Vec3<number>) =>
        this.cubies[pos[0] + this.size * pos[1] + (this.size ** 2) * pos[2]];

    public setCubie(pos: Vec3<number>, cubie: Cubie): void {
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

    private static genLayers(size: number): { layers: RubiksCubeLayers, faces: RubiksCubeFaces } {
        const xLayers: Layer[] = [];
        const yLayers: Layer[] = [];
        const zLayers: Layer[] = [];
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
                l: xLayers[0] as Face, r: xLayers[size - 1] as Face,
                d: yLayers[0] as Face, u: yLayers[size - 1] as Face,
                b: zLayers[0] as Face, f: zLayers[size - 1] as Face
            }
        };
    }

    // TODO: define generic rotation method which will take in an axis, a list of layers and a rotation angle
}
