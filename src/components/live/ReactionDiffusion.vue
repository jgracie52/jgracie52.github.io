<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
      <div style="position:relative" class="w-full h-full" id="wrapper">
        <canvas
          id="rdCanvas"
          style="cursor: crosshair;"
          class="rounded-md h-full w-full"
          @mousedown="startPainting"
          @mousemove="paint"
          @mouseup="stopPainting"
          @mouseleave="stopPainting"
        ></canvas>
      </div>
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          This is a reaction-diffusion simulation using the Gray-Scott model implemented with TensorFlow.js.
        </p>
        <p>
          The simulation uses pure matrix math and convolution to compute the Laplacian operator - no WebGL shaders!
        </p>
        <p>
          Click and drag on the canvas to add chemical B and watch patterns emerge. Try different presets to see famous reaction-diffusion patterns.
        </p>
      </article>

      <p class="text-sm mb-4">Current backend: <span class="font-bold">{{ backend }}</span></p>

      <div class="join w-full mb-4">
        <div class="tooltip" :data-tip="isPlaying ? 'Pause' : 'Play'">
          <button class="btn btn-square join-item" @click="togglePlay">
            <i v-if="!isPlaying" class="fa-solid fa-play"></i>
            <i v-else class="fa-solid fa-pause text-xl"></i>
          </button>
        </div>
        <div class="tooltip" data-tip="Step">
          <button class="btn btn-square join-item" @click="stepOnce">
            <i class="fa-solid fa-forward-step text-xl"></i>
          </button>
        </div>
        <div class="tooltip" data-tip="Reset">
          <button class="btn btn-square join-item" @click="reset">
            <i class="fa-solid fa-rotate-right text-xl"></i>
          </button>
        </div>
      </div>

      <label for="preset" class="font-semibold">Pattern Preset</label>
      <select
        class="select select-bordered select-sm w-full mb-4"
        id="preset"
        name="preset"
        v-model="selectedPreset"
        @change="applyPreset"
      >
        <option value="spots">Spots</option>
        <option value="stripes">Stripes</option>
        <option value="waves">Waves</option>
        <option value="coral">Coral</option>
        <option value="mitosis">Mitosis</option>
        <option value="worms">Worms</option>
        <option value="fingerprints">Fingerprints</option>
      </select>

      <label for="colorScheme" class="font-semibold">Color Scheme</label>
      <select
        class="select select-bordered select-sm w-full mb-4"
        id="colorScheme"
        name="colorScheme"
        v-model="colorScheme"
      >
        <option value="inverse">Inverse (Black on White)</option>
        <option value="grayscale">Grayscale (White on Black)</option>
        <option value="purple">Purple (Site Theme)</option>
        <option value="heat">Heat</option>
        <option value="cool">Cool</option>
        <option value="viridis">Viridis</option>
      </select>

      <label for="stepsPerFrame" class="font-semibold">Speed</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="stepsPerFrame"
        name="stepsPerFrame"
        min="1"
        max="30"
        step="1"
        v-model.number="stepsPerFrame"
      >
      <label class="block text-sm mb-3">{{ stepsPerFrame }}</label>

      <label for="resolution" class="font-semibold">Zoom (lower = zoom out)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="resolution"
        name="resolution"
        min="1"
        max="10"
        step="1"
        v-model.number="resolution"
        @input="handleResolutionChange"
      >
      <label class="block text-sm mb-3">{{ resolution }}</label>

      <label for="brushSize" class="font-semibold">Brush Size</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="brushSize"
        name="brushSize"
        min="1"
        max="20"
        step="1"
        v-model.number="brushSize"
      >
      <label class="block text-sm mb-4">{{ brushSize }}</label>

      <label for="threshold" class="font-semibold">Threshold</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="threshold"
        name="threshold"
        min="0.0"
        max="0.5"
        step="0.01"
        v-model.number="threshold"
      >
      <label class="block text-sm mb-4">{{ threshold.toFixed(2) }}</label>

      <label for="contrast" class="font-semibold">Contrast (Sigmoid)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="contrast"
        name="contrast"
        min="0"
        max="50"
        step="1"
        v-model.number="contrastEdginess"
      >
      <label class="block text-sm mb-4">{{ contrastEdginess }}</label>

      <div class="divider"></div>

      <label for="feed" class="font-semibold">Feed Rate (f)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="feed"
        name="feed"
        min="0.000"
        max="0.100"
        step="0.001"
        v-model.number="feedRate"
      >
      <label class="block text-sm mb-3">{{ feedRate.toFixed(3) }}</label>

      <label for="kill" class="font-semibold">Kill Rate (k)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="kill"
        name="kill"
        min="0.040"
        max="0.070"
        step="0.001"
        v-model.number="killRate"
      >
      <label class="block text-sm mb-3">{{ killRate.toFixed(3) }}</label>

      <label for="diffA" class="font-semibold">Diffusion A (Da)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="diffA"
        name="diffA"
        min="0.5"
        max="2.0"
        step="0.1"
        v-model.number="diffusionA"
      >
      <label class="block text-sm mb-3">{{ diffusionA.toFixed(1) }}</label>

      <label for="diffB" class="font-semibold">Diffusion B (Db)</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="diffB"
        name="diffB"
        min="0.1"
        max="1.0"
        step="0.05"
        v-model.number="diffusionB"
      >
      <label class="block text-sm mb-3">{{ diffusionB.toFixed(2) }}</label>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import FormSideBar from './FormSideBar.vue';
import * as tf from '@tensorflow/tfjs';

// Canvas and rendering
let canvas;
let ctx;
let width = ref(0);
let height = ref(0);
let gridWidth = 0;
let gridHeight = 0;

// TensorFlow tensors
let gridA;
let gridB;
let laplacianKernel;
let borderMask;
let inverseBorderMask;

// Simulation parameters
const feedRate = ref(0.055);
const killRate = ref(0.062);
const diffusionA = ref(1.0);
const diffusionB = ref(0.5);
const dt = 0.5; // Time step - reduced for stability

// UI controls
const stepsPerFrame = ref(8);
const resolution = ref(5);
const brushSize = ref(5);
const threshold = ref(0.25);
const contrastEdginess = ref(20);
const isPlaying = ref(false);
const isPainting = ref(false);
const selectedPreset = ref('spots');
const colorScheme = ref('inverse');
const backend = ref('');

// Animation
let animationInterval;

// Presets: {f, k, da, db} for famous patterns
// Based on Pearson's classification of Gray-Scott parameters
const presets = {
  spots: { f: 0.055, k: 0.062, da: 1.0, db: 0.5 },
  stripes: { f: 0.035, k: 0.065, da: 1.0, db: 0.5 },
  waves: { f: 0.014, k: 0.054, da: 1.0, db: 0.5 },
  coral: { f: 0.055, k: 0.062, da: 0.21, db: 0.105},
  mitosis: { f: 0.0367, k: 0.0649, da: 1.0, db: 0.5 },
  worms: { f: 0.050, k: 0.065, da: 1.0, db: 0.5 },
  fingerprints: { f: 0.055, k: 0.060, da: 1.0, db: 0.5 }
};

// Color gradient functions
function getColor(value, scheme) {
  value = Math.max(0, Math.min(1, value));

  // Apply sigmoid contrast enhancement BEFORE threshold (like the shader does)
  // Reference: https://github.com/colejd/Reaction-Diffusion-ThreeJS/blob/master/src/resources/shaders/display-frag.glsl
  // Their sigmoid mode: float sigmoid = 1.0 / (1.0+exp(-displayedValue * edginess + edginess * 0.5));
  if (contrastEdginess.value > 0) {
    const edginess = contrastEdginess.value;
    value = 1.0 / (1.0 + Math.exp(-value * edginess + edginess * 0.5));
  }

  // Apply threshold - values below threshold render as background (0)
  if (value < threshold.value) {
    value = 0;
  } else {
    // Remap remaining values to [0, 1] range
    value = (value - threshold.value) / (1 - threshold.value);
  }

  switch(scheme) {
    case 'inverse':
      // White background, black biology (traditional ink on paper)
      const invGray = Math.floor((1 - value) * 255);
      return [invGray, invGray, invGray];

    case 'purple':
      // Site theme: purple gradient on black background (biology = low value = bright purple)
      const invValue = 1 - value; // Invert so biology (low value) = bright colors
      if (invValue < 0.5) {
        const t = invValue / 0.5;
        return [Math.floor(t * 139), Math.floor(t * 0), Math.floor(t * 139)]; // Black -> Dark Purple
      } else {
        const t = (invValue - 0.5) / 0.5;
        return [Math.floor(139 + t * 116), Math.floor(t * 112), Math.floor(139 + t * 116)]; // Dark Purple -> Bright Purple
      }

    case 'heat':
      // Heat: Black background, biology in heat colors (red/orange/yellow)
      const heatInv = 1 - value; // Invert so biology = bright colors
      if (heatInv < 0.33) {
        const t = heatInv / 0.33;
        return [Math.floor(t * 255), 0, 0]; // Black -> Red
      } else if (heatInv < 0.66) {
        const t = (heatInv - 0.33) / 0.33;
        return [255, Math.floor(t * 255), 0]; // Red -> Yellow
      } else {
        const t = (heatInv - 0.66) / 0.34;
        return [255, 255, Math.floor(t * 255)]; // Yellow -> White
      }

    case 'cool':
      // Cool: Black background, biology in cool colors (blue/cyan)
      const coolInv = 1 - value; // Invert so biology = bright colors
      if (coolInv < 0.33) {
        const t = coolInv / 0.33;
        return [0, 0, Math.floor(t * 255)]; // Black -> Blue
      } else if (coolInv < 0.66) {
        const t = (coolInv - 0.33) / 0.33;
        return [0, Math.floor(t * 255), 255]; // Blue -> Cyan
      } else {
        const t = (coolInv - 0.66) / 0.34;
        return [Math.floor(t * 255), 255, 255]; // Cyan -> White
      }

    case 'viridis':
      // Viridis: biology shows full viridis colors (Purple -> Blue -> Teal -> Green -> Yellow)
      const viridisInv = 1 - value; // Invert so biology = bright colors
      const viridisColors = [
        [0, 0, 0],         // Black (background)
        [68, 1, 84],       // Dark Purple
        [59, 82, 139],     // Blue
        [33, 145, 140],    // Teal
        [94, 201, 98],     // Green
        [253, 231, 37]     // Yellow
      ];
      const idx = viridisInv * (viridisColors.length - 1);
      const i1 = Math.floor(idx);
      const i2 = Math.min(i1 + 1, viridisColors.length - 1);
      const t = idx - i1;
      return [
        Math.floor(viridisColors[i1][0] + t * (viridisColors[i2][0] - viridisColors[i1][0])),
        Math.floor(viridisColors[i1][1] + t * (viridisColors[i2][1] - viridisColors[i1][1])),
        Math.floor(viridisColors[i1][2] + t * (viridisColors[i2][2] - viridisColors[i1][2]))
      ];

    case 'grayscale':
    default:
      // Grayscale: inverted (white biology on black background)
      const gray = Math.floor(value * 255);
      return [gray, gray, gray];
  }
}

function initializeLaplacianKernel() {
  // 9-point discrete Laplacian stencil
  // This approximates the continuous Laplacian operator
  const kernel = [
    [[[0.05]], [[0.2]], [[0.05]]],
    [[[0.2]], [[-1.0]], [[0.2]]],
    [[[0.05]], [[0.2]], [[0.05]]]
  ];
  laplacianKernel = tf.tensor4d(kernel, [3, 3, 1, 1]);
}

function initializeGrids() {
  // Dispose old tensors
  if (gridA) gridA.dispose();
  if (gridB) gridB.dispose();
  if (borderMask) borderMask.dispose();
  if (inverseBorderMask) inverseBorderMask.dispose();

  // Calculate grid dimensions
  gridWidth = Math.floor(canvas.width / resolution.value);
  gridHeight = Math.floor(canvas.height / resolution.value);

  // Create border mask once (reused every simulation step)
  const borderMaskData = new Float32Array(gridHeight * gridWidth);
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const idx = y * gridWidth + x;
      borderMaskData[idx] = (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) ? 0 : 1;
    }
  }
  borderMask = tf.tensor(borderMaskData, [gridHeight, gridWidth, 1]);
  inverseBorderMask = tf.sub(1, borderMask);

  // Initialize A to 1.0 (full concentration)
  gridA = tf.ones([gridHeight, gridWidth, 1]);

  // Initialize B to 0.0 with some random seeds
  const bData = new Float32Array(gridHeight * gridWidth);
  for (let i = 0; i < bData.length; i++) {
    bData[i] = 0.0;
  }

  // Add random seeds for B in center area
  const centerX = Math.floor(gridWidth / 2);
  const centerY = Math.floor(gridHeight / 2);
  const seedRadius = 20;

  for (let i = 0; i < 100; i++) {
    const x = centerX + Math.floor((Math.random() - 0.5) * seedRadius);
    const y = centerY + Math.floor((Math.random() - 0.5) * seedRadius);
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      bData[y * gridWidth + x] = 1.0;
    }
  }

  gridB = tf.tensor(bData, [gridHeight, gridWidth, 1]);
}

function stepSimulation() {
  // Use engine.startScope/endScope for better performance than tf.tidy
  tf.engine().startScope();

  // Add batch dimension for conv2d
  const a4d = gridA.expandDims(0);
  const b4d = gridB.expandDims(0);

  // Compute Laplacians via convolution
  const laplaceA = tf.conv2d(a4d, laplacianKernel, 1, 'same').squeeze([0]);
  const laplaceB = tf.conv2d(b4d, laplacianKernel, 1, 'same').squeeze([0]);

  // Reaction term: A * B squared
  const bSquared = tf.square(gridB);
  const reaction = tf.mul(gridA, bSquared);

  // Update A: Da*Laplacian A - AB squared + f(1-A)
  const diffA = tf.mul(laplaceA, diffusionA.value);
  const feedTerm = tf.mul(tf.sub(1.0, gridA), feedRate.value);
  const deltaA = tf.add(tf.sub(diffA, reaction), feedTerm);

  // Update B: Db*Laplacian B + AB squared - (k+f)B
  const diffB = tf.mul(laplaceB, diffusionB.value);
  const killTerm = tf.mul(gridB, killRate.value + feedRate.value);
  const deltaB = tf.sub(tf.add(diffB, reaction), killTerm);

  // Apply updates with time step
  const newA = tf.add(gridA, tf.mul(deltaA, dt));
  const newB = tf.add(gridB, tf.mul(deltaB, dt));

  // Clamp values to [0, 1]
  let clampedA = tf.clipByValue(newA, 0, 1);
  let clampedB = tf.clipByValue(newB, 0, 1);

  // Fix edges to maintain background state (A=1, B=0) using cached mask
  // This prevents boundary artifacts from convolution padding
  // Apply mask: keep interior values, set edges to background
  const maskedA = tf.add(tf.mul(clampedA, borderMask), inverseBorderMask); // Interior + 1 at edges
  const maskedB = tf.mul(clampedB, borderMask); // Interior only, 0 at edges

  // Dispose old tensors
  clampedA.dispose();
  clampedB.dispose();

  // Keep new grids
  tf.keep(maskedA);
  tf.keep(maskedB);

  clampedA = maskedA;
  clampedB = maskedB;

  // End scope (disposes intermediate tensors)
  tf.engine().endScope();

  // Update grids (dispose old ones)
  gridA.dispose();
  gridB.dispose();
  gridA = clampedA;
  gridB = clampedB;
}

function render() {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.width / dpr;
  const displayHeight = canvas.height / dpr;

  // Use an offscreen canvas for faster rendering
  if (!window.offscreenCanvas) {
    window.offscreenCanvas = document.createElement('canvas');
    window.offscreenCanvas.width = gridWidth;
    window.offscreenCanvas.height = gridHeight;
    window.offscreenCtx = window.offscreenCanvas.getContext('2d', { alpha: false });
  }

  const offscreenCanvas = window.offscreenCanvas;
  const offscreenCtx = window.offscreenCtx;

  // Render grid directly to small offscreen canvas
  const imageData = offscreenCtx.createImageData(gridWidth, gridHeight);
  const aData = gridA.squeeze().dataSync();
  const bData = gridB.squeeze().dataSync();
  const data = imageData.data;
  const scheme = colorScheme.value;

  // Direct pixel mapping using A - B difference (like the shader does)
  // Reference: https://github.com/colejd/Reaction-Diffusion-ThreeJS/blob/master/src/resources/shaders/display-frag.glsl
  // Their "classic" mode: float c = pixel.r - pixel.g (which is A - B)
  for (let i = 0; i < bData.length; i++) {
    const diff = aData[i] - bData[i]; // A - B: biology (high B) = low values
    const value = Math.max(0, Math.min(1, diff)); // Clamp to [0, 1]

    const [r, g, b] = getColor(value, scheme);
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  offscreenCtx.putImageData(imageData, 0, 0);

  // Scale up to main canvas using hardware acceleration
  ctx.drawImage(offscreenCanvas, 0, 0, gridWidth, gridHeight, 0, 0, displayWidth, displayHeight);
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;

  if (isPlaying.value) {
    startAnimation();
  } else {
    stopAnimation();
  }
}

function startAnimation() {
  if (animationInterval) return;

  // Track frame count for render skipping on large grids
  let frameCount = 0;
  const gridSize = gridWidth * gridHeight;
  // Skip more render frames for larger grids
  const renderEveryNFrames = gridSize > 500000 ? 3 : gridSize > 200000 ? 2 : 1;

  // Use requestAnimationFrame for smoother rendering
  function animate() {
    if (!isPlaying.value) return;

    // Run simulation steps per frame
    for (let i = 0; i < stepsPerFrame.value; i++) {
      stepSimulation();
    }

    // Only render every Nth frame for large grids
    frameCount++;
    if (frameCount >= renderEveryNFrames) {
      render();
      frameCount = 0;
    }

    animationInterval = requestAnimationFrame(animate);
  }

  animationInterval = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationInterval) {
    cancelAnimationFrame(animationInterval);
    animationInterval = null;
  }
}

function stepOnce() {
  stepSimulation();
  render();
}

function reset() {
  stopAnimation();
  isPlaying.value = false;
  initializeGrids();
  render();
}

function handleResolutionChange() {
  const wasPlaying = isPlaying.value;

  // Get current grid data before reinitializing
  const oldWidth = gridWidth;
  const oldHeight = gridHeight;
  const oldBData = gridB.dataSync();
  const oldAData = gridA.dataSync();

  // Calculate new grid dimensions
  const newWidth = Math.floor(canvas.width / resolution.value);
  const newHeight = Math.floor(canvas.height / resolution.value);

  // Dispose old grids
  gridA.dispose();
  gridB.dispose();

  // Create new grids at new resolution
  gridWidth = newWidth;
  gridHeight = newHeight;

  // Resample old data to new resolution
  const newAData = new Float32Array(newWidth * newHeight);
  const newBData = new Float32Array(newWidth * newHeight);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Map new coordinates to old coordinates
      const oldX = Math.floor(x * oldWidth / newWidth);
      const oldY = Math.floor(y * oldHeight / newHeight);
      const oldIdx = oldY * oldWidth + oldX;
      const newIdx = y * newWidth + x;

      if (oldIdx < oldAData.length) {
        newAData[newIdx] = oldAData[oldIdx];
        newBData[newIdx] = oldBData[oldIdx];
      } else {
        newAData[newIdx] = 1.0;
        newBData[newIdx] = 0.0;
      }
    }
  }

  // Create new tensors with resampled data
  gridA = tf.tensor(newAData, [newHeight, newWidth, 1]);
  gridB = tf.tensor(newBData, [newHeight, newWidth, 1]);

  // Clear and recreate offscreen canvas
  if (window.offscreenCanvas) {
    window.offscreenCanvas.width = gridWidth;
    window.offscreenCanvas.height = gridHeight;
  }

  render();

  // Resume playing if it was playing before
  if (wasPlaying) {
    isPlaying.value = true;
    startAnimation();
  }
}

function applyPreset() {
  const preset = presets[selectedPreset.value];
  feedRate.value = preset.f;
  killRate.value = preset.k;
  diffusionA.value = preset.da;
  diffusionB.value = preset.db;
  // Don't reset - just update parameters in real-time
}

function startPainting(e) {
  isPainting.value = true;
  paint(e);
}

function stopPainting() {
  isPainting.value = false;
}

function paint(e) {
  if (!isPainting.value) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Convert to grid coordinates
  const gx = Math.floor(x / resolution.value);
  const gy = Math.floor(y / resolution.value);

  // Paint B chemical in circular brush using tf operations (much faster)
  tf.tidy(() => {
    // Create a mask tensor for the circular brush
    const brushMask = [];
    for (let y = 0; y < gridHeight; y++) {
      const row = [];
      for (let x = 0; x < gridWidth; x++) {
        const dx = x - gx;
        const dy = y - gy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        row.push(dist <= brushSize.value ? 1.0 : 0.0);
      }
      brushMask.push(row);
    }

    const mask = tf.tensor(brushMask, [gridHeight, gridWidth]).expandDims(2);
    const ones = tf.ones([gridHeight, gridWidth, 1]);

    // Add mask to gridB (set to 1.0 where mask is 1.0)
    const newB = tf.maximum(gridB, tf.mul(mask, ones));

    gridB.dispose();
    gridB = tf.keep(newB);
  });
}

onMounted(async () => {
  await tf.ready();
  backend.value = tf.getBackend();

  canvas = document.getElementById('rdCanvas');
  ctx = canvas.getContext('2d', { alpha: false });

  // Set canvas size to match device pixel ratio for crisp rendering
  const wrapper = document.getElementById('wrapper');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = wrapper.clientWidth * dpr;
  canvas.height = wrapper.clientHeight * dpr;

  // Scale context to match device pixel ratio
  ctx.scale(dpr, dpr);

  // Set CSS size to match wrapper
  canvas.style.width = wrapper.clientWidth + 'px';
  canvas.style.height = wrapper.clientHeight + 'px';

  width.value = canvas.width;
  height.value = canvas.height;

  // Disable image smoothing for crisp, pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;

  initializeLaplacianKernel();
  initializeGrids();
  render();

  // Apply initial preset
  applyPreset();
});

onUnmounted(() => {
  stopAnimation();

  // Cleanup tensors
  if (gridA) gridA.dispose();
  if (gridB) gridB.dispose();
  if (laplacianKernel) laplacianKernel.dispose();
  if (borderMask) borderMask.dispose();
  if (inverseBorderMask) inverseBorderMask.dispose();

  // Cleanup offscreen canvas
  if (window.offscreenCanvas) {
    window.offscreenCanvas = null;
    window.offscreenCtx = null;
  }
});
</script>

<style scoped>
.divider {
  margin: 1rem 0;
  border-top: 1px solid hsl(287 60% 65% / 0.3);
}
</style>
