"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/** This namespace's purpose is to wrap the Rubik Cubie and Cube classes to also handle rendering. */
var WebGLRubik;
(function (WebGLRubik) {
    // I wanted to write my own vector and matrix classes rather than use a library for learning purposes.
    // Their intention is not to be super-fast or optimised. They also don't mutate themselves
    var Matrix = (function () {
        function Matrix(elements) {
            this.elements = elements;
            this.rows = elements.length;
            this.cols = this.rows === 0 ? 0 : elements[0].length;
        }
        Matrix.prototype.add = function (other) {
            if (this.cols !== other.cols || this.rows !== other.rows) {
                throw Error("Couldn't perform the matrix addition as the dimensions did not match");
            }
            var newMatrixElements = [];
            for (var i = 0; i < this.rows; i++) {
                var newRowElems = [];
                for (var j = 0; j < other.cols; j++) {
                    newRowElems.push(this.elements[i][j] + other.elements[i][j]);
                }
                newMatrixElements.push(newRowElems);
            }
            return new Matrix(newMatrixElements);
        };
        Matrix.prototype.mul = function (other) {
            if (this.cols !== other.rows) {
                throw Error("Couldn't perform the matrix multiplication as the dimensions did not match");
            }
            var newMatrixElements = [];
            for (var i = 0; i < this.rows; i++) {
                var newRowElems = [];
                for (var j = 0; j < other.cols; j++) {
                    var sum = 0;
                    for (var k = 0; k < this.cols; k++) {
                        sum += this.elements[i][k] * other.elements[k][j];
                    }
                    newRowElems.push(sum);
                }
                newMatrixElements.push(newRowElems);
            }
            return new Matrix(newMatrixElements);
        };
        return Matrix;
    }());
    var Vector = (function (_super) {
        __extends(Vector, _super);
        function Vector(elements) {
            var _this = this;
            var matrixElements = [];
            elements.forEach(function (elem) { return matrixElements.push([elem]); });
            _this = _super.call(this, matrixElements) || this;
            _this.dimensions = elements.length;
            _this.length = Math.sqrt(_this.dot(_this));
            return _this;
        }
        Vector.prototype.getElem = function (index) {
            return this.elements[index][0];
        };
        Vector.Zero = function (dims) {
            return new Vector(new Array(dims).fill(0));
        };
        Vector.prototype.add = function (other) {
            if (this.dimensions !== other.dimensions) {
                throw Error("Couldn't perform the dot product as the dimensions were not the same");
            }
            var newElems = [];
            for (var i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) + other.getElem(i));
            }
            return new Vector(newElems);
        };
        Vector.prototype.scale = function (k) {
            var newElems = [];
            for (var i = 0; i < this.dimensions; i++) {
                newElems.push(this.getElem(i) * k);
            }
            return new Vector(newElems);
        };
        Vector.prototype.dot = function (other) {
            if (this.dimensions !== other.dimensions) {
                throw Error("Couldn't perform the dot product as the dimensions were not the same");
            }
            var total = 0;
            for (var i = 0; i < this.dimensions; i++) {
                total += this.getElem(i) * other.getElem(i);
            }
            return total;
        };
        return Vector;
    }(Matrix));
    var WebGLCubie = (function (_super) {
        __extends(WebGLCubie, _super);
        function WebGLCubie() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return WebGLCubie;
    }(Rubik.Cubie));
    var WebGLCube = (function (_super) {
        __extends(WebGLCube, _super);
        function WebGLCube() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return WebGLCube;
    }(Rubik.Cube));
})(WebGLRubik || (WebGLRubik = {}));
//# sourceMappingURL=webgl-rubik.js.map