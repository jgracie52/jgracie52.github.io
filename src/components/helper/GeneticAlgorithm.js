import * as att48 from '../data/att48_xy.json';
import seedrandom from 'seedrandom';

export class GeneticAlgorithm {
    constructor(updateChart, updateMetrics){
    
        this.cityNumberIndexes = [];
        this.cityIndexes = [];
        this.abort = false;
        this.running = false;
        this.updateChart = updateChart;
        this.updateMetrics = updateMetrics;

        // Metrics to display in the UI
        this.bestDistanceOverall = 0;
        this.bestDistanceGeneration = 0;
        this.avgerageDistanceGeneration = 0;
        this.generation = 0;
        this.bestChromosomeOverall = null;

        // History tracking for post-run analysis
        this.metricsHistory = {
            generations: [],
            bestOverall: [],
            bestGeneration: [],
            avgGeneration: [],
            diversity: []
        };

        // Parameters for the genetic algorithm
        this.numGenerations = 500;
        this.numCities = 48;
        this.mutationRate = 0.02;
        this.crossoverRate = 0.8;
        this.speedFactor = 100;
        this.tournamentSize = 5;
        this.numSpecies = 3;
        this.populationSize = 200;
        this.randomSeed = 0;
        this.elitismRate = 0.05; // Keep top 5% of chromosomes

        this.sleep = ms => new Promise(res => setTimeout(res, ms));
    }

    // Function to set the indexs of the cities
    setCityIndices() {
        this.cityIndexes = [];
        this.cityNumberIndexes = [];
        for (let x in att48.att48.coordinates) {
            this.cityIndexes.push(x);
        }
        for (let x in att48.att48.tsplib) {
            this.cityNumberIndexes.push(x);
        }
    }

    // Function to sum an array
    sum(array) {
        return array.reduce((a, b) => a + b, 0);
    }

    // Function to check if a chromosome is valid
    isValidChromosome(chromosome) {
        var genes = chromosome.genes;

        // Check if the chromosome has duplicate genes
        for (var i = 0; i < genes.length; i++) {
            if (genes.indexOf(genes[i]) != i) {
                return false;
            }
        }

        // Check if the chromosome has the correct number of genes
        if (genes.length != this.numCities) {
            return false;
        }

        // Check if the chromosome has all the genes
        for (var i = 0; i < this.numCities; i++) {
            if (!genes.includes(i)) {
                return false;
            }
        }

        return true;
    }

    // Function to calculate the Haversine distance between two lat/lng points in miles
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Function to calculate the fitness of a chromosome
    calculateFitness(chromosome) {
        // Check if the chromosome is valid
        var valid = this.isValidChromosome(chromosome);
        if (!valid) {
            throw "Invalid chromosome";
        }

        var distance = 0;

        // Calculate the distance between each city in the chromosome using Haversine formula
        for (var i = 0; i < chromosome.genes.length - 1; i++) {
            var cityNameA = this.cityIndexes[chromosome.genes[i]];
            var cityNameB = this.cityIndexes[chromosome.genes[i + 1]];
            var cityA = att48.att48.latlng[cityNameA];
            var cityB = att48.att48.latlng[cityNameB];
            distance += this.haversineDistance(cityA.lat, cityA.lng, cityB.lat, cityB.lng);
        }

        // Calculate the distance between the last city and the first city
        var cityNameA = this.cityIndexes[chromosome.genes[chromosome.genes.length - 1]];
        var cityNameB = this.cityIndexes[chromosome.genes[0]];
        var cityA = att48.att48.latlng[cityNameA];
        var cityB = att48.att48.latlng[cityNameB];
        distance += this.haversineDistance(cityA.lat, cityA.lng, cityB.lat, cityB.lng);

        chromosome.fitness = distance;
        return chromosome;
    }

    // Function to create a set of randome chromosomes
    createRandomChromosomes(count) {
        var chromosomes = [];
        for (var i = 0; i < count; i++) {
            var genes = [];
            // Create an array of random numbers from 0 to 47 (the number of cities) and shuffle it
            for (var j = 0; j < this.numCities; j++) {
                genes.push(j);
            }
            genes = this.shuffle(genes);

            // Check if the genes are unique
            for (var j = 0; j < genes.length; j++) {
                if (genes.indexOf(genes[j]) != j) {
                    // Throw an error if there are duplicate genes
                    throw "Duplicate genes in chromosome";
                }
            }

            chromosomes.push(new Chromosome(genes));
        }
        return chromosomes;
    }

    // Function to shuffle an array
    shuffle(array) {
        var tmp, current, top = array.length;
        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
        return array;
    }

    // Function to create a new generation of chromosomes
    createNewGeneration(chromosomes) {
        var newChromosomes = [];

        // Elitism: Preserve the best chromosomes (deep copy to prevent mutation)
        var eliteCount = Math.floor(chromosomes.length * this.elitismRate);
        for (var i = 0; i < eliteCount; i++) {
            var eliteClone = new Chromosome([...chromosomes[i].genes]);
            eliteClone.fitness = chromosomes[i].fitness;
            newChromosomes.push(eliteClone);
        }

        // Speciate the chromosomes
        var species = this.speciate(chromosomes);

        // Create offspring to fill the rest of the population
        while (newChromosomes.length < chromosomes.length) {
            // Pick two parents using tournament selection
            var parentA = this.pickParent(chromosomes, species);
            var parentB = this.pickParent(chromosomes, species);
            var child = this.crossover(parentA, parentB);
            child = this.mutate(child);
            newChromosomes.push(child);
        }

        return newChromosomes;
    }

    // Function to pick a parent chromosome using tournament selection
    pickParent(chromosomes, species) {
        var parent = null;

        // Pick a random species
        var index = Math.floor(Math.random(this.randomSeed) * species.length);
        var speciesIndex = species[index];

        // Make sure that the species is not empty
        // If it is empty, find a new species
        while (speciesIndex.length == 0) {
            index = Math.floor(Math.random(this.randomSeed) * species.length);
            speciesIndex = species[index];
        }

        // Pick a chromosome from the species using tournament selection
        for (var i = 0; i < this.tournamentSize; i++) {
            var index = Math.floor(Math.random(this.randomSeed) * speciesIndex.length);
            var chromosome = speciesIndex[index];
            if (parent == null || chromosome.fitness < parent.fitness) {
                parent = chromosome;
            }
        }

        return parent;
    }

    // Function to crossover two chromosomes using Partially Mapped Crossover
    crossover(parentA, parentB){
        // Determine if the crossover should occur
        if (Math.random(this.randomSeed) > this.crossoverRate) {
            // Return the best parent
            return parentA.fitness < parentB.fitness ? parentA : parentB;
        }

        var child = new Chromosome(Array(this.numCities).fill(99));
        var start = Math.floor(Math.random(this.randomSeed) * parentA.genes.length);
        var end = Math.floor(Math.random(this.randomSeed) * parentA.genes.length);
        if (start > end) {
            var temp = start;
            start = end;
            end = temp;
        }

        // Copy the genes from the start to the end of the parentA to the child
        for (var i = start; i < end; i++) {
            child.genes[i] = parentA.genes[i];
        }

        // Copy the genes from the parentB to the child
        for (var i = 0; i < parentB.genes.length; i++) {
            // Skip the genes that have already been copied
            if (i >= start && i < end) {
                continue;
            }

            if (!child.genes.includes(parentB.genes[i])) {
                child.genes[i] = parentB.genes[i];
            }
        }

        // Fill in the remaining genes in the child with the genes from parentA
        for(var i = 0; i < child.genes.length; i++) {
            if (child.genes[i] == 99) {
                var j = 0;
                while(child.genes.includes(parentA.genes[j])) {
                    j++;
                }
                child.genes[i] = parentA.genes[j];
            }
        }

        // Make sure the child does not have any duplicate genes
        for (var i = 0; i < child.genes.length; i++) {
            if (child.genes.indexOf(child.genes[i]) != i) {
                // Throw an error if there are duplicate genes
                throw "Duplicate genes in child: " + child.genes + ", indices: " + child.genes.indexOf(child.genes[i]) + " " + i;
            }
        }

        return child;
    }

    // Function to mutate a chromosome
    mutate(chromosome) {
        for (var i = 0; i < chromosome.genes.length; i++) {
            if (Math.random(this.randomSeed) < this.mutationRate) {
                // Swap two genes
                var indexA = Math.floor(Math.random(this.randomSeed) * chromosome.genes.length);
                var indexB = Math.floor(Math.random(this.randomSeed) * chromosome.genes.length);
                var temp = chromosome.genes[indexA];
                chromosome.genes[indexA] = chromosome.genes[indexB];
                chromosome.genes[indexB] = temp;
            }
        }

        return chromosome;
    }

    // Function to calculate population diversity
    // Returns average edge distance between chromosomes (higher = more diverse)
    calculateDiversity(chromosomes) {
        if (chromosomes.length < 2) return 0;

        // Sample only 5 chromosomes to avoid performance issues
        var sample = chromosomes.slice(0, Math.min(5, chromosomes.length));
        var totalDistance = 0;
        var comparisons = 0;

        for (var i = 0; i < sample.length - 1; i++) {
            for (var j = i + 1; j < sample.length; j++) {
                totalDistance += this.edgeDistance(sample[i].genes, sample[j].genes);
                comparisons++;
            }
        }

        return comparisons > 0 ? totalDistance / comparisons : 0;
    }

    // Function to calculate edge-based distance between two tours
    // Counts how many edges (city connections) differ between two routes
    edgeDistance(routeA, routeB) {
        // Build set of edges for route A
        var edgesA = new Set();
        for (var i = 0; i < routeA.length; i++) {
            var next = (i + 1) % routeA.length;
            // Create bidirectional edge (sorted to handle both directions)
            var edge = routeA[i] < routeA[next]
                ? routeA[i] + '-' + routeA[next]
                : routeA[next] + '-' + routeA[i];
            edgesA.add(edge);
        }

        // Count edges in route B that are NOT in route A
        var differentEdges = 0;
        for (var i = 0; i < routeB.length; i++) {
            var next = (i + 1) % routeB.length;
            var edge = routeB[i] < routeB[next]
                ? routeB[i] + '-' + routeB[next]
                : routeB[next] + '-' + routeB[i];
            if (!edgesA.has(edge)) {
                differentEdges++;
            }
        }

        return differentEdges;
    }

    // Function to find medoid (most central chromosome) in a cluster
    // Returns the chromosome with minimum total distance to all others
    findMedoid(chromosomes) {
        if (chromosomes.length === 0) return null;
        if (chromosomes.length === 1) return chromosomes[0];

        var minTotalDistance = Infinity;
        var medoid = chromosomes[0];

        for (var i = 0; i < chromosomes.length; i++) {
            var totalDistance = 0;
            for (var j = 0; j < chromosomes.length; j++) {
                if (i !== j) {
                    totalDistance += this.edgeDistance(chromosomes[i].genes, chromosomes[j].genes);
                }
            }

            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                medoid = chromosomes[i];
            }
        }

        return medoid;
    }

    // Function to separate chromosomes into species using k-medoids clustering with edge distance
    speciate(chromosomes) {
        if (this.numSpecies === 1) {
            return [chromosomes];
        }

        // Choose initial medoids from evenly spaced chromosomes
        var medoids = [];
        var step = Math.floor(chromosomes.length / this.numSpecies);
        for (var i = 0; i < this.numSpecies; i++) {
            var index = Math.min(i * step, chromosomes.length - 1);
            medoids.push(chromosomes[index]);
        }

        // Single pass k-medoids clustering (no iteration to avoid performance issues)
        var species = [];
        for (var i = 0; i < this.numSpecies; i++) {
            species.push([]);
        }

        for (var i = 0; i < chromosomes.length; i++) {
            var minDistance = Infinity;
            var minIndex = 0;

            for (var j = 0; j < medoids.length; j++) {
                var distance = this.edgeDistance(chromosomes[i].genes, medoids[j].genes);
                if (distance < minDistance) {
                    minDistance = distance;
                    minIndex = j;
                }
            }

            species[minIndex].push(chromosomes[i]);
        }

        return species;
    }


    // Function to run the genetic algorithm
    async runGeneticAlgorithm() {
        // Set the random seed
        seedrandom(this.randomSeed, { global: true });

        await this.setCityIndices();

        var chromosomes = this.createRandomChromosomes(this.populationSize);

        for (var i = 0; i < this.numGenerations; i++) {
            // Abort if the user has clicked the stop button
            if (this.abort) {
                this.abort = false;
                return;
            }

            // Set the generation number
            this.generation = i + 1;

            // Calculate the fitness of each chromosome
            for(var j = 0; j < chromosomes.length; j++) {
                this.calculateFitness(chromosomes[j]);
            }
            
            // Sort the chromosomes by fitness (lowest to highest)
            chromosomes.sort((a, b) => a.fitness - b.fitness);
            
            // Calculate the best distance of the generation
            var bestChromosome = chromosomes[0];
            var bestDistance = bestChromosome.fitness;
            if (this.bestDistanceOverall == 0 || bestDistance < this.bestDistanceOverall) {
                this.bestDistanceOverall = bestDistance;
                // Deep copy to prevent reference issues
                this.bestChromosomeOverall = new Chromosome([...bestChromosome.genes]);
                this.bestChromosomeOverall.fitness = bestChromosome.fitness;
            }


            // Calculate the average distance of the generation
            this.bestDistanceGeneration = bestDistance;
            var totalDistance = this.sum(chromosomes.map(c => c.fitness));
            this.avgerageDistanceGeneration = totalDistance / chromosomes.length;

            // Store metrics history every 10 generations
            if (i % 10 === 0) {
                var diversityScore = this.calculateDiversity(chromosomes.slice(0, 10));
                this.metricsHistory.generations.push(this.generation);
                this.metricsHistory.bestOverall.push(this.bestDistanceOverall);
                this.metricsHistory.bestGeneration.push(this.bestDistanceGeneration);
                this.metricsHistory.avgGeneration.push(this.avgerageDistanceGeneration);
                this.metricsHistory.diversity.push(diversityScore);
            }

            // Update the metrics
            await this.updateMetrics();

            // Update the chart with top 5 chromosomes
            await this.updateChart(this.bestChromosomeOverall, chromosomes.slice(0, 5));

            // Create a new generation
            chromosomes = this.createNewGeneration(chromosomes);

            // Delay the loop to allow the user to see the progress
            await this.sleep(100 / this.speedFactor);
        }

        // Calculate the fitness of each chromosome
        for(var j = 0; j < chromosomes.length; j++) {
            this.calculateFitness(chromosomes[j]);
        }
        chromosomes.sort((a, b) => a.fitness - b.fitness);
        
        var bestChromosome = chromosomes[0];
        var bestDistance = bestChromosome.fitness;
        if (this.bestDistanceOverall == 0 || bestDistance < this.bestDistanceOverall) {
            this.bestDistanceOverall = bestDistance;
            // Deep copy to prevent reference issues
            this.bestChromosomeOverall = new Chromosome([...bestChromosome.genes]);
            this.bestChromosomeOverall.fitness = bestChromosome.fitness;
        }
        this.bestDistanceGeneration = bestDistance;
        
        var totalDistance = this.sum(chromosomes.map(c => c.fitness));
        this.avgerageDistanceGeneration = totalDistance / chromosomes.length;

        // Update the metrics
        await this.updateMetrics();

        // Update the chart with top 5 chromosomes
        await this.updateChart(this.bestChromosomeOverall, chromosomes.slice(0, 5));

        this.running = false;
    }
}

// Class to hold chromosome data for genetic algorithm
class Chromosome {
    constructor(genes) {
        this.genes = genes;
        this.fitness = 0;
    }
}