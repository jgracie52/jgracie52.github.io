<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
      <div style="position:relative" class="w-full h-full" id="wrapper">
        <canvas
          id="fractalCanvas"
          style="cursor: crosshair;"
          class="rounded-md h-full w-full bg-black"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @wheel="handleWheel"
        ></canvas>

        <!-- Info overlay -->
        <div class="absolute top-4 left-4 bg-gray-800 p-3 rounded-md text-white text-sm">
          <div>Zoom: {{ zoom.toFixed(2) }}x</div>
          <div>Center: ({{ centerX.toFixed(4) }}, {{ centerY.toFixed(4) }})</div>
          <div>Max Iterations: {{ maxIterations }}</div>
          <div v-if="isRendering" class="text-yellow-500">
            Rendering... {{ renderProgress }}%
          </div>
        </div>
      </div>
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Fractal Visualizer</h2>
        <p>
          Explore beautiful mathematical fractals. Click and drag to pan, scroll to zoom.
        </p>
        <p class="text-sm opacity-70">
          Tip: Zoom into the edges of the Mandelbrot set to discover infinite complexity!
        </p>
      </article>

      <div class="space-y-4">
        <div>
          <label class="font-semibold block mb-2">Fractal Type</label>
          <select
            class="select select-bordered select-sm w-full"
            v-model="fractalType"
            @change="resetView"
          >
            <option value="mandelbrot">Mandelbrot Set</option>
            <option value="julia">Julia Set</option>
            <option value="burningship">Burning Ship</option>
            <option value="tricorn">Tricorn</option>
          </select>
        </div>

        <div v-if="fractalType === 'julia'">
          <label class="font-semibold block mb-2">Julia Constant (Real)</label>
          <input
            type="range"
            class="range range-xs range-primary"
            min="-2"
            max="2"
            step="0.01"
            v-model.number="juliaReal"
            @input="render"
          />
          <div class="text-sm text-center">{{ juliaReal.toFixed(2) }}</div>
        </div>

        <div v-if="fractalType === 'julia'">
          <label class="font-semibold block mb-2">Julia Constant (Imaginary)</label>
          <input
            type="range"
            class="range range-xs range-primary"
            min="-2"
            max="2"
            step="0.01"
            v-model.number="juliaImag"
            @input="render"
          />
          <div class="text-sm text-center">{{ juliaImag.toFixed(2) }}</div>
        </div>

        <div>
          <label class="font-semibold block mb-2">Max Iterations</label>
          <input
            type="range"
            class="range range-xs range-primary"
            min="50"
            max="500"
            step="50"
            v-model.number="maxIterations"
            @input="render"
          />
          <div class="text-sm text-center">{{ maxIterations }}</div>
        </div>

        <div>
          <label class="font-semibold block mb-2">Color Scheme</label>
          <select
            class="select select-bordered select-sm w-full"
            v-model="colorScheme"
            @change="render"
          >
            <option value="classic">Classic</option>
            <option value="fire">Fire</option>
            <option value="ocean">Ocean</option>
            <option value="rainbow">Rainbow</option>
            <option value="grayscale">Grayscale</option>
          </select>
        </div>

        <div>
          <label class="font-semibold block mb-2">Render Speed</label>
          <input
            type="range"
            class="range range-xs range-primary"
            min="1"
            max="10"
            step="1"
            v-model.number="renderSpeed"
            @input="render"
          />
          <div class="text-sm text-center">{{ renderSpeed === 10 ? 'Instant' : renderSpeed }}</div>
        </div>

        <div class="join w-full">
          <button class="btn btn-sm join-item flex-1" @click="resetView">
            <i class="fa-solid fa-rotate-right"></i> Reset View
          </button>
        </div>

        <div class="text-xs opacity-70 mt-4 p-2 bg-base-300 rounded">
          <strong>Controls:</strong><br/>
          • Click + Drag to pan<br/>
          • Scroll to zoom<br/>
          • Change settings to explore
        </div>
      </div>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import FormSideBar from './FormSideBar.vue';

// Canvas and rendering
let canvas;
let ctx;
let width = 800;
let height = 600;

// Fractal parameters
const fractalType = ref('mandelbrot');
const maxIterations = ref(50);
const colorScheme = ref('classic');
const renderSpeed = ref(5);

// Julia set parameters
const juliaReal = ref(-0.7);
const juliaImag = ref(0.27);

// View parameters
const centerX = ref(-0.5);
const centerY = ref(0);
const zoom = ref(1);

// Mouse interaction
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Rendering state
const isRendering = ref(false);
const renderProgress = ref(0);
let renderTimeout = null;
let renderAnimationFrame = null;
let cancelRender = false;

function complexMagnitudeSquared(real, imag) {
  return real * real + imag * imag;
}

function mandelbrot(x0, y0, maxIter) {
  let x = 0;
  let y = 0;
  let x2 = 0;
  let y2 = 0;
  let iteration = 0;

  // Optimized: avoid function call, pre-calculate squares
  while (iteration < maxIter && x2 + y2 < 4) {
    y = 2 * x * y + y0;
    x = x2 - y2 + x0;
    x2 = x * x;
    y2 = y * y;
    iteration++;
  }

  return iteration;
}

function julia(x0, y0, maxIter, cReal, cImag) {
  let x = x0;
  let y = y0;
  let x2 = x * x;
  let y2 = y * y;
  let iteration = 0;

  while (iteration < maxIter && x2 + y2 < 4) {
    y = 2 * x * y + cImag;
    x = x2 - y2 + cReal;
    x2 = x * x;
    y2 = y * y;
    iteration++;
  }

  return iteration;
}

function burningShip(x0, y0, maxIter) {
  let x = 0;
  let y = 0;
  let x2 = 0;
  let y2 = 0;
  let iteration = 0;

  while (iteration < maxIter && x2 + y2 < 4) {
    y = 2 * Math.abs(x * y) + y0;
    x = Math.abs(x2 - y2 + x0);
    x2 = x * x;
    y2 = y * y;
    iteration++;
  }

  return iteration;
}

function tricorn(x0, y0, maxIter) {
  let x = 0;
  let y = 0;
  let x2 = 0;
  let y2 = 0;
  let iteration = 0;

  while (iteration < maxIter && x2 + y2 < 4) {
    y = -2 * x * y + y0;
    x = x2 - y2 + x0;
    x2 = x * x;
    y2 = y * y;
    iteration++;
  }

  return iteration;
}

function getColor(iterations, maxIter, scheme) {
  if (iterations === maxIter) {
    return { r: 0, g: 0, b: 0 };
  }

  const t = iterations / maxIter;

  switch (scheme) {
    case 'classic':
      return {
        r: Math.floor(9 * (1 - t) * t * t * t * 255),
        g: Math.floor(15 * (1 - t) * (1 - t) * t * t * 255),
        b: Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255)
      };

    case 'fire':
      return {
        r: Math.floor(255 * t),
        g: Math.floor(100 * t),
        b: 0
      };

    case 'ocean':
      return {
        r: 0,
        g: Math.floor(150 * t),
        b: Math.floor(255 * t)
      };

    case 'rainbow':
      const hue = t * 360;
      return hslToRgb(hue, 100, 50);

    case 'grayscale':
      const gray = Math.floor(255 * t);
      return { r: gray, g: gray, b: gray };

    default:
      return { r: 0, g: 0, b: 0 };
  }
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.floor(255 * f(0)),
    g: Math.floor(255 * f(8)),
    b: Math.floor(255 * f(4))
  };
}

function pixelToComplex(px, py) {
  const scale = 4 / zoom.value;
  const x = centerX.value + (px - width / 2) * scale / width;
  const y = centerY.value + (py - height / 2) * scale / height;
  return { x, y };
}

function render() {
  // Cancel any ongoing render
  cancelRender = true;
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  if (renderAnimationFrame) {
    cancelAnimationFrame(renderAnimationFrame);
  }

  // For instant rendering, skip timeout and render immediately
  if (renderSpeed.value === 10) {
    cancelRender = false;
    isRendering.value = true;
    renderProgress.value = 0;
    renderInstant();
    return;
  }

  // For progressive rendering, use shorter debounce
  renderTimeout = setTimeout(() => {
    cancelRender = false;
    isRendering.value = true;
    renderProgress.value = 0;

    // Progressive animated render
    renderProgressive();
  }, 50); // Reduced from 100ms to 50ms
}

function renderInstant() {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Cache scale calculation
  const scale = 4 / zoom.value;
  const scaleX = scale / width;
  const scaleY = scale / height;
  const offsetX = centerX.value - (width / 2) * scaleX;
  const offsetY = centerY.value - (height / 2) * scaleY;

  let index = 0;
  for (let py = 0; py < height; py++) {
    const y = offsetY + py * scaleY;

    for (let px = 0; px < width; px++) {
      const x = offsetX + px * scaleX;

      const iterations = calculateIterations(x, y);
      const color = getColor(iterations, maxIterations.value, colorScheme.value);

      data[index++] = color.r;
      data[index++] = color.g;
      data[index++] = color.b;
      data[index++] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  isRendering.value = false;
  renderProgress.value = 100;
}

function renderProgressive() {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Calculate pixels per frame based on speed (1=slow, 9=fast)
  // Speed 1: ~500 pixels/frame, Speed 5: ~5000, Speed 9: ~50000 pixels/frame
  const pixelsPerFrame = Math.floor(500 * Math.pow(2, renderSpeed.value - 1));

  // Create spiral order from center outward
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const pixelOrder = [];
  const seen = new Set(); // Use Set for O(1) duplicate checking

  // Generate spiral pattern: center -> outward
  const maxDist = Math.ceil(Math.sqrt(centerX * centerX + centerY * centerY));

  for (let dist = 0; dist <= maxDist; dist++) {
    // For each distance ring, create points in a circle
    const circumference = Math.max(1, Math.floor(2 * Math.PI * dist));

    for (let i = 0; i < circumference; i++) {
      const angle = (i / circumference) * 2 * Math.PI;
      const px = Math.floor(centerX + dist * Math.cos(angle));
      const py = Math.floor(centerY + dist * Math.sin(angle));

      // Check if pixel is within bounds
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const index = py * width + px;
        // Avoid duplicates using Set for O(1) lookup
        if (!seen.has(index)) {
          seen.add(index);
          pixelOrder.push(index);
        }
      }
    }
  }

  const totalPixels = pixelOrder.length;
  let currentPixelIndex = 0;

  function renderChunk() {
    if (cancelRender) {
      isRendering.value = false;
      return;
    }

    const endPixelIndex = Math.min(currentPixelIndex + pixelsPerFrame, totalPixels);

    // Calculate and draw pixels in spiral order from center
    for (let i = currentPixelIndex; i < endPixelIndex; i++) {
      const pixelIdx = pixelOrder[i];
      const px = pixelIdx % width;
      const py = Math.floor(pixelIdx / width);

      const { x, y } = pixelToComplex(px, py);
      const iterations = calculateIterations(x, y);
      const color = getColor(iterations, maxIterations.value, colorScheme.value);
      const index = (py * width + px) * 4;

      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
      data[index + 3] = 255;
    }

    // Draw current progress
    ctx.putImageData(imageData, 0, 0);

    currentPixelIndex = endPixelIndex;
    renderProgress.value = Math.floor((currentPixelIndex / totalPixels) * 100);

    if (currentPixelIndex < totalPixels) {
      renderAnimationFrame = requestAnimationFrame(renderChunk);
    } else {
      isRendering.value = false;
      renderProgress.value = 100;
    }
  }

  renderAnimationFrame = requestAnimationFrame(renderChunk);
}

function calculateIterations(x, y) {
  switch (fractalType.value) {
    case 'mandelbrot':
      return mandelbrot(x, y, maxIterations.value);
    case 'julia':
      return julia(x, y, maxIterations.value, juliaReal.value, juliaImag.value);
    case 'burningship':
      return burningShip(x, y, maxIterations.value);
    case 'tricorn':
      return tricorn(x, y, maxIterations.value);
    default:
      return 0;
  }
}

function resetView() {
  switch (fractalType.value) {
    case 'mandelbrot':
      centerX.value = -0.5;
      centerY.value = 0;
      zoom.value = 1;
      break;
    case 'julia':
      centerX.value = 0;
      centerY.value = 0;
      zoom.value = 1;
      break;
    case 'burningship':
      centerX.value = -0.5;
      centerY.value = -0.5;
      zoom.value = 0.8;
      break;
    case 'tricorn':
      centerX.value = 0;
      centerY.value = 0;
      zoom.value = 1;
      break;
  }
  render();
}

function handleMouseDown(e) {
  isDragging = true;
  const rect = canvas.getBoundingClientRect();
  lastMouseX = e.clientX - rect.left;
  lastMouseY = e.clientY - rect.top;
}

function handleMouseMove(e) {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;

  const scale = 4 / zoom.value;
  centerX.value -= dx * scale / width;
  centerY.value -= dy * scale / height;

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  render();
}

function handleMouseUp() {
  isDragging = false;
}

function handleWheel(e) {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Get complex coordinates of mouse position before zoom
  const beforeZoom = pixelToComplex(mouseX, mouseY);

  // Apply zoom
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  zoom.value *= zoomFactor;
  zoom.value = Math.max(0.1, Math.min(1000000, zoom.value));

  // Get complex coordinates of mouse position after zoom
  const afterZoom = pixelToComplex(mouseX, mouseY);

  // Adjust center to keep mouse position fixed
  centerX.value += beforeZoom.x - afterZoom.x;
  centerY.value += beforeZoom.y - afterZoom.y;

  render();
}

onMounted(() => {
  canvas = document.getElementById('fractalCanvas');
  ctx = canvas.getContext('2d');

  const wrapper = document.getElementById('wrapper');
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  width = canvas.width;
  height = canvas.height;

  render();
});

onUnmounted(() => {
  cancelRender = true;
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  if (renderAnimationFrame) {
    cancelAnimationFrame(renderAnimationFrame);
  }
});
</script>

<style scoped>
.prose {
  color: white;
}
</style>
