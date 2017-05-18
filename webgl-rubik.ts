/** This namespace's purpose is to wrap the Rubik Cubie and Cube classes to also handle rendering. */
namespace WebGLRubik {
     // I wanted to write my own vector and matrix classes rather than use a library for learning purposes.
     // Their intention is not to be super-fast or optimised. They also don't mutate themselves

    class Matrix {
        public readonly rows: number;
        public readonly cols: number;

        constructor(public elements: number[][]) {
            this.rows = elements.length;
            this.cols = this.rows === 0 ? 0 : elements[0].length;
        }

        public add(other: Matrix): Matrix {
            if (this.cols !== other.cols || this.rows !== other.rows) {
                throw Error(`Couldn't perform the matrix addition as the dimensions did not match`);
            }
            const newMatrixElements: number[][] = [];
            for (let i = 0; i < this.rows; i++) {
                const newRowElems: number[] = [];
                for (let j = 0; j < other.cols; j++) {
                    newRowElems.push(this.elements[i][j] + other.elements[i][j]);
                }
                newMatrixElements.push(newRowElems);
            }
            return new Matrix(newMatrixElements);
        }

        public mul(other: Matrix): Matrix {
            if (this.cols !== other.rows) {
                throw Error(`Couldn't perform the matrix multiplication as the dimensions did not match`);
            }
            const newMatrixElements: number[][] = [];
            for (let i = 0; i < this.rows; i++) {
                const newRowElems: number[] = [];
                for (let j = 0; j < other.cols; j++) {
                    let sum = 0;
                    for (let k = 0; k < this.cols; k++) {
                        sum += this.elements[i][k] * other.elements[k][j];
                    }
                    newRowElems.push(sum);
                }
                newMatrixElements.push(newRowElems);
            }
            return new Matrix(newMatrixElements);
        }
    }

    class Vector extends Matrix {
        public readonly dimensions: number;
        public readonly length: number;

        constructor(elements: number[]) {
            const matrixElements: number[][] = [];
            elements.forEach(elem => matrixElements.push([elem]));
            super(matrixElements);
            this.dimensions = elements.length;
            this.length = Math.sqrt(this.dot(this));
        }

        public getElem(index: number) {
            return this.elements[index][0];
        }

        public static Zero(dims: number): Vector {
            return new Vector(new Array(dims).fill(0));
        }

        public add(other: Vector): Vector {
            if (this.dimensions !== other.dimensions) {
                throw Error(`Couldn't perform the dot product as the dimensions were not the same`);
            }
            let newElems: number[] = [];
            for (let i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) + other.getElem(i));
            }
            return new Vector(newElems);
        }

        public scale(k: number): Vector {
            let newElems: number[] = [];
            for (let i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) * k);
            }
            return new Vector(newElems);
        }

        public dot(other: Vector): number {
            if (this.dimensions !== other.dimensions) {
                throw Error(`Couldn't perform the dot product as the dimensions were not the same`);
            }
            let total = 0;
            for (let i = 0; i < this.dimensions; i++) {
                total += this.getElem(i) * other.getElem(i);
            }
            return total;
        }
    }
}