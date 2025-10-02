<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll">
      <canvas id="boidsCanvas" class="w-full h-full" />
    </div>
    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          This is a simple implementation of the <a href="https://cs.stanford.edu/people/eroberts/courses/soco/projects/2008-09/modeling-natural-systems/boids.html">Boids</a> algorithm. The Boids algorithm is a simple algorithm that simulates the flocking behavior of birds. The algorithm is based on three simple rules: separation, alignment, and cohesion.</p>
        <p>The separation rule ensures that boids do not collide with each other, the alignment rule ensures that boids move in the same direction, and the cohesion rule ensures that boids stay close to each other.</p>
        <p>You can use the sliders below to adjust these values as well as the number of boids and how far they can see around them.</p>
        <p>Check out the <a href="/project-files/boids">project</a> page for more details.</p>
      </article>
      <label for="speed">Number of Boids</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="speed"
        name="speed"
        min="50"
        max="500"
        :value="boidCount"
        step="50"
        @input="e => setBoidCount(e.target.value)"
      >
      <label for="speed" class="block">{{ boidCount }}</label>

      <label for="speed">Sight Range</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="speed"
        name="speed"
        min="50"
        max="500"
        :value="boidSight"
        step="50"
        @input="e => boidSight = e.target.value"
      >
      <label for="speed" class="block">{{ boidSight }}</label>

      <label for="speed">Separation Factor</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="speed"
        name="speed"
        min="0.25"
        max="5"
        :value="separationWeight"
        step="0.25"
        @input="e => separationWeight = e.target.value"
      >
      <label for="speed" class="block">{{ separationWeight }}</label>

      <label for="generations">Alignment Factor</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="generations"
        name="generations"
        min="0.25"
        max="5"
        :value="alignmentWeight"
        step="0.25"
        @input="e => alignmentWeight = e.target.value"
      >
      <label for="generations" class="block">{{ alignmentWeight }}</label>

      <label for="generations">Cohesion Factor</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="generations"
        name="generations"
        min="0.25"
        max="5"
        :value="cohesionWeight"
        step="0.25"
        @input="e => cohesionWeight = e.target.value"
      >
      <label for="generations" class="block">{{ cohesionWeight }}</label>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormSideBar from './FormSideBar.vue';

let boidsCanvas;
let ctx;
const boids = ref([]);
const boidCount = ref(100);
const boidSpeed = ref(1);
const boidMinSpeed = ref(0.5);
const boidMaxSpeed = ref(2);
const boidSize = ref(10);
const boidSight = ref(100);
const separationWeight = ref(0.25);
const alignmentWeight = ref(0.25);
const cohesionWeight = ref(0.25);
let interval;

onMounted(() => {
  boidsCanvas = document.getElementById('boidsCanvas');
  ctx = boidsCanvas.getContext('2d');
  boidsCanvas.width = window.innerWidth;
  boidsCanvas.height = window.innerHeight;
  initBoids();
  drawBoids();

  interval = setInterval(() => {
    for (let i = 0; i < boids.value.length; i++) {
      moveBoid(boids.value[i]);
    }

    drawBoids();
  }, 1000 / 60);
});

class Boid {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.vx = dx;
    this.vy = dy;
  }
}

function initBoids() {
  for (let i = 0; i < boidCount.value; i++) {
    boids.value.push(new Boid(Math.random() * boidsCanvas.width, Math.random() * boidsCanvas.height, Math.random() * boidSpeed.value, Math.random() * boidSpeed.value));
  }
}

function moveBoid(boid) {
  let acceleration = calculateForces(boid);
  let velocity = { x: boid.vx, y: boid.vy };
  let dir = { x: 0, y: 0 };

  velocity.x += acceleration.x;
  velocity.y += acceleration.y;

  let speed = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
  dir.x = (velocity.x / speed);
  dir.y = (velocity.y / speed);
  speed = clamp(speed, boidMinSpeed.value, boidMaxSpeed.value);

  velocity.x = dir.x * speed;
  velocity.y = dir.y * speed;

  boid.vx = lerp(boid.vx, velocity.x, 0.1);
  boid.vy = lerp(boid.vy, velocity.y, 0.1);

  boid.x += boid.vx;
  boid.y += boid.vy;

  if (boid.x > boidsCanvas.width) {
    boid.x = 0;
  } else if (boid.x < 0) {
    boid.x = boidsCanvas.width;
  }

  if (boid.y > boidsCanvas.height) {
    boid.y = 0;
  } else if (boid.y < 0) {
    boid.y = boidsCanvas.height;
  }
}

function calculateForces(boid) {
  let separation = { x: 0, y: 0 };
  let alignment = { x: 0, y: 0 };
  let cohesion = { x: 0, y: 0 };
  let nearbyCount = 0;

  for (let i = 0; i < boids.value.length; i++) {
    if (boids.value[i] === boid) continue;

    let dx = boids.value[i].x - boid.x;
    let dy = boids.value[i].y - boid.y;

    if (Math.abs(dx) > boidsCanvas.width / 2) {
      dx = dx > 0 ? dx - boidsCanvas.width : dx + boidsCanvas.width;
    }
    if (Math.abs(dy) > boidsCanvas.height / 2) {
      dy = dy > 0 ? dy - boidsCanvas.height : dy + boidsCanvas.height;
    }

    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < boidSight.value) {
      separation.x += -dx / dist;
      separation.y += -dy / dist;
      alignment.x += boids.value[i].vx;
      alignment.y += boids.value[i].vy;
      cohesion.x += dx;
      cohesion.y += dy;
      nearbyCount++;
    }
  }

  if (nearbyCount > 0) {
    alignment.x /= nearbyCount;
    alignment.y /= nearbyCount;
    cohesion.x /= nearbyCount;
    cohesion.y /= nearbyCount;
  }

  let forces = { x: 0, y: 0 };
  forces.x += separation.x * separationWeight.value + alignment.x * alignmentWeight.value + cohesion.x * cohesionWeight.value;
  forces.y += separation.y * separationWeight.value + alignment.y * alignmentWeight.value + cohesion.y * cohesionWeight.value;

  return forces;
}

async function drawBoids() {
  ctx.clearRect(0, 0, boidsCanvas.width, boidsCanvas.height);
  for (let i = 0; i < boids.value.length; i++) {
    let angle = Math.atan2(boids.value[i].vy, boids.value[i].vx) + Math.PI;

    ctx.beginPath();
    ctx.moveTo(boids.value[i].x, boids.value[i].y);
    ctx.lineTo(boids.value[i].x + Math.cos(angle - Math.PI / 6) * 10, boids.value[i].y + Math.sin(angle - Math.PI / 6) * 10);
    ctx.lineTo(boids.value[i].x + Math.cos(angle + Math.PI / 6) * 10, boids.value[i].y + Math.sin(angle + Math.PI / 6) * 10);
    ctx.lineTo(boids.value[i].x, boids.value[i].y);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(boids.value[i].x, boids.value[i].y);
    ctx.lineTo(boids.value[i].x + boids.value[i].vx * 10, boids.value[i].y + boids.value[i].vy * 10);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }

  return 0;
}

function setBoidCount(count) {
  clearInterval(interval);

  boidCount.value = count;
  boids.value = [];
  initBoids();
  drawBoids();

  interval = setInterval(() => {
    for (let i = 0; i < boids.value.length; i++) {
      moveBoid(boids.value[i]);
    }

    drawBoids();
  }, 1000 / 60);

  return 0;
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
</script>
