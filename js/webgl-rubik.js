"use strict";
/** This namespace's purpose is to wrap the Rubik Cubie and Cube classes to also handle rendering. */
var WebGLRubik;
(function (WebGLRubik) {
    // I wanted to write my own vector and matrix classes rather than use a library for learning purposes.
    // Their intention is not to be super-fast or optimised. They also don't mutate themselves
    class Matrix {
        constructor(elements) {
            this.elements = elements;
            this.rows = elements.length;
            this.cols = this.rows === 0 ? 0 : elements[0].length;
        }
        mul(other) {
            if (this.cols !== other.rows) {
                throw Error(`Couldn't perform the matrix multiplication as the dimensions did not match`);
            }
            const newMatrixElements = [];
            for (let i = 0; i < this.rows; i++) {
                const newRowElems = [];
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
        constructor(elements, isColumnVector) {
            const matrixElements = [];
            if (isColumnVector) {
                elements.forEach(elem => matrixElements.push([elem]));
            }
            else {
                matrixElements.push(elements);
            }
            super(matrixElements);
            this.dimensions = elements.length;
            this.isColumnVector = isColumnVector;
            this.length = Math.sqrt(this.dot(this));
        }
        getElem(index) {
            if (this.isColumnVector) {
                return this.elements[index][0];
            }
            else {
                return this.elements[0][index];
            }
        }
        dot(other) {
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
    class WebGLCubie extends Rubik.Cubie {
    }
    class WebGLCube extends Rubik.Cube {
    }
})(WebGLRubik || (WebGLRubik = {}));
//# sourceMappingURL=webgl-rubik.js.map