# How to represent a rubik's cube in memory
Representing a Rubik's Cube current state is fairly trivial if all you care about is the data representation. What gets difficult is creating a data structure for a Rubiks Cube that:

* Has rotation operations
* Facilitates rendering the cube in 3D and animating the rotations
* Provides useful queries about the structure to make writing solvers easier.

As well, since I am a big fan of the concept of wholemeal programming, it would be nice to generalise this to an n\*n\*n cube

## What does an n\*n\*n cube look like?
Well, regardless of `n`, there are three types of cubies (or cubelets): corners, edge pieces, and center pieces

![Illustration](http://www.speedcubing.com/chris/images/pieces.gif)

As well, every cube has:
* `6` faces comprising of `n*n` cubies (or cubelets).
* `8` corners
* `12*(n-2)` edge pieces
* `6*(n-2)^2` center pieces
* `n^3+(2-n)^3` cubies in total

## What is specifically required to carry out the functionality listed earlier?
### Has rotation operations
* Given a current state, can carry out a rotation of multiple parallel, touching layers of the cube by a multiple of 90 degrees

What this essentially means is that I can choose:
* a face of the cube
* a group of layers on that face which are all touching and are all parallel (there will be `n` vertical layers and `n` horizontal layers)
* a multiple of 90 degrees to rotate all those layers by

And how does a rotation of x degrees work?
* if we treat a layer as a cyclic list of `4*(n-1)` cubies, then a rotation is a cycle of size `n-1`

However, if we store a cyclic list for every layer, then we can't simply cycle one layer since a rotation will affect other layers despite them not being explicitly rotated. So we will need to come up with a better solution...

So what we can do instead is to come up with a data structure I am calling a matrix graph. The idea of a matrix graph is that every node of the graph is a matrix and that every node has 4 undirected edges, one for each side of that node's matrix.

Let's denote names for the 6 faces of a cube, U (up), D (down), L (left), R (right), F (front), and B (back).

The matrix node for F would contain an `n*n` matrix of cubie faces (face colour + reference to cubie instance). Then there would be 4 edges: U (top side), L (left side), R (right side), D (bottom side). Each edge would hold info about the connecting matrix and the side of the matrix it is adjacent to.

We could define a matrix for every side of the cube and the data structure maintaining these is what I am calling a "matrix graph".

This means now that when we want to rotate a layer 90 degrees horizontally, we carry out the following pseudocode

```
// for a given node n, for a layer range [l, r)
node = {n, left} // contains face and entrance. We are entering from the left
// get_layers returns a submatrix containing the rows or columns l to r depending on entrance
// we start off by getting the layers to the left to put into the starting node
prev_layers = get_layers(n.left, l, r) // n.left is a face and entrance like node
loop 4 times:
    // cache this node's layers
    cur_layers = get_layers(node, l, r)
    // update node's layers with previous node's layers
    set_layers(node, l, r, prev_layers)
    // update previous layer cache with what used to be current node's layers
    prev_layers = cur_layers
    // go to the node that was opposite the entrance point (so if we entered the top we'd go down)
    node = get_opposite(node)
```

Now this above code doesn't account for vertical rotations or multiples of 90 degrees, but it can be easily modified to do so.

### Facilitates rendering the cube in 3D and animating the rotations
* The data structure needs to provide information about:
  * Where the cube is in 3D space
  * How the cube is rotated in 3D space
  * Where each of the cubies are in relation to the cube's position
  * What colours each of the cubies are and on which faces of the cubie
  * The rotation axes for each face

The first 4 can be achieved simply by having a translation and rotation matrix for the entire cube and a translation matrix and rotation matrix for each cubie relative to the cube center.

Then when it comes to rendering an individual cubie we translate and rotate the entire cube, then for every cubie apply the translation and rotation.

For the 5th point we know that rotations can only occur around one of 6 axes, and those axes will never change relative to the center of the cube. So we can cache them and reuse everywhere.

Whenever the cube is updated, we update the cube's translation/rotation matrix, and whenever we rotate a side we update the translation/rotation matrix of each cubie affected by the rotation.

### Provides useful queries about the structure to make writing solvers easier
* The cube should provide some way to see if the current cube state fits a specific pattern

For my purposes, I am not writing a 100% optimal solver, I am just going to be writing a solver which applies the layer-by-layer beginners method. However, to do this the solver needs an easy way to determine how far into the solution process it is.

I'm thinking that in this case, a pattern is a set of `6` `n*n` arrays of "face match constants". A face match constant can either be a colour (W, B, O, G, R, Y), a generic match (1, 2, 3, 4, 5, 6), or any (*). when using a generic match, any item in any of the arrays that share the same generic match number must be the same colour. Also, two items of different match constants can't be the same colour.

The return of this function will be which side the first array item matched to and which way the cube is rotated (0, 90, 180, or 270)

If we wanted to write a pattern which checked that one layer of a `2x2x2` cube had one layer solved, then it could be

```
[1, 1, 1, 1], [*, *, 2, 2], [3, *, 3, *], [*, 4, *, 4], [5, 5, *, *], [*, *, *, *]
A           , A.up        , A.right     , A.left      , A.down      , A.down.down
```

and the return would be which side `A` was and what the rotation is