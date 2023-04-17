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

        // Parameters for the genetic algorithm
        this.numGenerations = 100;
        this.numCities = 48;
        this.mutationRate = 0.01;
        this.crossoverRate = 0.7;
        this.speedFactor = 100;
        this.tournamentSize = 5;
        this.numSpecies = 1;
        this.populationSize = 100;
        this.randomSeed = 0;

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

    // Function to calculate the fitness of a chromosome
    calculateFitness(chromosome) {
        // Check if the chromosome is valid
        var valid = this.isValidChromosome(chromosome);
        if (!valid) {
            throw "Invalid chromosome";
        }

        var distance = 0;
        
        // Calculate the distance between each city in the chromosome
        for (var i = 0; i < chromosome.genes.length - 1; i++) {
            var cityA = att48.att48.tsplib[this.cityNumberIndexes[chromosome.genes[i]]];
            var cityB = att48.att48.tsplib[this.cityNumberIndexes[chromosome.genes[i + 1]]];
            distance += Math.sqrt(Math.pow(cityB.x - cityA.x, 2) + Math.pow(cityB.y - cityA.y, 2));
        }

        // Calculate the distance between the last city and the first city
        var cityA = att48.att48.tsplib[this.cityNumberIndexes[chromosome.genes[chromosome.genes.length - 1]]];
        var cityB = att48.att48.tsplib[this.cityNumberIndexes[chromosome.genes[0]]];
        distance += Math.sqrt(Math.pow(cityB.x - cityA.x, 2) + Math.pow(cityB.y - cityA.y, 2));

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
            current = Math.floor(Math.random(this.randomSeed) * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
        return array;
    }

    // Function to create a new generation of chromosomes
    createNewGeneration(chromosomes) {
        var newChromosomes = [];

        // Speciate the chromosomes
        var species = this.speciate(chromosomes);

        for (var i = 0; i < chromosomes.length; i++) {
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

    // Function to separate the chromosomes into different species using k-means clustering
    speciate(chromosomes) {
        // Create a list of the chromosome genes
        var genes = [];
        for (var i = 0; i < chromosomes.length; i++) {
            genes.push(chromosomes[i].genes);
        }

        // Choose random centroid genes for each species
        var centroids = [];
        for (var i = 0; i < this.numSpecies; i++) {
            var index = Math.floor(Math.random(this.randomSeed) * chromosomes.length);
            centroids.push(chromosomes[index].genes);
        }

        // Assign each chromosome to a species based on the closest centroid using Euclidean distance
        var species = [];
        for (var i = 0; i < this.numSpecies; i++) {
            species.push([]);
        }

        for (var i = 0; i < genes.length; i++) {
            var minDistance = Infinity;
            var minIndex = -1;
            for (var j = 0; j < centroids.length; j++) {
                var distance = this.calculateKmeansDistance(genes[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    minIndex = j;
                }
            }
            species[minIndex].push(chromosomes[i]);
        }

        // Recalculate the centroid genes for each species and repeat the assignment until the centroids do not change
        var changed = true;
        while (changed) {
            changed = false;
            for (var i = 0; i < species.length; i++) {
                var centroid = this.calculateCentroid(species[i]) ?? centroids[i];
                if (!this.compareArrays(centroid, centroids[i])) {
                    changed = true;
                    centroids[i] = centroid;
                }
            }

            // Assign each chromosome to a species based on the closest centroid using Euclidean distance
            species = [];
            for (var i = 0; i < this.numSpecies; i++) {
                species.push([]);
            }
            for (var i = 0; i < genes.length; i++) {
                var minDistance = Infinity;
                var minIndex = -1;
                for (var j = 0; j < centroids.length; j++) {
                    var distance = this.calculateKmeansDistance(genes[i], centroids[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        minIndex = j;
                    }
                }
                species[minIndex].push(chromosomes[i]);
            }
        }

        return species;
    }

    // Function to calculate the centroid of a list of chromosomes
    calculateCentroid(chromosomes) {
        // Prevent division by zero
        if (chromosomes.length == 0) {
            return null;
        }

        var centroid = Array(this.numCities).fill(0);
        for (var i = 0; i < chromosomes.length; i++) {
            for (var j = 0; j < chromosomes[i].genes.length; j++) {
                centroid[j] += chromosomes[i].genes[j];
            }
        }
        for (var i = 0; i < centroid.length; i++) {
            centroid[i] /= chromosomes.length;
        }
        return centroid;
    }

    // Function to compare two arrays
    compareArrays(arrayA, arrayB) {
        if (arrayA.length != arrayB.length) {
            return false;
        }

        for (var i = 0; i < arrayA.length; i++) {
            if (arrayA[i] != arrayB[i]) {
                return false;
            }
        }

        return true;
    }

    // Function to calculate the Euclidean distance between two chromosomes
    calculateKmeansDistance(chromosomeA, chromosomeB) {
        var distance = 0;
        for (var i = 0; i < chromosomeA.length; i++) {
            distance += Math.pow(chromosomeA[i] - chromosomeB[i], 2);
        }
        return Math.sqrt(distance);
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
                this.bestChromosomeOverall = bestChromosome;
            }


            // Calculate the average distance of the generation
            this.bestDistanceGeneration = bestDistance;
            var totalDistance = this.sum(chromosomes.map(c => c.fitness));
            this.avgerageDistanceGeneration = totalDistance / chromosomes.length;

            // Update the metrics
            await this.updateMetrics();

            // Update the chart
            await this.updateChart(this.bestChromosomeOverall);

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
            this.bestChromosomeOverall = bestChromosome;
        }
        this.bestDistanceGeneration = bestDistance;
        
        var totalDistance = this.sum(chromosomes.map(c => c.fitness));
        this.avgerageDistanceGeneration = totalDistance / chromosomes.length;

        // Update the metrics
        await this.updateMetrics();

        // Update the chart
        await this.updateChart(this.bestChromosomeOverall);

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