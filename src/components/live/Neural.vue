<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-8">
      <div class="flex flex-col gap-8">
        <!-- Network Visualization -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Neural Network</h2>
          <div class="w-full overflow-hidden">
            <canvas
              ref="networkCanvas"
              class="w-full bg-base-300 rounded-lg"
              style="height: 400px; max-width: 100%;"
            ></canvas>
          </div>
        </div>

        <!-- Dataset Visualization -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Training Data & Decision Boundary</h2>
          <div class="w-full overflow-hidden">
            <canvas
              ref="dataCanvas"
              class="w-full bg-base-300 rounded-lg"
              style="height: 400px; max-width: 100%;"
            ></canvas>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Training Progress</h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Epoch</div>
              <div class="stat-value text-primary">{{ currentEpoch }}</div>
              <div class="stat-desc">/ {{ maxEpochs }}</div>
            </div>
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Loss</div>
              <div class="stat-value text-secondary">{{ currentLoss.toFixed(4) }}</div>
              <div class="stat-desc">{{ lossDirection }}</div>
            </div>
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Accuracy</div>
              <div class="stat-value text-accent">{{ (accuracy * 100).toFixed(1) }}%</div>
              <div class="stat-desc">on training set</div>
            </div>
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Speed</div>
              <div class="stat-value text-info">{{ speed }}ms</div>
              <div class="stat-desc">per iteration</div>
            </div>
          </div>

          <canvas
            ref="lossChart"
            class="w-full"
            style="max-height: 250px;"
          ></canvas>
        </div>
      </div>
    </div>

    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          Watch a neural network learn in real-time! The visualization shows activations flowing
          forward (blue) and gradients flowing backward (red) during training.
        </p>
        <p>
          Adjust the network architecture, learning rate, and dataset to see how different
          configurations affect learning.
        </p>
      </article>

      <div class="flex flex-col gap-4">
        <!-- Control Buttons -->
        <div class="join w-full">
          <div class="tooltip" :data-tip="isTraining ? 'Pause' : 'Play'">
            <button class="btn btn-square join-item" @click="toggleTraining">
              <i v-if="!isTraining" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-pause text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Step Once">
            <button class="btn btn-square join-item" @click="stepOnce" :disabled="isTraining">
              <i class="fa-solid fa-forward-step text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Reset">
            <button class="btn btn-square join-item" @click="reset">
              <i class="fa-solid fa-rotate-right text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Dataset Selection -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Dataset</span>
          </div>
          <select
            v-model="selectedDataset"
            @change="onDatasetChange"
            class="select select-bordered"
          >
            <option value="xor">XOR</option>
            <option value="circle">Circle</option>
            <option value="spiral">Spiral</option>
            <option value="diagonal">Diagonal</option>
          </select>
        </label>

        <!-- Network Architecture -->
        <div class="form-control w-full">
          <div class="label">
            <span class="label-text">Network Architecture</span>
          </div>
          <div class="flex gap-2 items-center">
            <span class="text-sm">2 →</span>
            <input
              v-model.number="hiddenLayers[0]"
              @change="onArchitectureChange"
              type="number"
              min="1"
              max="16"
              class="input input-bordered input-sm w-16"
            />
            <span class="text-sm">→</span>
            <input
              v-model.number="hiddenLayers[1]"
              @change="onArchitectureChange"
              type="number"
              min="1"
              max="16"
              class="input input-bordered input-sm w-16"
            />
            <span class="text-sm">→ 1</span>
          </div>
          <div class="label">
            <span class="label-text-alt">Input → Hidden → Hidden → Output</span>
          </div>
        </div>

        <!-- Activation Function -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Activation Function</span>
          </div>
          <select
            v-model="activationFn"
            @change="onActivationChange"
            class="select select-bordered"
          >
            <option value="sigmoid">Sigmoid</option>
            <option value="relu">ReLU</option>
            <option value="tanh">Tanh</option>
          </select>
        </label>

        <!-- Learning Rate -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Learning Rate: {{ learningRate }}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            v-model.number="learningRate"
            @input="onLearningRateChange"
            class="range range-primary"
          />
          <div class="w-full flex justify-between text-xs px-2">
            <span>0.01</span>
            <span>1.0</span>
          </div>
        </label>

        <!-- Training Speed -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Training Speed</span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            v-model.number="speed"
            class="range range-secondary"
          />
          <div class="w-full flex justify-between text-xs px-2">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </label>

        <!-- Max Epochs -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Max Epochs</span>
          </div>
          <input
            type="number"
            v-model.number="maxEpochs"
            min="10"
            max="1000"
            step="10"
            class="input input-bordered"
          />
        </label>
      </div>

      <article class="prose mt-4">
        <h3>How It Works</h3>
        <p class="text-sm">
          The network learns by comparing its predictions to the true labels, computing the error,
          and adjusting weights through backpropagation. Blue nodes show high activation,
          red show low. Thick edges indicate stronger connections.
        </p>
      </article>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import FormSideBar from './FormSideBar.vue';
import { NeuralNetwork } from './nn/NeuralNetwork.js';
import { getDataset } from './nn/datasets.js';
import { AnimationManager } from './nn/animations.js';

// Component state
const networkCanvas = ref(null);
const dataCanvas = ref(null);
const lossChart = ref(null);

// Network configuration
const hiddenLayers = ref([4, 4]);
const activationFn = ref('sigmoid');
const learningRate = ref(0.1);
const speed = ref(200);
const maxEpochs = ref(100);
const selectedDataset = ref('xor');

// Training state
const isTraining = ref(false);
const currentEpoch = ref(0);
const currentLoss = ref(0);
const accuracy = ref(0);
const lossHistory = ref([]);
const previousLoss = ref(0);

// Neural network instance
let network = null;
let dataset = null;
let trainingInterval = null;
let chart = null;
let networkCtx = null;
let dataCtx = null;
let animationManager = null;
let animationLoop = null;

const lossDirection = computed(() => {
  if (lossHistory.value.length < 2) return '';
  const recent = lossHistory.value.slice(-2);
  if (recent[1] < recent[0]) return '↓ Decreasing';
  if (recent[1] > recent[0]) return '↑ Increasing';
  return '→ Stable';
});

function initNetwork() {
  const layers = [2, ...hiddenLayers.value, 1];
  network = new NeuralNetwork(layers, activationFn.value, learningRate.value);
  dataset = getDataset(selectedDataset.value);

  currentEpoch.value = 0;
  currentLoss.value = 0;
  accuracy.value = 0;
  lossHistory.value = [];

  drawNetwork();
  drawDataset();
}

function drawNetwork() {
  if (!networkCtx || !network) return;

  const canvas = networkCanvas.value;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  networkCtx.clearRect(0, 0, width, height);

  const layers = [2, ...hiddenLayers.value, 1];
  const layerSpacing = width / (layers.length + 1);
  const nodePositions = [];

  // Calculate node positions
  for (let i = 0; i < layers.length; i++) {
    const layerNodes = [];
    const nodeCount = layers[i];
    const nodeSpacing = height / (nodeCount + 1);

    for (let j = 0; j < nodeCount; j++) {
      const x = layerSpacing * (i + 1);
      const y = nodeSpacing * (j + 1);
      layerNodes.push({ x, y });
    }
    nodePositions.push(layerNodes);
  }

  // Store positions for animation
  if (animationManager) {
    animationManager.setNodePositions(nodePositions);
  }

  // Draw edges (weights)
  const weights = network.getWeights();
  for (let i = 0; i < weights.length; i++) {
    const fromLayer = nodePositions[i];
    const toLayer = nodePositions[i + 1];
    const layerWeights = weights[i];

    for (let j = 0; j < layerWeights.length; j++) {
      for (let k = 0; k < layerWeights[j].length; k++) {
        const weight = layerWeights[j][k];
        const from = fromLayer[k];
        const to = toLayer[j];

        // Line thickness based on weight magnitude
        const thickness = Math.min(Math.abs(weight) * 3, 4);
        // Color based on weight sign
        const color = weight > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';

        networkCtx.beginPath();
        networkCtx.moveTo(from.x, from.y);
        networkCtx.lineTo(to.x, to.y);
        networkCtx.strokeStyle = color;
        networkCtx.lineWidth = thickness;
        networkCtx.stroke();
      }
    }
  }

  // Draw nodes (neurons)
  const activations = network.getActivations();
  for (let i = 0; i < nodePositions.length; i++) {
    const layerNodes = nodePositions[i];
    const layerActivations = activations[i] || Array(layerNodes.length).fill(0);

    for (let j = 0; j < layerNodes.length; j++) {
      const { x, y } = layerNodes[j];
      const activation = layerActivations[j] || 0;

      // Node size
      const radius = 15;

      // Color based on activation (blue to red gradient)
      const intensity = Math.max(0, Math.min(1, activation));
      const r = Math.floor(intensity * 255);
      const b = Math.floor((1 - intensity) * 255);
      const color = `rgb(${r}, 100, ${b})`;

      // Draw node
      networkCtx.beginPath();
      networkCtx.arc(x, y, radius, 0, Math.PI * 2);
      networkCtx.fillStyle = color;
      networkCtx.fill();
      networkCtx.strokeStyle = '#fff';
      networkCtx.lineWidth = 2;
      networkCtx.stroke();

      // Draw activation value
      networkCtx.fillStyle = '#fff';
      networkCtx.font = '10px monospace';
      networkCtx.textAlign = 'center';
      networkCtx.textBaseline = 'middle';
      networkCtx.fillText(activation.toFixed(2), x, y);
    }
  }

  // Draw animation particles on top
  if (animationManager) {
    animationManager.update(networkCtx);
  }
}

function startAnimationLoop() {
  if (animationLoop) return;

  const animate = () => {
    if (animationManager && animationManager.hasParticles()) {
      drawNetwork();
    }
    animationLoop = requestAnimationFrame(animate);
  };

  animationLoop = requestAnimationFrame(animate);
}

function stopAnimationLoop() {
  if (animationLoop) {
    cancelAnimationFrame(animationLoop);
    animationLoop = null;
  }
}

function drawDataset() {
  if (!dataCtx || !dataset || !network) return;

  const canvas = dataCanvas.value;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  dataCtx.clearRect(0, 0, width, height);

  // Draw decision boundary (grid of predictions)
  const gridSize = 40;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i + 0.5) / gridSize;
      const y = (j + 0.5) / gridSize;

      // Manually do forward pass to avoid recursion
      const output = network.forward([x, y])[0];

      // Much stronger colors - map output directly to alpha
      // Output near 0 = strong blue, output near 1 = strong purple
      const isClass1 = output > 0.5;
      const confidence = isClass1 ? output : (1 - output);
      const alpha = 0.3 + (confidence * 0.6); // Range from 0.3 to 0.9

      const color = isClass1
        ? `rgba(168, 85, 247, ${alpha})` // Purple for class 1
        : `rgba(59, 130, 246, ${alpha})`; // Blue for class 0

      dataCtx.fillStyle = color;
      dataCtx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
    }
  }

  // Draw data points on top
  dataset.data.forEach(point => {
    const x = point.input[0] * width;
    const y = point.input[1] * height;
    const label = point.label;

    dataCtx.beginPath();
    dataCtx.arc(x, y, 8, 0, Math.PI * 2);
    dataCtx.fillStyle = label === 1 ? '#a855f7' : '#3b82f6';
    dataCtx.fill();
    dataCtx.strokeStyle = '#fff';
    dataCtx.lineWidth = 2;
    dataCtx.stroke();
  });
}

function trainEpoch() {
  if (!network || !dataset) return;

  let totalLoss = 0;
  let correct = 0;

  // Pick one sample to visualize
  const visualSample = dataset.data[currentEpoch.value % dataset.data.length];

  // Trigger forward pass animation for the visual sample
  if (animationManager) {
    animationManager.animateForward(network.getWeights(), speed.value * 0.6);
  }

  // Train on ALL samples for stable learning
  dataset.data.forEach((sample, idx) => {
    network.train(sample.input, sample.target);
  });

  // Trigger backward pass animation after training
  setTimeout(() => {
    if (animationManager) {
      animationManager.animateBackward(network.getGradients(), speed.value * 0.6);
    }
  }, speed.value * 0.7);

  // Calculate metrics across all samples
  dataset.data.forEach(s => {
    const output = network.forward(s.input)[0];
    const prediction = output > 0.5 ? 1 : 0;
    if (prediction === s.label) correct++;
    const loss = Math.pow(output - s.target[0], 2);
    totalLoss += loss;
  });

  currentLoss.value = totalLoss / dataset.data.length;
  accuracy.value = correct / dataset.data.length;

  // Push a copy to avoid reactivity issues
  lossHistory.value = [...lossHistory.value, currentLoss.value];

  currentEpoch.value++;

  // Update visualizations
  drawNetwork();
  drawDataset();
  updateLossChart();

  // Stop if max epochs reached
  if (currentEpoch.value >= maxEpochs.value) {
    stopTraining();
  }
}

function toggleTraining() {
  if (isTraining.value) {
    stopTraining();
  } else {
    startTraining();
  }
}

function startTraining() {
  // If we've reached max epochs, reset first
  if (currentEpoch.value >= maxEpochs.value) {
    currentEpoch.value = 0;
    currentLoss.value = 0;
    accuracy.value = 0;
    lossHistory.value = [];
    if (chart) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
    }
  }

  isTraining.value = true;
  startAnimationLoop();
  trainingInterval = setInterval(() => {
    trainEpoch();
  }, speed.value);
}

function stopTraining() {
  isTraining.value = false;
  if (trainingInterval) {
    clearInterval(trainingInterval);
    trainingInterval = null;
  }
}

function stepOnce() {
  startAnimationLoop();
  trainEpoch();

  // Stop animation loop after particles finish
  setTimeout(() => {
    if (!isTraining.value) {
      stopAnimationLoop();
    }
  }, speed.value * 2);
}

function reset() {
  // Stop everything first
  stopTraining();
  stopAnimationLoop();

  // Clear animations
  if (animationManager) {
    animationManager.clear();
  }

  // Clear any pending timeouts from training
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }

  // Reset training state
  currentEpoch.value = 0;
  currentLoss.value = 0;
  accuracy.value = 0;
  lossHistory.value = [];

  // Reinitialize network
  initNetwork();

  // Clear chart
  if (chart) {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
  }
}

function onDatasetChange() {
  reset();
}

function onArchitectureChange() {
  reset();
}

function onActivationChange() {
  if (network) {
    network.setActivationFunction(activationFn.value);
  }
}

function onLearningRateChange() {
  if (network) {
    network.setLearningRate(learningRate.value);
  }
}

async function updateLossChart() {
  if (!chart) return;

  chart.data.labels = lossHistory.value.map((_, i) => i + 1);
  chart.data.datasets[0].data = lossHistory.value;
  chart.update('none'); // No animation for performance
}

onMounted(async () => {
  // Setup canvases
  const netCanvas = networkCanvas.value;
  const datCanvas = dataCanvas.value;

  netCanvas.width = netCanvas.offsetWidth;
  netCanvas.height = 400;
  datCanvas.width = datCanvas.offsetWidth;
  datCanvas.height = 400;

  networkCtx = netCanvas.getContext('2d');
  dataCtx = datCanvas.getContext('2d');

  // Initialize animation manager
  animationManager = new AnimationManager();

  // Initialize network
  initNetwork();

  // Setup loss chart
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  const ctx = lossChart.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Loss',
        data: [],
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Loss'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Epoch'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
});

// Watch speed changes to restart interval
watch(speed, () => {
  if (isTraining.value) {
    stopTraining();
    startTraining();
  }
});
</script>
