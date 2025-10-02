<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full flex items-center justify-center max-h-[100vh] overflow-y-scroll">
      <canvas id="sortingCanvas" class="w-full h-full p-4" />
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          This is a simple visualization of sorting algorithms. You can select the algorithm you want to visualize and the speed of the visualization. Click on the "Play" button to start the visualization.
        </p>
        <p>You can restart the visulation by selecting the random button, and change the sorting algorithm by changing the dropdown. Enjoy!</p>
      </article>

      <div class="flex flex-col gap-2">
        <div class="join w-full">
          <div class="tooltip" :data-tip="play ? 'Pause' : 'Play'">
            <button class="btn btn-square join-item" @click="playAlgo">
              <i v-if="!play" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-pause text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Randomize">
            <button class="btn btn-square join-item" @click="regenerateArray">
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
          min="10"
          max="1000"
          :value="numberOfElements"
          step="1"
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

        <label for="preset">Sorting Algorithm</label>
        <select
          class="select select-bordered select-sm w-full mb-4"
          id="preset"
          name="preset"
          @input="e => setAlgorithm(e.target.value)"
        >
          <option :value="SortingAlgorithm.BubbleSort">Bubble Sort</option>
          <option :value="SortingAlgorithm.SelectionSort">Selection Sort</option>
          <option :value="SortingAlgorithm.InsertionSort">Insertion Sort</option>
          <option :value="SortingAlgorithm.MergeSort">Merge Sort</option>
          <option :value="SortingAlgorithm.QuickSort">Quick Sort</option>
          <option :value="SortingAlgorithm.HeapSort">Heap Sort</option>
        </select>
      </div>

      <article class="prose mb-4">
        <template v-if="algorithm === SortingAlgorithm.BubbleSort">
          <h2>Bubble Sort</h2>
          <p>
            Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.
          </p>
        </template>
        <template v-if="algorithm === SortingAlgorithm.SelectionSort">
          <h2>Selection Sort</h2>
          <p>
            Selection sort is an in-place comparison sorting algorithm. It has an O(n^2) time complexity, which makes it inefficient on large lists, and generally performs worse than the similar insertion sort.
          </p>
        </template>
        <template v-if="algorithm === SortingAlgorithm.InsertionSort">
          <h2>Insertion Sort</h2>
          <p>
            Insertion sort is a simple sorting algorithm that builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.
          </p>
        </template>
        <template v-if="algorithm === SortingAlgorithm.MergeSort">
          <h2>Merge Sort</h2>
          <p>
            Merge sort is an efficient, stable, comparison-based sorting algorithm. Most implementations produce a stable sort, which means that the implementation preserves the input order of equal elements in the sorted output.
          </p>
        </template>
        <template v-if="algorithm === SortingAlgorithm.QuickSort">
          <h2>Quick Sort</h2>
          <p>
            Quicksort is an efficient sorting algorithm. Developed by British computer scientist Tony Hoare in 1959 and published in 1961, it is still a commonly used algorithm for sorting.
          </p>
        </template>
        <template v-if="algorithm === SortingAlgorithm.HeapSort">
          <h2>Heap Sort</h2>
          <p>
            Heapsort is a comparison-based sorting algorithm that creates a binary heap from the array and then repeatedly extracts the maximum element from it and restores the heap property of the remaining elements.
          </p>
        </template>
      </article>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';

const SortingAlgorithm = {
  BubbleSort: 0,
  SelectionSort: 1,
  InsertionSort: 2,
  MergeSort: 3,
  QuickSort: 4,
  HeapSort: 5,
};

let canvas;
let ctx;
let width;
let height;
const array = ref([]);
const originalArray = ref([]);
const algorithm = ref(SortingAlgorithm.BubbleSort);
const play = ref(false);
const delay = ref(100);
const delayChange = ref(false);
const numberOfElements = ref(100);

function bubbleSort() {
  let n = array.value.length;
  let swapped = false;
  let i = 0;
  let j = 0;

  let interval = setInterval(() => {
    if (i < n) {
      if (j < n - i - 1) {
        if (array.value[j] > array.value[j + 1]) {
          let temp = array.value[j];
          array.value[j] = array.value[j + 1];
          array.value[j + 1] = temp;
          swapped = true;
        }
        drawArray(j + 1);
        j++;
      } else {
        if (!swapped) {
          clearInterval(interval);
          play.value = false;
        }
        swapped = false;
        i++;
        j = 0;
      }
    } else {
      clearInterval(interval);
      play.value = false;
    }
  }, delay.value);
}

function selectionSort() {
  let n = array.value.length;
  let i = 0;
  let j = 0;
  let minIndex = 0;

  let interval = setInterval(() => {
    if (i < n) {
      minIndex = i;
      j = i + 1;
      while (j < n) {
        if (array.value[j] < array.value[minIndex]) {
          minIndex = j;
        }
        drawArray(j);
        j++;
      }
      if (minIndex !== i) {
        let temp = array.value[i];
        array.value[i] = array.value[minIndex];
        array.value[minIndex] = temp;
      }
      drawArray(i);
      i++;
    } else {
      clearInterval(interval);
      play.value = false;
    }
  }, delay.value);

  play.value = false;
}

function insertionSort() {
  let n = array.value.length;
  let i = 1;
  let j = 0;

  let interval = setInterval(() => {
    if (i < n) {
      let key = array.value[i];
      j = i - 1;
      while (j >= 0 && array.value[j] > key) {
        array.value[j + 1] = array.value[j];
        drawArray(j);
        j--;
      }
      array.value[j + 1] = key;
      drawArray(i);
      i++;
    } else {
      clearInterval(interval);
      play.value = false;
    }
  }, delay.value);

  play.value = false;
}

async function mergeSort() {
  let n = array.value.length;
  let tempArray = Array.from({ length: n }, () => 0);
  const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

  await mergeSortHelper(0, n - 1);

  play.value = false;

  async function mergeSortHelper(l, r) {
    if (l < r) {
      let m = Math.floor((l + r) / 2);
      await mergeSortHelper(l, m);
      await mergeSortHelper(m + 1, r);

      await sleep(delay.value);
      await merge(l, m, r);
    }
  }

  async function merge(l, m, r) {
    let i = l;
    let j = m + 1;
    let k = l;
    while (i <= m && j <= r) {
      if (array.value[i] <= array.value[j]) {
        tempArray[k] = array.value[i];
        i++;
      } else {
        tempArray[k] = array.value[j];
        j++;
      }
      k++;
    }
    while (i <= m) {
      tempArray[k] = array.value[i];
      i++;
      k++;
    }
    while (j <= r) {
      tempArray[k] = array.value[j];
      j++;
      k++;
    }
    for (let x = l; x <= r; x++) {
      array.value[x] = tempArray[x];
      drawArray(x);
    }
  }
}

function quickSort() {
  let n = array.value.length;
  let stack = Array.from({ length: n }, () => 0);
  let top = -1;
  let l = 0;
  let r = n - 1;
  let i = 0;
  let j = 0;
  let pivot = 0;

  stack[++top] = l;
  stack[++top] = r;
  let interval = setInterval(() => {
    if (top >= 0) {
      r = stack[top--];
      l = stack[top--];
      i = l;
      j = l;
      pivot = array.value[r];
      while (i < r) {
        if (array.value[i] < pivot) {
          let temp = array.value[i];
          array.value[i] = array.value[j];
          array.value[j] = temp;
          drawArray(i);
          j++;
        }
        i++;
      }
      let temp = array.value[j];
      array.value[j] = array.value[r];
      array.value[r] = temp;
      drawArray(j);
      if (j - 1 > l) {
        stack[++top] = l;
        stack[++top] = j - 1;
      }
      if (j + 1 < r) {
        stack[++top] = j + 1;
        stack[++top] = r;
      }
    } else {
      clearInterval(interval);
      play.value = false;
    }
  }, delay.value);

  play.value = false;
}

function heapSort() {
  let n = array.value.length;
  let i = Math.floor(n / 2) - 1;
  let j = 0;
  let k = 0;

  let interval = setInterval(() => {
    if (i >= 0) {
      heapify(n, i);
      i--;
    } else {
      i = n - 1;
      while (i > 0) {
        let temp = array.value[0];
        array.value[0] = array.value[i];
        array.value[i] = temp;
        drawArray(i);
        heapify(i, 0);
        i--;
      }
      clearInterval(interval);
      play.value = false;
    }
  }, delay.value);

  function heapify(n, i) {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    if (left < n && array.value[left] > array.value[largest]) {
      largest = left;
    }
    if (right < n && array.value[right] > array.value[largest]) {
      largest = right;
    }
    if (largest !== i) {
      let temp = array.value[i];
      array.value[i] = array.value[largest];
      array.value[largest] = temp;
      drawArray(i);
      heapify(n, largest);
    }
  }

  play.value = false;
}

function randomizeArray() {
  array.value = Array.from({ length: numberOfElements.value }, () => Math.floor(Math.random() * 100));
  originalArray.value = [...array.value];
}

function drawArray(currentIndx = 0) {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  width = canvas.width;
  height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  const barWidth = width / array.value.length;
  for (let i = 0; i < array.value.length; i++) {
    let barHeight = (array.value[i] / 100) * height;
    let barStartingPoint = height - barHeight;
    if (i === currentIndx) {
      ctx.fillStyle = "white";
    } else {
      let gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, `hsl(${(array.value[i] * 3.6) % 360}, 70%, 40%)`);
      gradient.addColorStop(1, `hsl(${(array.value[i] * 3.6) % 360}, 70%, 70%)`);
      ctx.fillStyle = gradient;
    }
    ctx.fillRect(i * barWidth, barStartingPoint, barWidth, barHeight);
  }
}

onMounted(() => {
  canvas = document.getElementById("sortingCanvas");
  ctx = canvas.getContext("2d");
  width = canvas.width;
  height = canvas.height;

  randomizeArray();
  drawArray();
});

function setAlgorithm(value) {
  algorithm.value = parseInt(value);
}

async function playAlgo() {
  if (play.value) {
    play.value = false;
    return;
  }

  play.value = true;
  switch (algorithm.value) {
    case SortingAlgorithm.BubbleSort:
      bubbleSort();
      break;
    case SortingAlgorithm.SelectionSort:
      selectionSort();
      break;
    case SortingAlgorithm.InsertionSort:
      insertionSort();
      break;
    case SortingAlgorithm.MergeSort:
      await mergeSort();
      break;
    case SortingAlgorithm.QuickSort:
      quickSort();
      break;
    case SortingAlgorithm.HeapSort:
      heapSort();
      break;
  }
}

function regenerateArray() {
  randomizeArray();
  drawArray(0);
}

function reset() {
  array.value = [...originalArray.value];
  drawArray(0);
  play.value = false;
  playAlgo();
}
</script>
