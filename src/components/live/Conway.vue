<template>
  <div class="flex flex-column w-full h-full" @mousedown="beginDrag" @mouseup="endDrag">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll">
      <div class="conway-grid h-full w-full" id="conway-grid">
        <table class='conway-grid-inner' id='conway-grid-inner' :style="`height:${height}px; width:${width}px`">
          <tr v-for="i in cellPer" :key="i">
            <td
              v-for="j in cellPer"
              :key="j"
              :id="`con-${i-1}-${j-1}`"
              :class="{ alive: conwayGrid[i-1]?.[j-1]?.alive }"
              :style="`height:${cellHeight}px; width:${cellWidth}px`"
              @mousedown="mouseHandler(i-1, j-1)($event)"
              @mouseenter="mouseHandler(i-1, j-1)($event)"
            >
            </td>
          </tr>
        </table>
      </div>
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>Conway's Game of Life is a cellular automaton simulation where cells on a grid evolve based on simple rules, creating fascinating patterns and behaviors. It serves as a classic example of emergent complexity in a dynamic system.</p>
        <p>You can play the game by clicking any cell to 'activate' it. Once you activated all the cells you want, press play and watch the magic happen.</p>
        <p>You can also reset the game or shuffle it to have randomly activated cells. Check out the <a href="/project-files/conway">project</a> page for more details</p>
      </article>
      <div class="join">
        <div class="tooltip" :data-tip="play ? 'Pause' : 'Play'">
          <button class="btn btn-square join-item" @click="play = !play">
            <i v-if="!play" class="fa-solid fa-play"></i>
            <i v-else class="fa-solid fa-pause text-xl"></i>
          </button>
        </div>
        <div class="tooltip" data-tip="Randomize">
          <button class="btn btn-square join-item" @click="shuffleConway">
            <i class="fa-solid fa-shuffle text-xl"></i>
          </button>
        </div>
        <div class="tooltip" data-tip="Reset">
          <button class="btn btn-square join-item" @click="resetConway">
            <i class="fa-solid fa-rotate-right text-xl"></i>
          </button>
        </div>
        <div class="tooltip" data-tip="Github Repo">
          <button class="btn btn-square join-item" href="">
            <i class="fa-brands fa-github text-xl"></i>
          </button>
        </div>
      </div>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Speed</span>
        </div>
        <input
          type="range"
          min="200"
          max="1000"
          :value="delay"
          class="range"
          step="200"
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
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import FormSideBar from './FormSideBar.vue';

class ConwayCell {
  constructor(alive, td) {
    this.alive = alive;
    this.td = td;
  }
}

const aliveInitChance = ref(0.2);
const delay = ref(600);
const gridParent = ref(null);
const innerWidth = ref(0);
const width = ref(500);
const height = ref(500);
const cellPer = ref(50);
const cellWidth = ref(16);
const cellHeight = ref(0);
const play = ref(true);
const conwayGrid = ref([...Array(cellPer.value)].map(e => Array(cellPer.value)));
const isDrag = ref(false);

const beginDrag = () => {
  isDrag.value = true;
}

const endDrag = () => {
  isDrag.value = false;
}

const toggle = (r, c) => {
  conwayGrid.value[r][c].alive = !conwayGrid.value[r][c].alive;
}

const mouseHandler = (r, c) => (e) => {
  if (isDrag.value || e.type === 'mousedown') {
    toggle(r, c);
  }
}

onMounted(() => {
  width.value = document.getElementById("conway-grid").clientWidth;
  height.value = document.getElementById("conway-grid").clientHeight;

  cellWidth.value = Math.floor(width.value / cellPer.value);
  cellHeight.value = Math.floor(height.value / cellPer.value);

  playConway();
});

async function playConway() {
  if (!play.value) {
    setTimeout(playConway, delay.value);
    return;
  }

  let temp = [...Array(cellPer.value)].map(e => Array(cellPer.value));

  for (let row = 0; row < cellPer.value; row++) {
    for (let col = 0; col < cellPer.value; col++) {
      let count = countNeighbors(row, col);

      if (!conwayGrid.value[row][col].alive) {
        if (count == 3)
          temp[row][col] = true;
        else
          temp[row][col] = false;
      } else {
        if (count < 2 || count > 3)
          temp[row][col] = false;
        else
          temp[row][col] = true;
      }
    }
  }

  for (let row = 0; row < cellPer.value; row++) {
    for (let col = 0; col < cellPer.value; col++) {
      conwayGrid.value[row][col].alive = temp[row][col];
    }
  }

  await nextTick();

  setTimeout(function() {
    playConway();
  }, delay.value);
}

function countNeighbors(i, j) {
  let count = 0;
  if (i != 0 && j != 0 && conwayGrid.value[i - 1][j - 1].alive)
    count++;
  if (i != 0 && conwayGrid.value[i - 1][j].alive)
    count++;
  if (i != 0 && j != cellPer.value - 1 && conwayGrid.value[i - 1][j + 1].alive)
    count++;
  if (j != 0 && conwayGrid.value[i][j - 1].alive)
    count++;
  if (j != 0 && i != cellPer.value - 1 && conwayGrid.value[i + 1][j - 1].alive)
    count++;
  if (i != cellPer.value - 1 && j != cellPer.value - 1 && conwayGrid.value[i + 1][j + 1].alive)
    count++;
  if (i != cellPer.value - 1 && conwayGrid.value[i + 1][j].alive)
    count++;
  if (j != cellPer.value - 1 && conwayGrid.value[i][j + 1].alive)
    count++;

  if (i == 0 && conwayGrid.value[cellPer.value - 1][j].alive)
    count++;
  if (i == cellPer.value - 1 && conwayGrid.value[0][j].alive)
    count++;
  if (j == 0 && conwayGrid.value[i][cellPer.value - 1].alive)
    count++;
  if (j == cellPer.value - 1 && conwayGrid.value[i][0].alive)
    count++;

  return count;
}

function shuffleConway() {
  for (let row = 0; row < cellPer.value; row++) {
    for (let col = 0; col < cellPer.value; col++) {
      let alive = Math.random() < aliveInitChance.value ? true : false;
      conwayGrid.value[row][col].alive = alive;
    }
  }
}

function resetConway() {
  for (let row = 0; row < cellPer.value; row++) {
    for (let col = 0; col < cellPer.value; col++) {
      conwayGrid.value[row][col].alive = false;
    }
  }
}

function genGridItem(i, j) {
  let alive = Math.random() < aliveInitChance.value ? true : false;
  conwayGrid.value[i][j] = new ConwayCell(alive, `con-${i}-${j}`);
}

// Initialize grid
for (let i = 0; i < cellPer.value; i++) {
  for (let j = 0; j < cellPer.value; j++) {
    genGridItem(i, j);
  }
}
</script>
