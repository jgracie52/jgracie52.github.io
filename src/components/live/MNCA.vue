<template>
  <div class="flex flex-column w-full h-full" @mousedown="beginDrag" @mouseup="endDrag">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
      <div style="position:relative" class="w-full h-full" id="wrapper">
        <canvas id="canvas" style="image-rendering: pixelated; cursor:pointer;" class="rounded-md h-full w-full"></canvas>
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

      <label for="species">Zoom (lower value to zoom out)</label>
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

      <label for="preset">Presets</label>
      <select
        class="select select-bordered select-sm w-full mb-4"
        id="preset"
        name="preset"
        @input="e => setPreset(e.target.value)"
      >
        <option value="0">Select a preset</option>
        <option value="1" selected>Ciliates</option>
        <option value="3">Conway</option>
        <option value="4">Bugs</option>
        <option value="5">Waves</option>
        <option value="6">Lenia</option>
        <option value="7">Coral</option>
        <option value="8">Mitosis</option>
      </select>

      <div v-for="neighborhood in neighborhoods" :key="neighborhood.id" class="card w-full bg-base-100 shadow-xl mb-2">
        <div class="card-body">
          <canvas
            :id="'nhCanvas-' + neighborhood.id"
            style="image-rendering: pixelated; cursor:pointer;"
            class="rounded-md w-full"
            @click="viewNeighborhood(neighborhood.id)"
          ></canvas>
          <div v-for="rule in neighborhood.nhRules" :key="rule.id" class="collapse collapse-arrow border-collapse bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title">
              <h6>Rule {{ rule.order }}</h6>
            </div>
            <div class="collapse-content">
              <div class="w-full">
                <div class="w-full">
                  <label for="lower">Lower Threshold</label>
                </div>
                <div class="w-full">
                  <input type="number" v-model="rule.lower" class="input w-full input-sm input-bordered join-item" placeholder="0.5" />
                </div>
              </div>
              <div class="w-full">
                <div class="w-full">
                  <label for="upper">Upper Threshold</label>
                </div>
                <div class="w-full">
                  <input type="number" v-model="rule.upper" class="input w-full input-sm input-bordered join-item" placeholder="0.5" />
                </div>
              </div>
              <div class="w-full">
                <div class="w-full">
                  <label for="alive">Alive</label>
                </div>
                <select v-model="rule.alive" class="select select-bordered select-sm w-full">
                  <option :value="true" selected>A</option>
                  <option :value="false">D</option>
                </select>
              </div>
              <div class="w-full">
                <div class="w-full">
                  <label for="alive">Order</label>
                </div>
                <select v-model="rule.order" class="select select-bordered select-sm w-full">
                  <option v-for="(_, i) in neighborhoodsOrderArray()" :key="i" :value="i" selected>{{ i }}</option>
                </select>
              </div>
              <button class="btn btn-error btn-sm w-full mt-2" @click="removeRule(neighborhood, rule.id)">Delete Rule</button>
            </div>
          </div>
          <button class="btn btn-primary btn-sm w-full mt-2" @click="addRule(neighborhood)">Add Rule</button>
          <button class="btn btn-error btn-sm w-full mt-2" @click="removeNeighborhood(neighborhood.id)">Delete Neighborhood</button>
        </div>
      </div>

      <button class="btn btn-primary btn-sm w-full mb-2 mt-2" @click="addNeighborhood">Add Neighborhood</button>
    </FormSideBar>

    <dialog id="nh_modal" class="modal">
      <div class="modal-box" style="width: 360px;">
        <table class="table" width="340" height="340">
          <tbody>
            <tr v-if="selectedNeighborhoodArray.length > 0" v-for="i in 17" :key="i">
              <td
                v-for="j in 17"
                :key="j"
                :id="`con-${i-1}-${j-1}`"
                :class="[
                  (i === 9 && j === 9) ? 'alive' : (selectedNeighborhoodArray[i-1][j-1] == 1.0 ? 'alive' : 'dead'),
                  (i !== 9 || j !== 9) ? 'clickable' : ''
                ]"
                :style="'width: 20px; height: 20px; padding:0px' + ((i === 9 && j === 9) ? '; text-align:center; font-color:black; font-weight:bold;' : '')"
                @mousedown="(i !== 9 || j !== 9) && mouseHandler(i-1, j-1)($event)"
                @mouseenter="(i !== 9 || j !== 9) && mouseHandler(i-1, j-1)($event)"
              >
                {{ (i === 9 && j === 9) ? '0' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from 'vue';
import FormSideBar from './FormSideBar.vue';
import { v4 as uuid } from 'uuid';
import * as tf from '@tensorflow/tfjs';

class NhRule {
  constructor(lower, upper, alive, order = 0) {
    this.upper = upper;
    this.lower = lower;
    this.alive = alive;
    this.id = uuid();
    this.order = order;
  }
}

class Neighborhood {
  constructor(neighborhoodsOrderArrayFn) {
    this.nhRules = [new NhRule(0.5, 0.5, true, neighborhoodsOrderArrayFn().length)];
    let nhArray = Array.from({ length: 17 }, () => Array.from({ length: 17 }, () => 0));
    nhArray[8][8] = 1;
    this.nhTensor = tf.tensor(nhArray).expandDims(2).expandDims(3);
    this.id = uuid();
  }
}

let population;
const width = ref(0);
const height = ref(0);
const resolution = ref(10);
const speed = ref(1);
const backend = ref('');
let interval;
const innerWidth = ref(0);
const neighborhoods = shallowRef([]);

const neighborhoodsOrderArray = () => {
  let arr = [];
  if (neighborhoods.value.length === 0) return arr;
  for (let i = 0; i < neighborhoods.value.length; i++) {
    for (let j = 0; j < neighborhoods.value[i].nhRules.length; j++) {
      arr.push((i + 1) * j);
    }
  }
  return arr;
};

// Large preset data arrays
const mncaStarter1 = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0],[0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0],[0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0],[0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0],[0,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,0],[0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0],[0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0],[0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0],[0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaStart1Rules = [new NhRule(0.21, 0.22, true, 0), new NhRule(0.35, 0.5, false, 1), new NhRule(0.75, 0.85, false, 2), new NhRule(0.12, 0.15, false, 5)];

const mncaStarter2 = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaStart2Rules = [new NhRule(0.1, 0.28, false, 3), new NhRule(0.43, 0.55, true, 4)];

const mncaConway = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaConwayRules = [new NhRule(0.0, 0.22, false, 0), new NhRule(0.33, 0.34, true, 1), new NhRule(0.341, 1.0, false, 2)];

const mncaBugs = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaBugsRules = [new NhRule(0.0, 0.2727, false, 0), new NhRule(0.273, 0.3719, true, 1), new NhRule(0.479, 1.0, false, 2)];

// Waves - Creates expanding circular patterns
const mncaWaves = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaWavesRules = [new NhRule(0.15, 0.3, true, 0), new NhRule(0.4, 0.65, false, 1)];

// Lenia-like smooth growth
const mncaLenia = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaLeniaRules = [new NhRule(0.17, 0.25, true, 0), new NhRule(0.32, 0.42, true, 1), new NhRule(0.55, 1.0, false, 2)];

// Coral growth pattern
const mncaCoral = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaCoralRules = [new NhRule(0.25, 0.35, true, 0), new NhRule(0.45, 0.58, false, 1), new NhRule(0.7, 1.0, false, 2)];

// Mitosis - cell splitting behavior
const mncaMitosis = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const mncaMitosisRules = [new NhRule(0.19, 0.28, true, 0), new NhRule(0.38, 0.48, false, 1), new NhRule(0.52, 0.62, true, 2)];

const selectedNeighborhoodArray = ref([]);
const selectedNeighborhoodID = ref(null);
const isDrag = ref(false);
const isDragCanvas = ref(false);
const canvasCurrentMouseX = ref(0);
const canvasCurrentMouseY = ref(0);

const beginDrag = () => {
  isDrag.value = true;
}

const endDrag = () => {
  isDrag.value = false;
}

const mouseHandler = (r, c) => (e) => {
  if (isDrag.value || e.type === 'mousedown') {
    handleNeighborhoodUpdate(r, c);
  }
}

async function playMNCA() {
  let newPop = tf.tidy(() => {
    let newPopulation = population.clone().toFloat();
    let wasAlive = tf.equal(newPopulation, 1);

    let calculatedRules = Array(neighborhoodsOrderArray().length);
    for (let nh of neighborhoods.value) {
      let nhTensorArray = nh.nhTensor.arraySync();
      nhTensorArray[8][8] = 0;
      let nhTensor = tf.tensor(nhTensorArray);

      let convolvedPopulation = tf.conv2d(newPopulation, nhTensor, 1, 'same');
      let neighbors = tf.sub(convolvedPopulation, newPopulation);

      let nhSum = tf.sum(nh.nhTensor);
      let neighborsAvg = tf.div(neighbors, nhSum);

      for (let nhRule of nh.nhRules) {
        let upperRule = tf.lessEqual(neighborsAvg, nhRule.upper);
        let lowerRule = tf.greaterEqual(neighborsAvg, nhRule.lower);
        let rulePop = tf.logicalAnd(upperRule, lowerRule);

        if (!nhRule.alive) {
          let invertRulePop = tf.logicalNot(rulePop);
          rulePop = invertRulePop;
        }

        calculatedRules[nhRule.order] = { pop: rulePop, alive: nhRule.alive };
      }
    }

    let finalPop = wasAlive;
    for (let rule of calculatedRules) {
      if (rule === undefined) continue;

      if (rule.alive) {
        let finalPopOr = tf.logicalOr(finalPop, rule.pop);
        finalPop = finalPopOr;
      } else {
        let finalPopAnd = tf.logicalAnd(finalPop, rule.pop);
        finalPop = finalPopAnd;
      }
    }

    newPopulation = finalPop.toFloat();

    if (isDragCanvas.value) {
      let x = Math.floor(canvasCurrentMouseX.value / resolution.value);
      let y = Math.floor(canvasCurrentMouseY.value / resolution.value);

      let popArray = population.arraySync();

      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          if (x + i >= 0 && x + i < width.value && y + j >= 0 && y + j < height.value) {
            popArray[y + j][x + i] = 1;
          }
        }
      }

      newPopulation = tf.tensor(popArray);
    }

    return newPopulation;
  });

  population.dispose();
  population = newPop;

  tf.browser.toPixels(population, document.getElementById('canvas'));
}

onMounted(async () => {
  await tf.ready();

  const wrapper = document.getElementById('wrapper');
  width.value = Math.round(wrapper.clientWidth / resolution.value);
  height.value = Math.round(wrapper.clientHeight / resolution.value);

  let blank = tf.zeros([height.value, width.value]);
  tf.browser.toPixels(blank, document.getElementById('canvas'));
  tf.dispose(blank);

  population = tf.randomUniform([height.value, width.value, 1], 0, 1, tf.int32);
  population = population.round().toInt();
  tf.browser.toPixels(population, document.getElementById('canvas'));

  backend.value = tf.getBackend();

  // Set preset AFTER backend is initialized
  setPreset(1);

  document.getElementById('canvas').addEventListener('mousedown', (e) => onDragCanvas(e));

  interval = setInterval(playMNCA, 1000 / speed.value);
});

function onDragCanvas(e) {
  isDragCanvas.value = true;

  document.addEventListener('mousemove', onDragCanvasMove);
  document.addEventListener('mouseup', onDragCanvasEnd);
}

function onDragCanvasMove(e) {
  if (isDragCanvas.value) {
    let canvas = document.getElementById('canvas');
    let rect = canvas.getBoundingClientRect();

    canvasCurrentMouseX.value = e.clientX - rect.left;
    canvasCurrentMouseY.value = e.clientY - rect.top;
  }
}

function onDragCanvasEnd(e) {
  isDragCanvas.value = false;

  document.removeEventListener('mousemove', onDragCanvasMove);
  document.removeEventListener('mouseup', onDragCanvasEnd);
}

function updateResolution(newResolution) {
  resolution.value = newResolution;

  clearInterval(interval);

  const wrapper = document.getElementById('wrapper');
  width.value = Math.round(wrapper.clientWidth / resolution.value);
  height.value = Math.round(wrapper.clientHeight / resolution.value);

  let blank = tf.zeros([height.value, width.value]);
  tf.browser.toPixels(blank, document.getElementById('canvas'));
  blank.dispose();

  population.dispose();
  population = tf.randomUniform([height.value, width.value, 1], 0, 1, tf.int32);
  population = population.round().toInt();
  tf.browser.toPixels(population, document.getElementById('canvas'));

  interval = setInterval(playMNCA, 1000 / speed.value);
}

function updateSpeed(newSpeed) {
  speed.value = newSpeed;

  clearInterval(interval);
  interval = setInterval(playMNCA, 1000 / speed.value);
}

function addNeighborhood() {
  clearInterval(interval);

  neighborhoods.value.push(new Neighborhood(neighborhoodsOrderArray));
  neighborhoods.value = [...neighborhoods.value];

  setTimeout(() => {
    renderNeighborhood(neighborhoods.value[neighborhoods.value.length - 1]);
  }, 500);

  interval = setInterval(playMNCA, 1000 / speed.value);
}

function removeNeighborhood(id) {
  clearInterval(interval);

  neighborhoods.value = neighborhoods.value.filter(nh => nh.id !== id);

  interval = setInterval(playMNCA, 1000 / speed.value);
}

function renderNeighborhood(neighborhood) {
  tf.browser.toPixels(neighborhood.nhTensor.squeeze(), document.getElementById('nhCanvas-' + neighborhood.id));
}

function viewNeighborhood(id) {
  document.getElementById('nh_modal').showModal();

  let neighborhood = neighborhoods.value.find(nh => nh.id === id);
  selectedNeighborhoodID.value = id;

  selectedNeighborhoodArray.value = Array.from(neighborhood.nhTensor.squeeze().squeeze().dataSync());
  let newArr = [];
  while (selectedNeighborhoodArray.value.length) newArr.push(selectedNeighborhoodArray.value.splice(0, 17));
  selectedNeighborhoodArray.value = newArr;
}

function handleNeighborhoodUpdate(i, j) {
  clearInterval(interval);

  selectedNeighborhoodArray.value[i][j] = selectedNeighborhoodArray.value[i][j] == 1.0 ? 0.0 : 1.0;

  let newTensor = tf.tensor(selectedNeighborhoodArray.value).expandDims(2).expandDims(3);
  let neighborhood = neighborhoods.value.find(nh => nh.id === selectedNeighborhoodID.value);
  neighborhood.nhTensor = newTensor;

  renderNeighborhood(neighborhood);
  interval = setInterval(playMNCA, 1000 / speed.value);
}

function addRule(neighborhood) {
  clearInterval(interval);

  neighborhood.nhRules.push(new NhRule(0.5, 0.5, true));
  neighborhood.nhRules = [...neighborhood.nhRules];
  neighborhoods.value = [...neighborhoods.value];

  interval = setInterval(playMNCA, 1000 / speed.value);
}

function removeRule(neighborhood, ruleID) {
  clearInterval(interval);

  if (neighborhood.nhRules.length === 1) {
    alert("You must have at least one rule in the neighborhood");
    return;
  }

  neighborhood.nhRules = neighborhood.nhRules.filter(rule => rule.id !== ruleID);
  neighborhood.nhRules = [...neighborhood.nhRules];
  neighborhoods.value = [...neighborhoods.value];

  interval = setInterval(playMNCA, 1000 / speed.value);
}

function setPreset(presetOption) {
  clearInterval(interval);

  presetOption = parseInt(presetOption);

  switch (presetOption) {
    case 1:
      let nh1 = new Neighborhood(neighborhoodsOrderArray);
      nh1.nhTensor = tf.tensor(mncaStarter1).expandDims(2).expandDims(3);
      nh1.nhRules = mncaStart1Rules;

      let nh2 = new Neighborhood(neighborhoodsOrderArray);
      nh2.nhTensor = tf.tensor(mncaStarter2).expandDims(2).expandDims(3);
      nh2.nhRules = mncaStart2Rules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh1);
      neighborhoods.value.push(nh2);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
        renderNeighborhood(neighborhoods.value[1]);
      }, 2000);
      break;
    case 2:
      neighborhoods.value = [];
      break;
    case 3:
      let nh3 = new Neighborhood(neighborhoodsOrderArray);
      nh3.nhTensor = tf.tensor(mncaConway).expandDims(2).expandDims(3);
      nh3.nhRules = mncaConwayRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh3);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    case 4:
      let nh4 = new Neighborhood(neighborhoodsOrderArray);
      nh4.nhTensor = tf.tensor(mncaBugs).expandDims(2).expandDims(3);
      nh4.nhRules = mncaBugsRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh4);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    case 5:
      let nh5 = new Neighborhood(neighborhoodsOrderArray);
      nh5.nhTensor = tf.tensor(mncaWaves).expandDims(2).expandDims(3);
      nh5.nhRules = mncaWavesRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh5);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    case 6:
      let nh6 = new Neighborhood(neighborhoodsOrderArray);
      nh6.nhTensor = tf.tensor(mncaLenia).expandDims(2).expandDims(3);
      nh6.nhRules = mncaLeniaRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh6);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    case 7:
      let nh7 = new Neighborhood(neighborhoodsOrderArray);
      nh7.nhTensor = tf.tensor(mncaCoral).expandDims(2).expandDims(3);
      nh7.nhRules = mncaCoralRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh7);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    case 8:
      let nh8 = new Neighborhood(neighborhoodsOrderArray);
      nh8.nhTensor = tf.tensor(mncaMitosis).expandDims(2).expandDims(3);
      nh8.nhRules = mncaMitosisRules;

      neighborhoods.value = [];
      neighborhoods.value.push(nh8);

      setTimeout(() => {
        renderNeighborhood(neighborhoods.value[0]);
      }, 2000);
      break;
    default:
      neighborhoods.value = [];
      break;
  }

  population = tf.randomUniform([height.value, width.value, 1], 0, 1, tf.int32);
  population = population.round().toInt();
  tf.browser.toPixels(population, document.getElementById('canvas'));

  backend.value = tf.getBackend();

  interval = setInterval(playMNCA, 1000 / speed.value);
}
</script>

<style scoped>
.alive {
  background-color: #fff;
}

.dead {
  background-color: #000;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: #ccc;
}

.clickable:active {
  background-color: #aaa;
}

td {
  border: 1px solid #000;
}
</style>
