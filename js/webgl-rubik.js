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
        add(other) {
            if (this.cols !== other.cols || this.rows !== other.rows) {
                throw Error(`Couldn't perform the matrix addition as the dimensions did not match`);
            }
            const newMatrixElements = [];
            for (let i = 0; i < this.rows; i++) {
                const newRowElems = [];
                for (let j = 0; j < other.cols; j++) {
                    newRowElems.push(this.elements[i][j] + other.elements[i][j]);
                }
                newMatrixElements.push(newRowElems);
            }
            return new Matrix(newMatrixElements);
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
        constructor(elements) {
            const matrixElements = [];
            elements.forEach(elem => matrixElements.push([elem]));
            super(matrixElements);
            this.dimensions = elements.length;
            this.length = Math.sqrt(this.dot(this));
        }
        getElem(index) {
            return this.elements[index][0];
        }
        static Zero(dims) {
            return new Vector(new Array(dims).fill(0));
        }
        add(other) {
            if (this.dimensions !== other.dimensions) {
                throw Error(`Couldn't perform the dot product as the dimensions were not the same`);
            }
            let newElems = [];
            for (let i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) + other.getElem(i));
            }
            return new Vector(newElems);
        }
        scale(k) {
            let newElems = [];
            for (let i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) * k);
            }
            return new Vector(newElems);
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