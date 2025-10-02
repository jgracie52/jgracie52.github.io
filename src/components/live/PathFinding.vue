<template>
  <div class="flex flex-column w-full h-full" @mousedown="beginDrag" @mouseup="endDrag">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll">
      <div class="pathfinding-grid h-full w-full" id="pathfinding-grid">
        <table class='pathfinding-grid-inner' id='pathfinding-grid-inner' :style="`height:${height}px; width:${width}px`">
          <tr v-for="i in gridSize" :key="i">
            <td
              v-for="j in gridSize"
              :key="j"
              :id="`cell-${i-1}-${j-1}`"
              :class="{
                wall: grid[i-1]?.[j-1] === CellType.Wall,
                start: grid[i-1]?.[j-1] === CellType.Start,
                end: grid[i-1]?.[j-1] === CellType.End,
                ghost: grid[i-1]?.[j-1] === CellType.Ghost,
                explored: grid[i-1]?.[j-1] === CellType.Explored,
                path: grid[i-1]?.[j-1] === CellType.Path
              }"
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
        <p>
          Click and drag on the grid to place objects. Use the controls below to switch between placing start points, end points, or walls.
        </p>
        <p>
          Once you've set up your grid, select an algorithm and click Play to watch the pathfinding algorithm find the shortest path!
        </p>
      </article>

      <div class="flex flex-col gap-2">
        <!-- Control Buttons -->
        <div class="join w-full">
          <div class="tooltip" :data-tip="isRunning ? 'Pause' : 'Play'">
            <button class="btn btn-square join-item" @click="playAlgo" :disabled="!startCell || !endCell">
              <i v-if="!isRunning" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-pause text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Randomize">
            <button class="btn btn-square join-item" @click="randomizeGrid">
              <i class="fa-solid fa-shuffle text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Clear Grid">
            <button class="btn btn-square join-item" @click="clearGrid">
              <i class="fa-solid fa-trash text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Reset Path">
            <button class="btn btn-square join-item" @click="resetPath">
              <i class="fa-solid fa-rotate-right text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Drawing Mode -->
        <label>Drawing Mode</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="btn btn-sm"
            :class="{ 'btn-primary': drawMode === 'start' }"
            @click="drawMode = 'start'"
          >
            Start
          </button>
          <button
            class="btn btn-sm"
            :class="{ 'btn-primary': drawMode === 'end' }"
            @click="drawMode = 'end'"
          >
            End
          </button>
          <button
            class="btn btn-sm"
            :class="{ 'btn-primary': drawMode === 'wall' }"
            @click="drawMode = 'wall'"
          >
            Wall
          </button>
          <button
            class="btn btn-sm"
            :class="{ 'btn-primary': drawMode === 'erase' }"
            @click="drawMode = 'erase'"
          >
            Erase
          </button>
        </div>

        <!-- Speed Control -->
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Speed</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            v-model="delay"
            class="range"
            step="50"
          />
          <div class="w-full flex justify-between text-xs px-2">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </label>

        <!-- Grid Size -->
        <label for="gridSize">Grid Size: {{ gridSize }}x{{ gridSize }}</label>
        <input
          class="range range-xs range-primary"
          type="range"
          id="gridSize"
          name="gridSize"
          min="10"
          max="50"
          v-model="gridSize"
          step="5"
          @input="initializeGrid"
        >

        <!-- Algorithm Selection -->
        <label for="algorithm">Pathfinding Algorithm</label>
        <select
          class="select select-bordered select-sm w-full mb-4"
          id="algorithm"
          name="algorithm"
          v-model="algorithm"
        >
          <option :value="PathfindingAlgorithm.AStar">A* (A-Star)</option>
          <option :value="PathfindingAlgorithm.Dijkstra">Dijkstra's Algorithm</option>
          <option :value="PathfindingAlgorithm.BFS">Breadth-First Search</option>
        </select>

        <!-- Metrics -->
        <div class="stats stats-vertical shadow bg-base-200">
          <div class="stat">
            <div class="stat-title">Nodes Explored</div>
            <div class="stat-value text-primary">{{ nodesExplored }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Path Length</div>
            <div class="stat-value text-secondary">{{ pathLength }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Time (ms)</div>
            <div class="stat-value text-accent">{{ executionTime }}</div>
          </div>
        </div>
      </div>

      <article class="prose mb-4 mt-4">
        <template v-if="algorithm === PathfindingAlgorithm.AStar">
          <h2>A* Algorithm</h2>
          <p>
            A* is a best-first search algorithm that finds the shortest path between two points. It uses a heuristic function to estimate the cost to reach the goal, making it more efficient than Dijkstra's algorithm.
          </p>
        </template>
        <template v-if="algorithm === PathfindingAlgorithm.Dijkstra">
          <h2>Dijkstra's Algorithm</h2>
          <p>
            Dijkstra's algorithm finds the shortest path from a start node to all other nodes in a weighted graph. It guarantees the shortest path but explores more nodes than A*.
          </p>
        </template>
        <template v-if="algorithm === PathfindingAlgorithm.BFS">
          <h2>Breadth-First Search</h2>
          <p>
            BFS explores all neighbors at the current depth before moving to nodes at the next depth level. It guarantees the shortest path in unweighted graphs.
          </p>
        </template>
      </article>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';

const PathfindingAlgorithm = {
  AStar: 0,
  Dijkstra: 1,
  BFS: 2,
};

const CellType = {
  Empty: 0,
  Wall: 1,
  Start: 2,
  End: 3,
  Path: 4,
  Explored: 5,
  Ghost: 6,
};

const width = ref(500);
const height = ref(500);
const cellWidth = ref(16);
const cellHeight = ref(16);

const grid = ref([]);
const gridSize = ref(30);
const algorithm = ref(PathfindingAlgorithm.AStar);
const isRunning = ref(false);
const delay = ref(50);
const drawMode = ref('start');
const isDrag = ref(false);

// Cell references
const startCell = ref(null);
const endCell = ref(null);

// Metrics
const nodesExplored = ref(0);
const pathLength = ref(0);
const executionTime = ref(0);

const beginDrag = () => {
  isDrag.value = true;
};

const endDrag = () => {
  isDrag.value = false;
};

function initializeGrid() {
  grid.value = [];
  for (let row = 0; row < gridSize.value; row++) {
    grid.value[row] = [];
    for (let col = 0; col < gridSize.value; col++) {
      grid.value[row][col] = CellType.Empty;
    }
  }
  startCell.value = null;
  endCell.value = null;
  resetMetrics();
}

function clearGrid() {
  initializeGrid();
}

function randomizeGrid() {
  // Clear current grid
  initializeGrid();

  // Place random start and end
  const startRow = Math.floor(Math.random() * gridSize.value);
  const startCol = Math.floor(Math.random() * gridSize.value);
  grid.value[startRow][startCol] = CellType.Start;
  startCell.value = { row: startRow, col: startCol };

  let endRow, endCol;
  do {
    endRow = Math.floor(Math.random() * gridSize.value);
    endCol = Math.floor(Math.random() * gridSize.value);
  } while (endRow === startRow && endCol === startCol);

  grid.value[endRow][endCol] = CellType.End;
  endCell.value = { row: endRow, col: endCol };

  // Add random walls (20% density) but ensure path exists
  // We use a simple approach: add walls randomly but not on start/end
  const wallDensity = 0.2;
  const totalCells = gridSize.value * gridSize.value;
  const targetWalls = Math.floor(totalCells * wallDensity);

  let wallsAdded = 0;
  const maxAttempts = targetWalls * 3; // Prevent infinite loop
  let attempts = 0;

  while (wallsAdded < targetWalls && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * gridSize.value);
    const col = Math.floor(Math.random() * gridSize.value);

    // Don't place wall on start, end, or existing wall
    if (grid.value[row][col] === CellType.Empty) {
      // Temporarily place wall
      grid.value[row][col] = CellType.Wall;

      // Check if path still exists using BFS
      if (hasPath()) {
        wallsAdded++;
      } else {
        // Remove wall if it blocks the path
        grid.value[row][col] = CellType.Empty;
      }
    }
  }
}

function hasPath() {
  // Simple BFS to check if path exists
  const queue = [startCell.value];
  const visited = new Set();
  const cellKey = (cell) => `${cell.row},${cell.col}`;
  visited.add(cellKey(startCell.value));

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.row === endCell.value.row && current.col === endCell.value.col) {
      return true;
    }

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(cellKey(neighbor))) {
        visited.add(cellKey(neighbor));
        queue.push(neighbor);
      }
    }
  }

  return false;
}

function resetPath() {
  // Keep walls, start, and end, but clear path data
  for (let row = 0; row < gridSize.value; row++) {
    for (let col = 0; col < gridSize.value; col++) {
      if (grid.value[row][col] === CellType.Path ||
          grid.value[row][col] === CellType.Explored ||
          grid.value[row][col] === CellType.Ghost) {
        grid.value[row][col] = CellType.Empty;
      }
    }
  }
  resetMetrics();
}

function resetMetrics() {
  nodesExplored.value = 0;
  pathLength.value = 0;
  executionTime.value = 0;
}

const mouseHandler = (r, c) => (e) => {
  if (isRunning.value) return;

  if (isDrag.value || e.type === 'mousedown') {
    // Clear path data when modifying grid
    if (nodesExplored.value > 0) {
      resetPath();
    }

    if (drawMode.value === 'start') {
      // Remove old start
      if (startCell.value) {
        grid.value[startCell.value.row][startCell.value.col] = CellType.Empty;
      }
      grid.value[r][c] = CellType.Start;
      startCell.value = { row: r, col: c };
    } else if (drawMode.value === 'end') {
      // Remove old end
      if (endCell.value) {
        grid.value[endCell.value.row][endCell.value.col] = CellType.Empty;
      }
      grid.value[r][c] = CellType.End;
      endCell.value = { row: r, col: c };
    } else if (drawMode.value === 'wall') {
      if (grid.value[r][c] === CellType.Empty) {
        grid.value[r][c] = CellType.Wall;
      }
    } else if (drawMode.value === 'erase') {
      if (grid.value[r][c] === CellType.Wall) {
        grid.value[r][c] = CellType.Empty;
      } else if (grid.value[r][c] === CellType.Start) {
        grid.value[r][c] = CellType.Empty;
        startCell.value = null;
      } else if (grid.value[r][c] === CellType.End) {
        grid.value[r][c] = CellType.Empty;
        endCell.value = null;
      }
    }
  }
};

onMounted(() => {
  width.value = document.getElementById("pathfinding-grid").clientWidth;
  height.value = document.getElementById("pathfinding-grid").clientHeight;

  cellWidth.value = Math.floor(width.value / gridSize.value);
  cellHeight.value = Math.floor(height.value / gridSize.value);

  initializeGrid();
});

async function playAlgo() {
  if (isRunning.value) {
    isRunning.value = false;
    return;
  }

  if (!startCell.value || !endCell.value) {
    return;
  }

  resetPath();
  isRunning.value = true;
  const startTime = performance.now();

  switch (algorithm.value) {
    case PathfindingAlgorithm.AStar:
      await aStar();
      break;
    case PathfindingAlgorithm.Dijkstra:
      await dijkstra();
      break;
    case PathfindingAlgorithm.BFS:
      await bfs();
      break;
  }

  executionTime.value = Math.round(performance.now() - startTime);
  isRunning.value = false;
}

function heuristic(a, b) {
  // Manhattan distance
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function getNeighbors(cell) {
  const neighbors = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const dir of directions) {
    const newRow = cell.row + dir.row;
    const newCol = cell.col + dir.col;

    if (newRow >= 0 && newRow < gridSize.value && newCol >= 0 && newCol < gridSize.value) {
      const cellType = grid.value[newRow][newCol];
      if (cellType !== CellType.Wall) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }
  }

  return neighbors;
}

async function aStar() {
  const openSet = [startCell.value];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const cellKey = (cell) => `${cell.row},${cell.col}`;

  gScore.set(cellKey(startCell.value), 0);
  fScore.set(cellKey(startCell.value), heuristic(startCell.value, endCell.value));

  while (openSet.length > 0 && isRunning.value) {
    // Find node with lowest fScore
    openSet.sort((a, b) => {
      const scoreA = fScore.get(cellKey(a));
      const scoreB = fScore.get(cellKey(b));
      return (scoreA !== undefined ? scoreA : Infinity) - (scoreB !== undefined ? scoreB : Infinity);
    });
    const current = openSet.shift();

    if (current.row === endCell.value.row && current.col === endCell.value.col) {
      await reconstructPath(cameFrom, current);
      return;
    }

    // Mark as explored
    if (grid.value[current.row][current.col] !== CellType.Start &&
        grid.value[current.row][current.col] !== CellType.End) {
      grid.value[current.row][current.col] = CellType.Explored;
      nodesExplored.value++;
    }

    await sleep(delay.value);

    const neighbors = getNeighbors(current);
    const currentGScore = gScore.get(cellKey(current));

    for (const neighbor of neighbors) {
      const tentativeGScore = (currentGScore !== undefined ? currentGScore : Infinity) + 1;
      const neighborGScore = gScore.get(cellKey(neighbor));

      if (tentativeGScore < (neighborGScore !== undefined ? neighborGScore : Infinity)) {
        cameFrom.set(cellKey(neighbor), current);
        gScore.set(cellKey(neighbor), tentativeGScore);
        fScore.set(cellKey(neighbor), tentativeGScore + heuristic(neighbor, endCell.value));

        if (!openSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
          openSet.push(neighbor);
          // Mark as ghost (in open set but not explored yet)
          if (grid.value[neighbor.row][neighbor.col] !== CellType.Start &&
              grid.value[neighbor.row][neighbor.col] !== CellType.End) {
            grid.value[neighbor.row][neighbor.col] = CellType.Ghost;
          }
        }
      }
    }
  }
}

async function dijkstra() {
  const openSet = [startCell.value];
  const cameFrom = new Map();
  const distance = new Map();

  const cellKey = (cell) => `${cell.row},${cell.col}`;

  distance.set(cellKey(startCell.value), 0);

  while (openSet.length > 0 && isRunning.value) {
    // Find node with lowest distance
    openSet.sort((a, b) => {
      const distA = distance.get(cellKey(a));
      const distB = distance.get(cellKey(b));
      return (distA !== undefined ? distA : Infinity) - (distB !== undefined ? distB : Infinity);
    });
    const current = openSet.shift();

    if (current.row === endCell.value.row && current.col === endCell.value.col) {
      await reconstructPath(cameFrom, current);
      return;
    }

    if (grid.value[current.row][current.col] !== CellType.Start &&
        grid.value[current.row][current.col] !== CellType.End) {
      grid.value[current.row][current.col] = CellType.Explored;
      nodesExplored.value++;
    }

    await sleep(delay.value);

    const neighbors = getNeighbors(current);
    const currentDistance = distance.get(cellKey(current));
    for (const neighbor of neighbors) {
      const tentativeDistance = (currentDistance !== undefined ? currentDistance : Infinity) + 1;
      const neighborDistance = distance.get(cellKey(neighbor));

      if (tentativeDistance < (neighborDistance !== undefined ? neighborDistance : Infinity)) {
        cameFrom.set(cellKey(neighbor), current);
        distance.set(cellKey(neighbor), tentativeDistance);

        if (!openSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
          openSet.push(neighbor);
          if (grid.value[neighbor.row][neighbor.col] !== CellType.Start &&
              grid.value[neighbor.row][neighbor.col] !== CellType.End) {
            grid.value[neighbor.row][neighbor.col] = CellType.Ghost;
          }
        }
      }
    }
  }
}

async function bfs() {
  const queue = [startCell.value];
  const visited = new Set();
  const cameFrom = new Map();

  const cellKey = (cell) => `${cell.row},${cell.col}`;
  visited.add(cellKey(startCell.value));

  while (queue.length > 0 && isRunning.value) {
    const current = queue.shift();

    if (current.row === endCell.value.row && current.col === endCell.value.col) {
      await reconstructPath(cameFrom, current);
      return;
    }

    if (grid.value[current.row][current.col] !== CellType.Start &&
        grid.value[current.row][current.col] !== CellType.End) {
      grid.value[current.row][current.col] = CellType.Explored;
      nodesExplored.value++;
    }

    await sleep(delay.value);

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(cellKey(neighbor))) {
        visited.add(cellKey(neighbor));
        cameFrom.set(cellKey(neighbor), current);
        queue.push(neighbor);

        if (grid.value[neighbor.row][neighbor.col] !== CellType.Start &&
            grid.value[neighbor.row][neighbor.col] !== CellType.End) {
          grid.value[neighbor.row][neighbor.col] = CellType.Ghost;
        }
      }
    }
  }
}

async function reconstructPath(cameFrom, current) {
  const path = [];
  const cellKey = (cell) => `${cell.row},${cell.col}`;

  // Build path from end to start, then reverse
  let temp = current;
  while (cameFrom.has(cellKey(temp))) {
    path.push(temp);
    temp = cameFrom.get(cellKey(temp));
  }
  path.push(temp); // Add the start cell
  path.reverse();

  // Draw path with animation (excluding start and end)
  for (let i = 1; i < path.length - 1; i++) {
    const cell = path[i];
    grid.value[cell.row][cell.col] = CellType.Path;
    await sleep(delay.value / 2);
  }

  pathLength.value = path.length - 1; // Distance from start to end
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
</script>

<style scoped>
#pathfinding-grid {
  width: 100%;
  margin-bottom: 15px;
}

.pathfinding-grid-inner {
  table-layout: fixed;
  width: 100%;
  margin: auto;
}

.pathfinding-grid-inner tr td {
  background-color: #232934e0;
  border: 1px solid #2a303c;
  cursor: pointer;
}

.wall {
  background-color: #e0e0e0 !important;
}

.start {
  background-color: #16a085 !important;
}

.end {
  background-color: #e74c3c !important;
}

.ghost {
  background-color: hsl(287 60% 65% / 0.3) !important;
}

.explored {
  background-color: hsl(287 60% 65% / 0.6) !important;
}

.path {
  background-color: hsl(287 60% 65%) !important;
}
</style>
