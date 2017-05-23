namespace Rubik {
    // There are 6 faces, 0=L,1=R,2=D,3=U,4=B,5=F
    export type Face = 0 | 1 | 2 | 3 | 4 | 5;
    // Tracks the face that each original face has ended up on
    export type FaceMap = [Face, Face, Face, Face, Face, Face] & { 6?: void };
    // A position vector that tracks x, y, and z values
    export type Position = Readonly<[number, number, number] & { 3?: void }>;

    /**
     * A cubie is an individual cube inside the Rubik's Cube. It is completely represented by it's starting position 
     * and a rotation matrix
     */
    export type Cubie = { readonly startPos: Position, readonly faces: FaceMap }

    /** 
     * We maintain a list of all the cubies in the cube. These cubies are sorted such that the 0th cube is LDB and 
     * the last cube is RUF and that it first increases in the x direction, then y, then z. We also maintain the size
     * of the cube as described by createCube.
     */
    export type Cube = { readonly cubies: ReadonlyArray<Cubie>, readonly size: number };

    /**
     * Creates a new Cube of a given size
     * @param size The size of the cube. a 3x3 cube is size 3
     */
    export function createCube(size: number): Cube {
        const cubies: Cubie[] = [];
        range(0, size).forEach(z => {
            range(0, size).forEach(y => {
                range(0, size).forEach(x => {
                    cubies.push({ startPos: [x, y, z], faces: [0, 1, 2, 3, 4, 5] });
                });
            });
        });
        return { cubies, size };
    }

    // There are three axes, 0=x, 1=y, 2=z
    export type Axis = 0 | 1 | 2;
    export type Layer = { readonly axis: Axis, readonly layerNum: number };

    /**
    * Rotates a given layer of the cube and returns the new cube
    * @param cube The cube which is getting it's layer rotated
    * @param rotationLayer The information about the layer being rotated
    */
    export function rotateLayer(cube: Cube, rotationLayer: Layer): Cube {
        const getCubieIndex = (i: number, j: number) => getCubieIndexInLayerPos(cube.size, i, j, rotationLayer);
        const cubies = cube.cubies.slice(); // Create a copy of the cube
        range(0, cube.size).forEach(i => {
            range(0, cube.size).forEach(j => {
                const oldCubie = cube.cubies[getCubieIndex(cube.size - j - 1, i)];
                const newFaceMap = getFacesAfterRotation(oldCubie.faces, rotationLayer.axis);
                cubies[getCubieIndex(i, j)] = { startPos: oldCubie.startPos, faces: newFaceMap };
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
    function getCubieIndexInLayerPos(cubeSize: number, i: number, j: number, layer: Layer): number {
        const pos = [i, j];
        pos.splice(layer.axis, 0, layer.layerNum);
        return pos[0] + cubeSize * pos[1] + (cubeSize ** 2) * pos[2]
    }

    // Helper function for generation the interval [0, max)
    const range = (max: number) => Array.from({ length: max }, (_, k) => k);
}