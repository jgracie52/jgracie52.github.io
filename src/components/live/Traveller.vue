<template>
  <div class="flex flex-column w-full h-full">
    <div id="wrapper" class="w-full h-full max-h-[100vh] overflow-y-auto">
      <div class="px-4 py-16 mx-auto w-full md:px-24 lg:px-8 lg:py-4">
        <div class="grid row-gap-2 gap-8 sm:grid-cols-3">
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{{ bestDistanceOverall.toFixed(2) }} mi</h6>
            <p class="font-bold">Best Overall</p>
          </div>
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{{ bestDistanceGeneration.toFixed(2) }} mi</h6>
            <p class="font-bold">Best Of Generation</p>
          </div>
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{{ avgerageDistanceGeneration.toFixed(2) }} mi</h6>
            <p class="font-bold">Average of Generation</p>
          </div>
        </div>
        <div class="grid row-gap-2 gap-8 sm:grid-cols-1">
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{{ generation }}</h6>
            <p class="font-bold">Generation</p>
          </div>
        </div>
      </div>

      <div class="w-full px-4 pb-8">
        <!-- Main map and metrics chart in responsive grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Best Route Map -->
          <div class="flex flex-col">
            <h2 class="text-xl font-bold mb-3 text-center">Best Route</h2>
            <div id="map-wrapper" class="w-full h-[400px] lg:h-[500px]">
              <div id="map" class="w-full h-full rounded-lg shadow-lg"></div>
            </div>
          </div>

          <!-- Metrics Chart -->
          <div class="flex flex-col">
            <h2 class="text-xl font-bold mb-3 text-center">Performance Metrics</h2>
            <div class="w-full h-[400px] lg:h-[500px] rounded-lg shadow-lg bg-white p-4 relative">
              <canvas id="metricsChart"></canvas>
              <!-- Loading overlay -->
              <div v-if="isRunning" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                <div class="text-center">
                  <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p class="text-lg font-semibold text-gray-700">Running Generation {{ generation }}</p>
                  <p class="text-sm text-gray-500">Chart will update when complete...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl lg:text-3xl font-bold mb-4 text-center">Top 5 Routes</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div v-for="(chromosome, index) in topChromosomes" :key="index" class="flex flex-col">
            <div class="text-center mb-2">
              <p class="font-bold">Rank {{ index + 1 }}</p>
              <p class="text-sm">{{ chromosome.fitness?.toFixed(2) }} mi</p>
            </div>
            <div :id="'mini-map-' + index" class="w-full h-[200px] rounded-lg shadow-md"></div>
          </div>
        </div>
      </div>
    </div>

    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>The genetic algorithm will attempt to find the shortest path that visits all the cities in the dataset. The genetic algorithm will run for the specified number of generations. The genetic algorithm will use the specified mutation rate, crossover rate, speed, tournament size, species size, and population size.</p>
        <p>You can adjust each parameter of the algorithm with the sliders below to try to find the optimal solution. Remember to lock the random seed when experimenting.</p>
        <p>More details on the project can be found on the <a href="/project-files/traveller">project</a> page</p>
      </article>
      <label for="speed">Speed</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="speed"
        name="speed"
        min="1"
        max="100"
        value="100"
        @input="e => speedFactor = e.target.value"
      >
      <label for="speed" class="block">{{ speedFactor }}</label>

      <label for="generations">Generations</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="generations"
        name="generations"
        min="100"
        max="2000"
        :value="numGenerations"
        step="100"
        @input="e => numGenerations = e.target.value"
      >
      <label for="generations" class="block">{{ numGenerations }}</label>

      <label for="mutation">Mutation Rate</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="mutation"
        name="mutation"
        min="1"
        max="10"
        :value="mutationRate * 100"
        step="0.5"
        @input="e => mutationRate = e.target.value / 100"
      >
      <label for="mutation" class="block">{{ mutationRate.toFixed(3) }}</label>

      <label for="crossover">Crossover Rate</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="crossover"
        name="crossover"
        min="50"
        max="95"
        :value="crossoverRate * 100"
        step="5"
        @input="e => crossoverRate = e.target.value / 100"
      >
      <label for="crossover" class="block">{{ crossoverRate.toFixed(2) }}</label>

      <label for="species">Species</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="species"
        name="species"
        min="1"
        max="10"
        :value="speciesSize"
        @input="e => speciesSize = e.target.value"
      >
      <label for="species" class="block">{{ speciesSize }}</label>

      <label for="tournament">Tournament Size</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="tournament"
        name="tournament"
        min="2"
        max="10"
        :value="tournamentSize"
        @input="e => tournamentSize = e.target.value"
      >
      <label for="tournament" class="block">{{ tournamentSize }}</label>

      <label for="population">Population</label>
      <input
        class="range range-xs range-primary"
        type="range"
        id="population"
        name="population"
        min="50"
        max="500"
        :value="populationSize"
        step="50"
        @input="e => populationSize = e.target.value"
      >
      <label for="population" class="block">{{ populationSize }}</label>

      <label for="seed">Random Seed</label>
      <input
        class="input input-bordered input-primary"
        type="text"
        id="seed"
        name="seed"
        :value="randomSeed"
        @input="e => randomSeed = e.target.value"
      >
      <label for="lockSeed">Lock Seed</label>
      <input
        class="checkbox checkbox-primary block mb-2"
        type="checkbox"
        id="lockSeed"
        name="lockSeed"
        @change="e => lockSeed = e.target.checked"
      >

      <button class="btn btn-primary" @click="resetAndRunGeneticAlgorithm">Run</button>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import FormSideBar from './FormSideBar.vue';
import { GeneticAlgorithm } from '../helper/GeneticAlgorithm';
import * as att48 from '../data/att48_xy.json';

let map;
let routeLayer;
let markersLayer;
let miniMaps = [];
let miniMapLayers = [];
let L;
let metricsChart;

const bestDistanceOverall = ref(0);
const bestDistanceGeneration = ref(0);
const avgerageDistanceGeneration = ref(0);
const generation = ref(0);
const topChromosomes = ref([]);
const isRunning = ref(false);

// Metrics history for charting
const metricsHistory = ref({
  generations: [],
  bestOverall: [],
  bestGeneration: [],
  avgGeneration: [],
  diversity: []
});

const numGenerations = ref(500);
const numCities = ref(48);
const mutationRate = ref(0.02);
const crossoverRate = ref(0.8);
const speedFactor = ref(100);
const tournamentSize = ref(5);
const speciesSize = ref(3);
const populationSize = ref(200);
const randomSeed = ref(0);
const lockSeed = ref(false);

let geneticAlgorithm;

function updateMetrics() {
  // Just update current generation metrics - no charting during run
  bestDistanceOverall.value = geneticAlgorithm.bestDistanceOverall;
  bestDistanceGeneration.value = geneticAlgorithm.bestDistanceGeneration;
  avgerageDistanceGeneration.value = geneticAlgorithm.avgerageDistanceGeneration;
  generation.value = geneticAlgorithm.generation;
}

function updateChart(bestChromosome, top5Chromosomes) {
  if (!map || !routeLayer) return;

  // Only update main map every 5 generations for performance
  const shouldUpdateMap = !geneticAlgorithm.generation || geneticAlgorithm.generation % 5 === 0;

  if (shouldUpdateMap) {
    // Update main map with best chromosome
    routeLayer.clearLayers();

    var coordinates = [];
    for (var i = 0; i < bestChromosome.genes.length; i++) {
      var cityName = geneticAlgorithm.cityIndexes[bestChromosome.genes[i]];
      var cityData = att48.att48.latlng[cityName];
      if (cityData) {
        coordinates.push([cityData.lat, cityData.lng]);
      }
    }

    if (coordinates.length > 0) {
      var firstCityName = geneticAlgorithm.cityIndexes[bestChromosome.genes[0]];
      var firstCity = att48.att48.latlng[firstCityName];
      if (firstCity) {
        coordinates.push([firstCity.lat, firstCity.lng]);
      }
    }

    if (coordinates.length > 0) {
      L.polyline(coordinates, {
        color: '#9234ea',
        weight: 2,
        opacity: 0.8
      }).addTo(routeLayer);
    }
  }

  // Update top chromosomes and mini maps every 10 generations
  if (top5Chromosomes && geneticAlgorithm.generation % 10 === 0) {
    topChromosomes.value = top5Chromosomes;
    updateMiniMaps(top5Chromosomes);
  }
}

function updateMiniMaps(chromosomes) {
  if (!L || miniMaps.length === 0) return;

  chromosomes.forEach((chromosome, index) => {
    if (!miniMapLayers[index]) return;

    // Clear existing route
    miniMapLayers[index].clearLayers();

    // Build route coordinates
    var coordinates = [];
    for (var i = 0; i < chromosome.genes.length; i++) {
      var cityName = geneticAlgorithm.cityIndexes[chromosome.genes[i]];
      var cityData = att48.att48.latlng[cityName];
      if (cityData) {
        coordinates.push([cityData.lat, cityData.lng]);
      }
    }

    // Close the loop
    if (coordinates.length > 0) {
      var firstCityName = geneticAlgorithm.cityIndexes[chromosome.genes[0]];
      var firstCity = att48.att48.latlng[firstCityName];
      if (firstCity) {
        coordinates.push([firstCity.lat, firstCity.lng]);
      }
    }

    // Draw route on mini map
    if (coordinates.length > 0) {
      L.polyline(coordinates, {
        color: '#9234ea',
        weight: 1.5,
        opacity: 0.8
      }).addTo(miniMapLayers[index]);
    }
  });
}

function updateParameters() {
  geneticAlgorithm.numGenerations = numGenerations.value;
  geneticAlgorithm.numCities = numCities.value;
  geneticAlgorithm.mutationRate = mutationRate.value;
  geneticAlgorithm.crossoverRate = crossoverRate.value;
  geneticAlgorithm.speedFactor = speedFactor.value;
  geneticAlgorithm.tournamentSize = tournamentSize.value;
  geneticAlgorithm.numSpecies = speciesSize.value;
  geneticAlgorithm.populationSize = populationSize.value;

  if (!lockSeed.value) {
    randomSeed.value = Math.floor(Math.random() * 1000000);
  }

  geneticAlgorithm.randomSeed = randomSeed.value;
}

function updateMetricsChart() {
  if (!metricsChart) return;

  try {
    // Use requestAnimationFrame to batch updates and avoid stack overflow
    requestAnimationFrame(() => {
      metricsChart.data.labels = metricsHistory.value.generations;
      metricsChart.data.datasets[0].data = metricsHistory.value.bestOverall;
      metricsChart.data.datasets[1].data = metricsHistory.value.bestGeneration;
      metricsChart.data.datasets[2].data = metricsHistory.value.avgGeneration;
      metricsChart.data.datasets[3].data = metricsHistory.value.diversity;
      metricsChart.update('none'); // 'none' mode = no animation for better performance
    });
  } catch (e) {
    console.error('Chart update error:', e);
  }
}

async function resetAndRunGeneticAlgorithm() {
  if (geneticAlgorithm.running) {
    geneticAlgorithm.abort = true;
    while (geneticAlgorithm.abort) {
      await geneticAlgorithm.sleep(100);
    }
  }

  updateParameters();

  // Clear metrics history
  metricsHistory.value = {
    generations: [],
    bestOverall: [],
    bestGeneration: [],
    avgGeneration: [],
    diversity: []
  };

  geneticAlgorithm.metricsHistory = {
    generations: [],
    bestOverall: [],
    bestGeneration: [],
    avgGeneration: [],
    diversity: []
  };

  geneticAlgorithm.bestDistanceOverall = Number.MAX_VALUE;
  geneticAlgorithm.generation = 0;
  geneticAlgorithm.running = true;
  isRunning.value = true;

  await geneticAlgorithm.runGeneticAlgorithm();

  // Update chart with final metrics history
  isRunning.value = false;
  metricsHistory.value = geneticAlgorithm.metricsHistory;
  updateMetricsChart();
}

onMounted(async () => {
  // Dynamic import for Leaflet to avoid SSR issues
  L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');

  // Dynamic import for Chart.js
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  geneticAlgorithm = new GeneticAlgorithm(updateChart, updateMetrics);

  // Initialize metrics chart
  const chartCtx = document.getElementById('metricsChart').getContext('2d');
  metricsChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Best Overall (mi)',
          data: [],
          borderColor: '#9234ea',
          backgroundColor: 'rgba(146, 52, 234, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Best Generation (mi)',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Avg Generation (mi)',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Diversity (edges)',
          data: [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6
          }
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Generation'
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Distance (miles)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Diversity (avg edge diff)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });

  // Initialize main map
  map = L.map('map').setView([39.8283, -98.5795], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  Object.entries(att48.att48.latlng).forEach(([cityName, coords]) => {
    L.circleMarker([coords.lat, coords.lng], {
      radius: 4,
      fillColor: '#9234ea',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
      .bindTooltip(cityName, { permanent: false, direction: 'top' })
      .addTo(markersLayer);
  });

  // Initialize 5 mini maps - need to populate topChromosomes first for v-for to render
  topChromosomes.value = [
    { genes: [], fitness: 0 },
    { genes: [], fitness: 0 },
    { genes: [], fitness: 0 },
    { genes: [], fitness: 0 },
    { genes: [], fitness: 0 }
  ];

  // Wait for DOM to render the mini map containers
  await nextTick();

  for (let i = 0; i < 5; i++) {
    const mapElement = document.getElementById('mini-map-' + i);
    if (!mapElement) {
      console.error('Mini map element not found:', 'mini-map-' + i);
      continue;
    }

    const miniMap = L.map('mini-map-' + i, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    }).setView([39.8283, -98.5795], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19
    }).addTo(miniMap);

    const miniRouteLayer = L.layerGroup().addTo(miniMap);
    const miniMarkersLayer = L.layerGroup().addTo(miniMap);

    // Add city markers to mini map
    Object.entries(att48.att48.latlng).forEach(([cityName, coords]) => {
      L.circleMarker([coords.lat, coords.lng], {
        radius: 2,
        fillColor: '#9234ea',
        color: '#fff',
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.6
      }).addTo(miniMarkersLayer);
    });

    miniMaps.push(miniMap);
    miniMapLayers.push(miniRouteLayer);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
  }
  miniMaps.forEach(miniMap => {
    if (miniMap) {
      miniMap.remove();
    }
  });
});
</script>
