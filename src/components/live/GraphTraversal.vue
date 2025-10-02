<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full flex items-center justify-center max-h-[100vh] overflow-y-scroll">
      <div id="cy" class="w-full h-full p-4" />
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          This is a simple visualization of several graph traversal algorithms. You can select the algorithm you want to visualize, the number of elements, and the speed of the visualization.
        </p>
        <p>
          To start the visualization, click on the play button. You can pause the visualization at any time by clicking on the pause button. You can also reset the visualization by clicking on the reset button.
        </p>
        <p>
          You can also select a node in the graph to start the traversal from that node. The traversal will start from the selected node and highlight the nodes and edges as they are visited.
        </p>
      </article>

      <div class="flex flex-col gap-2">
        <div class="join w-full">
          <div class="tooltip" :data-tip="play ? 'Pause' : 'Play'">
            <button class="btn btn-square join-item" @click="startAlgorithm">
              <i v-if="!play" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-pause text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Randomize">
            <button class="btn btn-square join-item" @click="randomize">
              <i class="fa-solid fa-shuffle text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Reset">
            <button class="btn btn-square join-item" @click="reset">
              <i class="fa-solid fa-rotate-right text-xl"></i>
            </button>
          </div>
        </div>

        <label for="speed">Number of Elements</label>
        <input
          class="range range-xs range-primary"
          type="range"
          id="speed"
          name="speed"
          min="5"
          max="50"
          :value="numberOfElements"
          step="5"
          @input="e => numberOfElements = e.target.value"
        >
        <label for="speed" class="block">{{ numberOfElements }}</label>

        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Speed</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            :value="delay"
            class="range"
            step="100"
            @input="e => delay = e.target.value"
          />
          <div class="w-full flex justify-between text-xs px-2">
            <span>|</span>
            <span>|</span>
            <span>|</span>
            <span>|</span>
            <span>|</span>
          </div>
        </label>

        <label for="preset">Traversal Algorithm</label>
        <select
          class="select select-bordered select-sm w-full mb-4"
          id="preset"
          name="preset"
          @input="e => setAlgorithm(e.target.value)"
        >
          <option :value="TraversalAlgorithm.BreadthFirstSearch">Breadth First Search</option>
          <option :value="TraversalAlgorithm.DepthFirstSearch">Depth First Search</option>
        </select>
      </div>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';

const TraversalAlgorithm = {
  BreadthFirstSearch: 0,
  DepthFirstSearch: 1,
};

let cy;
let width;
let height;
const algorithm = ref(TraversalAlgorithm.BreadthFirstSearch);
const play = ref(false);
const delay = ref(100);
const delayChange = ref(false);
const numberOfElements = ref(10);

const options = {
  name: 'cola',
  animate: true,
  refresh: 1,
  maxSimulationTime: 4000,
  ungrabifyWhileSimulating: false,
  fit: true,
  padding: 30,
  boundingBox: undefined,
  nodeDimensionsIncludeLabels: false,
  ready: function() {},
  stop: function() {},
  randomize: false,
  avoidOverlap: true,
  handleDisconnected: true,
  convergenceThreshold: 0.01,
  nodeSpacing: function(node) { return 10; },
  flow: undefined,
  alignment: undefined,
  gapInequalities: undefined,
  centerGraph: true,
  edgeLength: undefined,
  edgeSymDiffLength: undefined,
  edgeJaccardLength: undefined,
  unconstrIter: undefined,
  userConstIter: undefined,
  allConstIter: undefined,
};

let graph = [];

function setAlgorithm(value) {
  algorithm.value = parseInt(value);
}

function generateRandomGraph() {
  graph = [];
  for (let i = 0; i < numberOfElements.value; i++) {
    graph.push({ group: 'nodes', data: { id: i.toString() } });
  }

  for (let i = 0; i < numberOfElements.value; i++) {
    let target = Math.floor(Math.random() * numberOfElements.value);
    while (target === i) {
      target = Math.floor(Math.random() * numberOfElements.value);
    }

    let weight = Math.floor(Math.random() * 10) + 1;

    graph.push({ group: 'edges', data: { id: `${i}-${target}`, source: i.toString(), target: target.toString(), weigth: weight } });
  }

  cy.add(graph);
}

onMounted(async () => {
  const cytoscape = (await import('cytoscape')).default;
  const cola = (await import('cytoscape-cola')).default;

  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [],
    style: cytoscape.stylesheet()
      .selector('node')
      .style({
        'content': 'data(id)',
        'color': 'white',
      })
      .selector(':selected')
      .style({
        'background-color': '#9433eb',
        'line-color': '#9433eb',
        'text-outline-color': '#9433eb'
      })
      .selector('edge')
      .style({
        'curve-style': 'bezier',
        'width': 4,
        'line-color': '#ddd',
      })
      .selector('.highlighted')
      .style({
        'background-color': '#9433eb',
        'line-color': '#9433eb',
        'transition-property': 'background-color, line-color, target-arrow-color, source-arrow-color',
        'transition-duration': '0.5s'
      }),
  });

  generateRandomGraph();
  cytoscape.use(cola);
  cy.layout(options).run();
});

function breadthFirstSearch() {
  let typeIds = cy.elements('node:selected');

  if (typeIds.length === 0) {
    typeIds = cy.elements('node');
  }

  let startNode = typeIds[0].id();

  let bfs = cy.elements().bfs("#" + startNode, function() {}, false);

  let i = 0;
  let highlightNextEle = function() {
    if (play.value === false) {
      return;
    }

    if (i < bfs.path.length) {
      bfs.path[i].addClass('highlighted');

      i++;
      setTimeout(highlightNextEle, delay.value);
    } else {
      play.value = false;
    }
  };

  highlightNextEle();
}

function depthFirstSearch() {
  let typeIds = cy.elements('node:selected');

  if (typeIds.length === 0) {
    typeIds = cy.elements('node');
  }

  let startNode = typeIds[0].id();

  let dfs = cy.elements().dfs("#" + startNode, function() {}, false);

  let i = 0;
  let highlightNextEle = function() {
    if (play.value === false) {
      return;
    }

    if (i < dfs.path.length) {
      dfs.path[i].addClass('highlighted');

      i++;
      setTimeout(highlightNextEle, delay.value);
    } else {
      play.value = false;
    }
  };

  highlightNextEle();
}

function startAlgorithm() {
  if (play.value) {
    return;
  }

  reset();
  play.value = true;
  switch (algorithm.value) {
    case TraversalAlgorithm.BreadthFirstSearch:
      breadthFirstSearch();
      break;
    case TraversalAlgorithm.DepthFirstSearch:
      depthFirstSearch();
      break;
  }
}

function reset() {
  play.value = false;
  cy.elements().removeClass('highlighted');
}

function randomize() {
  cy.elements().remove();
  generateRandomGraph();
  cy.layout(options).run();
}
</script>
