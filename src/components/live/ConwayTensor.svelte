<script>
    // Code for this is adapted from the following source:
    // nrudakov - ConwayLife - https://github.com/nrudakov/ConwayLife/blob/master/ConwayLife.py

    import { onMount } from 'svelte';
    import FormSideBar from './FormSideBar.svelte';
    // Importing the tensorflow.js library
    import * as tf from "@tensorflow/tfjs"

    let population;
    let width = 0;
    let height = 0;
    let resolution = 10;
    let speed = 1;
    let backend;
    let interval;


    async function playConway(){
        // This function runs the game of life simulation
        // It takes the current population tensor and returns the next generation

        // Create a copy of the population tensor
        let newPopulation = population.clone().toFloat();

        // Create a kernel for convolution
        let kernel = tf.ones([3, 3, 1, 1]);

        // Perform the convolution
        let convolvedPopulation = tf.conv2d(newPopulation, kernel, 1, 'same');

        let neighbors = tf.sub(convolvedPopulation, newPopulation);

        // Apply the rules of the game of life
        // If a cell has 3 neighbors, it becomes alive
        // If a cell has 2 neighbors, it stays the same
        // If a cell has less than 2 or more than 3 neighbors, it dies

        let wasAlive = tf.equal(newPopulation, 1);
        let twoLiveNeighbors = tf.equal(neighbors, 2);
        let threeLiveNeighbors = tf.equal(neighbors, 3);
        let finalPop = tf.logicalOr(threeLiveNeighbors, tf.logicalAnd(wasAlive, twoLiveNeighbors));

        // Update the population tensor
        population = finalPop.toFloat();

        // Dispose of the temporary tensors
        tf.dispose([newPopulation, kernel, convolvedPopulation, neighbors, wasAlive, twoLiveNeighbors, threeLiveNeighbors, finalPop]);

        // Render the population tensor to the canvas
        tf.browser.toPixels(population, document.getElementById('canvas'));
    }

    // On mount, initialize the canvas
    onMount(() => {
        // Get the size of the wrapper element
        const wrapper = document.getElementById('wrapper');
        width = Math.round(wrapper.clientWidth / resolution);
        height = Math.round(wrapper.clientHeight / resolution);

        let blank = tf.zeros([height, width]);
        tf.browser.toPixels(blank, document.getElementById('canvas'));

        // Setup the population tensor
        // This represents the population of cells in the game of life
        // All cells are initialized to 0
        population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
        population = population.round().toInt();
        tf.browser.toPixels(population, document.getElementById('canvas'));

        backend = tf.getBackend();

        // Run the game of life simulation
        interval = setInterval(playConway, 1000 / speed);
    });

    function updateResolution(newResolution){
        // This function updates the resolution of the canvas
        // It also updates the population tensor to match the new resolution

        resolution = newResolution;

        clearInterval(interval);

        const wrapper = document.getElementById('wrapper');
        width = Math.round(wrapper.clientWidth / resolution);
        height = Math.round(wrapper.clientHeight / resolution);

        let blank = tf.zeros([height, width]);
        tf.browser.toPixels(blank, document.getElementById('canvas'));

        population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
        population = population.round().toInt();
        tf.browser.toPixels(population, document.getElementById('canvas'));

        interval = setInterval(playConway, 1000 / speed);
    }

    function updateSpeed(newSpeed){
        // This function updates the speed of the game of life simulation
        // It changes the interval at which the simulation is run

        speed = newSpeed;

        clearInterval(interval);
        interval = setInterval(playConway, 1000 / speed);
    }
</script>

<div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
        <div style="position:relative" class="w-full h-full" id="wrapper">
            <canvas id="canvas" style="image-rendering: pixelated;" class="rounded-md h-full w-full"></canvas>
        </div>
    </div>
    <FormSideBar>
        <article class="prose mb-4">
            <h2>Instructions</h2>
            <p>This is a simple implementation of Conway's Game of Life using TensorFlow.js</p>
            <p>The game is controlled using a simple 2D convolution to sum the living neighbors and then tensor math to set the state of the new population.</p>
            <p>Use the sliders to control the speed (FPS) and resolution (size of the population) of the simulation.</p>
            <p>NOTE: Set your resolution and speed carefully. If your backend is not WebGL or if you do not have a powerful GPU, high speed and a lower resolution value will result in long compute time and possible crashing.</p>
        </article>

        <p>Current backend: {backend}</p>
        <label for="species">Speed (FPS)</label>
        <input class="range range-xs range-primary" type="range" id="species" name="species" min="1" max="60" step="1" value={speed} on:input={e => updateSpeed(e.target.value)}>
        <label for="population" class="block">{speed}</label>

        <label for="species">Resolution (lower value is higher res)</label>
        <input class="range range-xs range-primary" type="range" id="species" name="species" min="1" max="10" value={resolution} on:input={e => updateResolution(e.target.value)}>
        <label for="population" class="block">{resolution}</label>
    </FormSideBar>
</div>