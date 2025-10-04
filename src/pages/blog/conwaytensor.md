---
layout: "../../layouts/PostLayout.astro"
title: "Conway's Game of Life in Tensorflow"
description: "A reimplementation of Conway's Game of Life with TensorFlowJS."
pubDate: "March 6 2024"
heroImage: "/conwaytensor.png"
tags: [ "cellular automata", "live demo" ]
categories: [ "Cellular Automata", "Machine Learning" ]
badge: "Demo"
---

In my previous post, I implemented Conway's Game of Life using JavaScript and Svelte. In that implementation, I used a 2D array to store the state of each cell and updated the state of each cell based on the state of its neighbors. Using that array, I was able to update an HTML table to display the state of each cell.

While that implementation certainly worked, it would not be very efficient for larger grids. In this post, I will be reimplementing Conway's Game of Life using TensorFlowJS. This will allow me to use the GPU to perform the calculations, which should be much faster than using a 2D array and updating an HTML table.

## The Grid

In order to implement Conway's Game of Life, we need to set up a grid to represent the state of each cell. In TensorFlowJS, we can use a 2D tensor to represent the grid, with an extra 3rd dimension to represent pixel values. Each cell will be represented by a 1 or 0, where 1 represents a live cell and 0 represents a dead cell.

```javascript

population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
population = population.round();

```

The above code creates a population tensor using `tf.randomUniform`. This function creates a tensor with the specified shape and fills it with random values between 0 and 1. We then round the values to the nearest integer. This gives us a grid of cells where each cell is either alive or dead.

## The Rules

Once we have a grid to represent the state of each cell, we need to implement the rules of Conway's Game of Life. In TensorFlowJS, we can use the `conv2d` function to calculate the number of live neighbors for each cell. We can then use cascading logical operations to apply the rules to each cell.

```javascript

// Create a kernel for convolution
let kernel = tf.ones([3, 3, 1, 1]);

// Perform the convolution
let convolvedPopulation = tf.conv2d(population, kernel, 1, 'same');

let neighbors = tf.sub(convolvedPopulation, population);

```

The above code creates a kernel for convolution using `tf.ones`. This kernel will be used to calculate the number of live neighbors for each cell. You'll notice that the kernel is a 4D tensor of size 3x3x1x1. The 3x3 size is defining the actual size of the kernel, while the last two dimensions are for input channel and output channel. 1x1 means we only have 1 input and 1 output channel corresponding to the pixel value.

With the kernel, we can then use the `conv2d` function to perform the convolution and subtract the original population tensor from the result. This gives us a tensor where each cell represents the number of live neighbors for the corresponding cell in the original population tensor.

We can then use cascading logical operations to apply the rules of Conway's Game of Life to each cell.

```javascript

// Check if a cell was alive in the previous generation
let wasAlive = tf.equal(newPopulation, 1);

// Check if a cell has two live neighbors
let twoLiveNeighbors = tf.equal(neighbors, 2);

// Check if a cell has three live neighbors
let threeLiveNeighbors = tf.equal(neighbors, 3);

// Apply the rules of Conway's Game of Life
let finalPop = tf.logicalOr(threeLiveNeighbors, tf.logicalAnd(wasAlive, twoLiveNeighbors));

```

The above code uses the `tf.equal` function to check if a cell was alive in the previous generation, and if a cell has two or three live neighbors. We then use the `tf.logicalOr` and `tf.logicalAnd` functions to apply the rules of Conway's Game of Life to each cell.

## Rendering the Grid

Once we have applied the rules of Conway's Game of Life to each cell, we can render the grid to the screen. In TensorFlowJS, we can use the `tf.browser.toPixels` function to convert the population tensor to an image and display it on the screen.

```javascript

// Render the population tensor to the canvas
tf.browser.toPixels(finalPop.toFloat(), document.getElementById('canvas'));

```

---

__**Note:**__ Pay special care with the width, and height of the grid. Because the calculations are performed on the GPU, the grid can be much larger and the calculations can be performed much faster than in the previous implementation. However, the speed of the grid will depend on the capabilities of the GPU. If you are using a device with a less powerful GPU, you may need to reduce the size of the grid to maintain a reasonable frame rate.

---

## Conclusion

In this post, I reimplemented Conway's Game of Life using TensorFlowJS. This allowed me to use the GPU to perform the calculations, which should be much faster than using a 2D array and updating an HTML table. This implementation should be much more efficient for larger grids, and it should be able to maintain a reasonable frame rate even on less powerful devices.

You can see a live demo of this implementation <a href='joshgracie.com/demos/conwaytensordemo'>here</a>. The game will start with a random grid, and you can adjust the speed and 'resolution' (pop size) of the grid.

## References

- [TensorFlowJS](https://www.tensorflow.org/js)
- [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
- [Live Demo](https://joshgracie.com/demos/conwaytensordemo)
- [ConwayLife](https://github.com/nrudakov/ConwayLife/blob/master/ConwayLife.py): Code was partially inspired by this implementation from nrudakov.