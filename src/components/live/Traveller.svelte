<svelte:head>	
	<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2/dist/tailwind.min.css" rel="stylesheet" type="text/css" />
    <link href="https://cdn.jsdelivr.net/npm/daisyui@2.51.5/dist/full.css" rel="stylesheet" type="text/css" />
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import { Chart } from 'chart.js/auto';
    import { GeneticAlgorithm } from '../helper/GeneticAlgorithm';
    import * as att48 from '../data/att48_xy.json';

    var geneticAlgorithm = new GeneticAlgorithm(updateChart, updateMetrics);

    // Metrics to display in the UI
    var bestDistanceOverall = 0;
    var bestDistanceGeneration = 0;
    var avgerageDistanceGeneration = 0;
    var generation = 0;

    // Parameters for the genetic algorithm
    var numGenerations = 100;
    var numCities = 48;
    var mutationRate = 0.01;
    var crossoverRate = 0.7;
    var speedFactor = 100;
    var tournamentSize = 5;
    var speciesSize = 1;
    var populationSize = 100;
    $:randomSeed = 0;
    var lockSeed = false;

    // Function to update the parameters for the genetic algorithm
    function updateParameters(){
        geneticAlgorithm.numGenerations = numGenerations;
        geneticAlgorithm.numCities = numCities;
        geneticAlgorithm.mutationRate = mutationRate;
        geneticAlgorithm.crossoverRate = crossoverRate;
        geneticAlgorithm.speedFactor = speedFactor;
        geneticAlgorithm.tournamentSize = tournamentSize;
        geneticAlgorithm.numSpecies = speciesSize;
        geneticAlgorithm.populationSize = populationSize;

        if (!lockSeed){
            randomSeed = Math.floor(Math.random() * 1000000);
        }

        geneticAlgorithm.randomSeed = randomSeed;
    }

    // Function to update the metrics from the genetic algorithm
    function updateMetrics(){
        bestDistanceOverall = geneticAlgorithm.bestDistanceOverall;
        bestDistanceGeneration = geneticAlgorithm.bestDistanceGeneration;
        avgerageDistanceGeneration = geneticAlgorithm.avgerageDistanceGeneration;
        generation = geneticAlgorithm.generation;
    }

    // Function to update the chart with the best chromosome
    function updateChart(chromosome) {
        var data = [];
        var labels = [];
        for (var i = 0; i < chromosome.genes.length; i++) {
            var city = att48.att48.tsplib[geneticAlgorithm.cityNumberIndexes[chromosome.genes[i]]];
            data.push({x: city.x, y: city.y});
            labels.push(geneticAlgorithm.cityIndexes[chromosome.genes[i]]);
        }
        var city = att48.att48.tsplib[geneticAlgorithm.cityNumberIndexes[chromosome.genes[0]]];
        data.push({x: city.x, y: city.y});
        labels.push(geneticAlgorithm.cityIndexes[chromosome.genes[0]]);

        // Clear the chart data
        chart.data.datasets.forEach((dataset) => {
            // Add the new data
            dataset.data = data;
        });
        chart.data.labels = labels;
        chart.update();
    }

    // Function to reset and run the genetic algorithm
    async function resetAndRunGeneticAlgorithm() {
        // Abort the genetic algorithm if it is running
        if (geneticAlgorithm.running) {
            geneticAlgorithm.abort = true;
            // Wait for the genetic algorithm to stop
            while (geneticAlgorithm.abort) {
                await geneticAlgorithm.sleep(100);
            }
        }

        // Update the parameters
        updateParameters();

        geneticAlgorithm.bestDistanceOverall = Number.MAX_VALUE;
        geneticAlgorithm.generation = 0;
        geneticAlgorithm.running = true;
        await geneticAlgorithm.runGeneticAlgorithm();
    }

    let ctx;
    let chart;
    onMount(async () => {
        ctx = document.getElementById('ctx').getContext('2d');
        chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                labels: [],
                datasets: [{
                    label: "Cities",
                    data: [],
                    borderColor: 'black',
                    name: 'Cities',
                    borderWidth: 1,
                    pointBackgroundColor: ['#9234ea'],
                    pointBorderColor: ['#9234ea'],
                    pointRadius: 2,
                    pointHoverRadius: 2,
                    fill: false,
                    tension: 0,
                    showLine: true
                }]
            },
            options: {
                legend: false,
                tooltips: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        title: {
                        display: false,
                        },
                        min: 0,
                        max: 8000,
                        ticks: {
                        // forces step size to be 50 units
                        stepSize: 50
                        }
                    },
                    y: {
                        title: {
                        display: false,
                        },
                        min: 0,
                        max: 5600,
                        ticks: {
                        // forces step size to be 50 units
                        stepSize: 50
                        }
                    },
                },
            }
        });
        chart.resize(600, 600);
    });
    
</script>

<div id='wrapper'>
    <!---Statistics container with tailwind-->
    <div class="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:min-w-screen-xl md:px-24 lg:px-8 lg:py-4">
        <div class="grid row-gap-2 gap-8 sm:grid-cols-3">
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{bestDistanceOverall.toFixed(2)} mi</h6>
            <p class="font-bold">Best Overall</p>
          </div>
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{bestDistanceGeneration.toFixed(2)} mi</h6>
            <p class="font-bold">Best Of Generation</p>
          </div>
          <div class="text-center">
            <h6 class="text-5xl font-bold text-deep-purple-accent-400">{avgerageDistanceGeneration.toFixed(2)} mi</h6>
            <p class="font-bold">Average of Generation</p>
          </div>
        </div>
        <div class="grid row-gap-2 gap-8 sm:grid-cols-1">
            <div class="text-center">
              <h6 class="text-5xl font-bold text-deep-purple-accent-400">{generation}</h6>
              <p class="font-bold">Generation</p>
            </div>
          </div>
      </div>

      <div id="map-wrapper">
        <canvas id="ctx" style="width: 100% !important; height: 600px !important; margin: auto;"></canvas>
      </div>

    <!-- Collapsible sidepanel to the right in center of screen -->
    <div class="flex flex-col justify-center card w-96 bg-base-100 shadow-xl side-panel" style="">
        <div class="card-body">
            <!-- <div class="card-actions justify-end">
                <button class="btn btn-square btn-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div> -->
            <h2 class="card-title" style="margin:5px;">Parameters</h2>
            <div class="flex justify-center">
                <div class="flex flex-col">
                    <div class="flex flex-row gap-8 mb-5">
                        <div class="flex flex-col">
                            <label for="speed">Speed</label>
                            <input class="range range-xs range-primary" type="range" id="speed" name="speed" min="1" max="100" value="100" on:input={e => speedFactor = e.target.value}>
                            <label for="speed">{speedFactor}</label>
                        </div>
                        <div class="flex flex-col">
                            <label for="generations">Generations</label>
                            <input class="range range-xs range-primary" type="range" id="generations" name="generations" min="100" max="10000" value="100" step="100" on:input={e => numGenerations = e.target.value}>
                            <label for="generations">{numGenerations}</label>
                        </div>
                    </div>
                    <div class="flex flex-row gap-8 mb-5">
                        <div class="flex flex-col">
                            <label for="mutation">Mutation Rate</label>
                            <input class="range range-xs range-primary" type="range" id="mutation" name="mutation" min="1" max="50" value="1" on:input={e => mutationRate = e.target.value / 100}>
                            <label for="mutation">{mutationRate}</label>
                        </div>
                        <div class="flex flex-col">
                            <label for="crossover">Crossover Rate</label>
                            <input class="range range-xs range-primary" type="range" id="crossover" name="crossover" min="1" max="100" value="70" on:input={e => crossoverRate = e.target.value / 100}>
                            <label for="crossover">{crossoverRate}</label>
                        </div>
                    </div>
                    <div class="flex flex-row gap-8 mb-5 grid-cols-1">
                        <div class="flex flex-col">
                            <label for="species">Species</label>
                            <input class="range range-xs range-primary" type="range" id="species" name="species" min="1" max="30" value="1" on:input={e => speciesSize = e.target.value}>
                            <label for="population">{speciesSize}</label>
                        </div>
                        <div class="flex flex-col">
                            <label for="tournament">Tournament Size</label>
                            <input class="range range-xs range-primary" type="range" id="tournament" name="tournament" min="1" max="50" value="5" on:input={e => tournamentSize = e.target.value}>
                            <label for="tournament">{tournamentSize}</label>
                        </div>
                    </div>
                    <div class="flex flex-row gap-8 mb-5 grid-cols-1">
                        <div class="flex flex-col">
                            <label for="population">Population</label>
                            <input class="range range-xs range-primary" type="range" id="population" name="population" min="100" max="5000" value="100" step="100" on:input={e => populationSize = e.target.value}>
                            <label for="population">{populationSize}</label>
                        </div>
                    </div>
                    <div class="flex flex-row gap-8 mb-5 grid-cols-1">
                        <!-- Input for random seed -->
                        <div class="flex flex-col">
                            <label for="seed">Random Seed</label>
                            <input class="input input-bordered input-primary" type="text" id="seed" name="seed" value={randomSeed} on:input={e => randomSeed = e.target.value}>
                        </div>
                        <!-- Checkbox for lockSeed -->
                        <div class="flex flex-col">
                            <label for="lockSeed">Lock</label>
                            <input class="checkbox checkbox-primary" type="checkbox" id="lockSeed" name="lockSeed" on:change={e => lockSeed = e.target.checked}>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-actions justify-end">
                <button class="btn btn-primary" on:click={resetAndRunGeneticAlgorithm}>Run</button>
            </div>
        </div>
    </div>
</div>