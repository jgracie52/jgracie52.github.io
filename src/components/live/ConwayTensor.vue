<template>
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

      <p>Current backend: {{ backend }}</p>
      <label for="species">Speed (FPS)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="species"
        name="species"
        min="1"
        max="60"
        step="1"
        :value="speed"
        @input="e => updateSpeed(e.target.value)"
      >
      <label for="population" class="block">{{ speed }}</label>

      <label for="species">Resolution (lower value is higher res)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="species"
        name="species"
        min="1"
        max="10"
        :value="resolution"
        @input="e => updateResolution(e.target.value)"
      >
      <label for="population" class="block">{{ resolution }}</label>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';
import * as tf from '@tensorflow/tfjs';

let population;
const width = ref(0);
const height = ref(0);
const resolution = ref(10);
const speed = ref(1);
const backend = ref('');
let interval;

async function playConway() {
  let newPopulation = population.clone().toFloat();
  let kernel = tf.ones([3, 3, 1, 1]);
  let convolvedPopulation = tf.conv2d(newPopulation, kernel, 1, 'same');
  let neighbors = tf.sub(convolvedPopulation, newPopulation);

  let wasAlive = tf.equal(newPopulation, 1);
  let twoLiveNeighbors = tf.equal(neighbors, 2);
  let threeLiveNeighbors = tf.equal(neighbors, 3);
  let finalPop = tf.logicalOr(threeLiveNeighbors, tf.logicalAnd(wasAlive, twoLiveNeighbors));

  population = finalPop.toFloat();

  tf.dispose([newPopulation, kernel, convolvedPopulation, neighbors, wasAlive, twoLiveNeighbors, threeLiveNeighbors, finalPop]);

  tf.browser.toPixels(population, document.getElementById('canvas'));
}

onMounted(() => {
  const wrapper = document.getElementById('wrapper');
  width.value = Math.round(wrapper.clientWidth / resolution.value);
  height.value = Math.round(wrapper.clientHeight / resolution.value);

  let blank = tf.zeros([height.value, width.value]);
  tf.browser.toPixels(blank, document.getElementById('canvas'));

  population = tf.randomUniform([height.value, width.value, 1], 0, 1, tf.int32);
  population = population.round().toInt();
  tf.browser.toPixels(population, document.getElementById('canvas'));

  backend.value = tf.getBackend();

  interval = setInterval(playConway, 1000 / speed.value);
});

function updateResolution(newResolution) {
  resolution.value = newResolution;

  clearInterval(interval);

  const wrapper = document.getElementById('wrapper');
  width.value = Math.round(wrapper.clientWidth / resolution.value);
  height.value = Math.round(wrapper.clientHeight / resolution.value);

  let blank = tf.zeros([height.value, width.value]);
  tf.browser.toPixels(blank, document.getElementById('canvas'));

  population = tf.randomUniform([height.value, width.value, 1], 0, 1, tf.int32);
  population = population.round().toInt();
  tf.browser.toPixels(population, document.getElementById('canvas'));

  interval = setInterval(playConway, 1000 / speed.value);
}

function updateSpeed(newSpeed) {
  speed.value = newSpeed;

  clearInterval(interval);
  interval = setInterval(playConway, 1000 / speed.value);
}
</script>
