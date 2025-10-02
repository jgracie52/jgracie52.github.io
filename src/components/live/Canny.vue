<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
      <div style="position:relative">
        <video id="player" controls autoplay hidden></video>
        <canvas id="canvas" class="w-full h-full rounded-md"></canvas>
        <button
          class="btn btn-circle glass recording-btn"
          :class="{ 'color-red': record }"
          @click="toggleVideo"
        >
          <i v-if="record" class="fa-solid fa-video"></i>
          <i v-else class="fa-solid fa-video-slash"></i>
        </button>
      </div>
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>Canny Edge Detection is a popular edge detection algorithm widely used in computer vision and image processing. The algorithm involves several steps ranging from Gaussian Smoothing to Hysteresis Thresholding.</p>
        <p>You can test the algorithm by clicking the video icon in the top right of the canvas. You can also adjust the values for sigma, upper th, and lower th which will increase/decrease the edges that are detected.</p>
        <p>You can also view each invidual layer of the process (such as gaussian smoothing 'Ix' or the Magnitude) by change the layer in the select box below.</p>
        <p>Check out the <a href="/project-files/cannydemo">project</a> page for more details</p>
      </article>
      <label for="tournament">View Layer</label>
      <select class="select select-bordered w-full max-w-xs" @input="(e) => viewLayer = e.target.value">
        <option selected value="Edges">Edges</option>
        <option value="NMS">Non-Max Suppresion</option>
        <option value="P">P</option>
        <option value="Magnitude">Magnitude</option>
        <option value="Iyy">Iyy</option>
        <option value="Ixx">Ixx</option>
        <option value="Ix">Ix</option>
      </select>
      <label for="tournament">Sigma</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="tournament"
        name="tournament"
        min="1"
        max="10"
        step="0.2"
        :value="sigma"
        @input="e => sigma = Number.parseFloat(e.target.value)"
      >
      <label for="tournament" class="block">{{ sigma }}</label>
      <label for="tournament">Upper TH</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="tournament"
        name="tournament"
        min="0"
        max="1"
        step="0.05"
        :value="upper_threshold_ratio"
        @input="e => upper_threshold_ratio = Number.parseFloat(e.target.value)"
      >
      <label for="tournament" class="block">{{ upper_threshold_ratio }}</label>
      <label for="tournament">Lower TH</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="tournament"
        name="tournament"
        min="0"
        max="1"
        step="0.05"
        :value="lower_threshold_ratio"
        @input="e => lower_threshold_ratio = Number.parseFloat(e.target.value)"
      >
      <label for="tournament" class="block">{{ lower_threshold_ratio }}</label>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';
import * as tf from '@tensorflow/tfjs';

const constraints = {
  video: true,
};

let camera = null;
const record = ref(false);
const lower_threshold_ratio = ref(0.1);
const upper_threshold_ratio = ref(0.4);
const sigma = ref(1);
const viewLayer = ref('Convolutions');
let interval;

let G = null;
let size = 0;
let G_prime = null;

function padBorders(image, padwidth = 1) {
  let border_paddings = tf.tensor([[0, 0], [1, 1], [1, 1], [0, 0]]);
  let x = tf.pad(image, border_paddings, "CONSTANT");
  for (let i = 0; i < padwidth - 1; i++) {
    x = tf.pad(x, border_paddings, "CONSTANT");
  }
}

function generateGaussianMask() {
  let radius = Math.round((2.5 * sigma.value) - 0.5);
  let size = (2 * radius) + 1;

  let G = [];
  let sumGauss = 0;
  let denom = (2 * sigma.value * sigma.value);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let num = -((i - radius) * (i - radius) + (j - radius) * (j - radius));
      G.push(Math.exp(num / denom));
      sumGauss = sumGauss + G[i * size + j];
    }
  }

  for (let i = 0; i < size * size; i++) {
    G[i] = G[i] / sumGauss;
  }

  let G_tensor = tf.tensor(G).reshape([size, size, 1, 1]);

  return { G_tensor, size };
}

function generateGaussianDerivative() {
  let h_filter = tf.reshape(tf.tensor([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], tf.float32), [3, 3, 1, 1]);
  let v_filter = tf.reshape(tf.tensor([[1, 2, 1], [0, 0, 0], [-1, -2, -1]], tf.float32), [3, 3, 1, 1]);

  return { h_filter, v_filter };
}

function Convolve(I, G, size) {
  let I_clone = I.clone().expandDims(-1);
  let x_gaussian = tf.conv2d(I_clone, G, 1, "valid");
  return x_gaussian.squeeze();
}

function ConvolvePrime(Ix, G_prime_h, G_prime_v, size) {
  let Ix_clone = Ix.clone().expandDims(-1);
  let Ixx = tf.conv2d(Ix_clone, G_prime_h, 1, "valid").squeeze();
  let Iyy = tf.conv2d(Ix_clone, G_prime_v, 1, "valid").squeeze();

  return { Ixx, Iyy };
}

function computeMagnitude(Ixx, Iyy) {
  let M = tf.sqrt((tf.add(tf.pow(Ixx, tf.tensor([2])), tf.pow(Iyy, tf.tensor([2])))));
  let P = tf.div(tf.mul(tf.atan2(Iyy, Ixx), tf.tensor([180])), tf.tensor([Math.PI]));

  return { M, P };
}

async function nonMaxSuppression(M, P) {
  let p = tf.add(P, 180).mod(180);
  p = tf.expandDims(p, -1);

  let d0 = tf.mul(tf.greaterEqual(p, 157.5), tf.less(p, 22.5));
  let d45 = tf.mul(tf.greaterEqual(p, 22.5), tf.less(p, 67.5));
  let d90 = tf.mul(tf.greaterEqual(p, 67.5), tf.less(p, 112.5));
  let d135 = tf.mul(tf.greaterEqual(p, 112.5), tf.less(p, 157.5));

  let np_filter_0 = zeros([3, 3, 1, 2]);
  np_filter_0[1][0][0][0] = 1;
  np_filter_0[1][2][0][1] = 1;
  let filter_0 = tf.tensor(np_filter_0, tf.float32);

  let np_filter_90 = zeros([3, 3, 1, 2]);
  np_filter_90[0][1][0][0] = 1;
  np_filter_90[2][1][0][1] = 1;
  let filter_90 = tf.tensor(np_filter_90, tf.float32);

  let np_filter_45 = zeros([3, 3, 1, 2]);
  np_filter_45[0][2][0][0] = 1;
  np_filter_45[2][0][0][1] = 1;
  let filter_45 = tf.tensor(np_filter_45, tf.float32);

  let np_filter_135 = zeros([3, 3, 1, 2]);
  np_filter_135[0][0][0][0] = 1;
  np_filter_135[2][2][0][1] = 1;
  let filter_135 = tf.tensor(np_filter_135, tf.float32);

  M = tf.expandDims(M, -1);

  let pixels0 = tf.conv2d(M, filter_0, 1, 'same');
  let isGreater0 = tf.greater(tf.mul(M, d0), pixels0).toFloat();
  let isMax0 = tf.mul(isGreater0.slice([0, 0, 0], [M.shape[0], M.shape[1], 1]), isGreater0.slice([0, 0, 1], [M.shape[0], M.shape[1], 1]));

  let pixels90 = tf.conv2d(M, filter_90, 1, 'same');
  let isGreater90 = tf.greater(tf.mul(M, d90), pixels90).toFloat();
  let isMax90 = tf.mul(isGreater90.slice([0, 0, 0], [M.shape[0], M.shape[1], 1]), isGreater90.slice([0, 0, 1], [M.shape[0], M.shape[1], 1]));

  let pixels45 = tf.conv2d(M, filter_45, 1, 'same');
  let isGreater45 = tf.greater(tf.mul(M, d45), pixels45).toFloat();
  let isMax45 = tf.mul(isGreater45.slice([0, 0, 0], [M.shape[0], M.shape[1], 1]), isGreater45.slice([0, 0, 1], [M.shape[0], M.shape[1], 1]));

  let pixels135 = tf.conv2d(M, filter_135, 1, 'same');
  let isGreater135 = tf.greater(tf.mul(M, d135), pixels135).toFloat();
  let isMax135 = tf.mul(isGreater135.slice([0, 0, 0], [M.shape[0], M.shape[1], 1]), isGreater135.slice([0, 0, 1], [M.shape[0], M.shape[1], 1]));

  let nms = tf.mul(M, tf.add(tf.add(isMax0, isMax90), tf.add(isMax45, isMax135)));
  nms = tf.clipByValue(nms, 0, 1);

  return nms.squeeze();
}

async function hysteresisThresholding(nms) {
  let upper_th = upper_threshold_ratio.value;
  let lower_th = lower_threshold_ratio.value;

  let nms_clone = nms.clone();
  nms_clone = tf.expandDims(nms_clone, -1);

  let strong_edges = tf.greaterEqual(nms_clone, upper_th).toFloat();
  let weak_edges = tf.mul(tf.greaterEqual(nms_clone, lower_th).toFloat(), tf.less(nms_clone, upper_th).toFloat());

  let np_filter_sure = ones([3, 3, 1, 1]);
  np_filter_sure[1][1][0][0] = 0;
  let filter_sure = tf.tensor(np_filter_sure, tf.float32);
  let connected_edges = tf.mul(tf.conv2d(strong_edges, filter_sure, 1, 'same'), weak_edges);

  console.log(strong_edges.dataSync());

  for (let i = 0; i < 10; i++) {
    connected_edges = tf.mul(tf.conv2d(connected_edges, filter_sure, 1, 'same'), weak_edges);
  }

  let edges = tf.add(strong_edges, tf.clipByValue(connected_edges, 0, 1)).squeeze();

  return edges;
}

function zeros(dimensions) {
  var array = [];

  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  }

  return array;
}

function ones(dimensions) {
  var array = [];

  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length == 1 ? 1 : ones(dimensions.slice(1)));
  }

  return array;
}

async function tfCam() {
  camera = await tf.data.webcam(document.getElementById('player'));
  interval = setInterval(detectEdges, 1000);
}

async function detectEdges() {
  let image = await camera.capture();

  image = image
    .mean(2)
    .toFloat()
    .expandDims(-1);

  image = image.reshape([image.shape[0], image.shape[1]]);
  image = tf.div(image, 255.0);

  let vals = generateGaussianMask();
  let G = vals.G_tensor;
  let size = vals.size;
  let primeVals = generateGaussianDerivative();
  let G_prime_h = primeVals.h_filter;
  let G_prime_v = primeVals.v_filter;

  let Ix = Convolve(image, G, size);

  if (viewLayer.value == "Ix") {
    tf.browser.toPixels(Ix, document.getElementById('canvas'));
    return;
  }

  let { Ixx, Iyy } = ConvolvePrime(Ix, G_prime_h, G_prime_v, size);

  if (viewLayer.value == "Ixx") {
    Ixx = tf.add(Ixx, tf.abs(tf.min(Ixx)));
    Ixx = tf.div(Ixx, tf.max(Ixx));
    tf.browser.toPixels(Ixx, document.getElementById('canvas'));
    return;
  } else if (viewLayer.value == "Iyy") {
    Iyy = tf.add(Iyy, tf.abs(tf.min(Iyy)));
    Iyy = tf.div(Iyy, tf.max(Iyy));
    tf.browser.toPixels(Iyy, document.getElementById('canvas'));
    return;
  }

  let { M, P } = computeMagnitude(Ixx, Iyy);

  if (viewLayer.value == "Magnitude") {
    M = tf.add(M, tf.abs(tf.min(M)));
    M = tf.div(M, tf.max(M));
    tf.browser.toPixels(M, document.getElementById('canvas'));
    return;
  } else if (viewLayer.value == "P") {
    P = tf.add(P, 180).mod(180);
    tf.browser.toPixels(P.div(255.0), document.getElementById('canvas'));
    return;
  }

  let nms = await nonMaxSuppression(M, P);

  if (viewLayer.value == "NMS") {
    tf.browser.toPixels(nms, document.getElementById('canvas'));
    return;
  }

  let edges = await hysteresisThresholding(nms);
  tf.browser.toPixels(edges, document.getElementById('canvas'));
}

onMounted(() => {
  const supported = 'mediaDevices' in navigator;

  let blank = tf.zeros([120, 160]);
  tf.browser.toPixels(blank, document.getElementById('canvas'));

  if (record.value) {
    tfCam();
  }
});

function toggleVideo() {
  if (record.value) {
    camera.stop();
    clearInterval(interval);
  } else {
    tfCam();
  }

  record.value = !record.value;
}
</script>
