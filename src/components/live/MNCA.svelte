<script>
    // Code for this is adapted from the following source:
    // nrudakov - ConwayLife - https://github.com/nrudakov/ConwayLife/blob/master/ConwayLife.py

    import { onMount } from 'svelte';
    import FormSideBar from './FormSideBar.svelte';
    import { v4 as uuid } from 'uuid';
    // Importing the tensorflow.js library
    import * as tf from "@tensorflow/tfjs"

    class NhRule{
        upper;
        lower;
        alive;
        id = uuid();
        order = 0;

        constructor(lower, upper, alive, order = 0){
            this.upper = upper;
            this.lower = lower;
            this.alive = alive;
            this.order = order;
        }
    }

    class Neighborhood{
        nhRules;
        nhTensor;
        id = uuid();

        constructor(){
            // NhRules should start with a single rule
            this.nhRules = [new NhRule(0.5, 0.5, true, neighborhoodsOrderArray().length)];

            // Create an array of 0s with a single 1 in the middle
            let nhArray = Array.from({length: 17}, () => Array.from({length: 17}, () => 0));
            nhArray[8][8] = 1;

            // Convert the array to a tensor
            this.nhTensor = tf.tensor(nhArray).expandDims(2).expandDims(3);
        }
    }

    let population;
    let width = 0;
    let height = 0;
    let resolution = 10;
    let speed = 1;
    let backend;
    let interval;
    let innerWidth = 0;
    $: neighborhoods = [];

    // Get a list representing the possible order of neighborhood rules
    // Each rule will be an index in the array
    $: neighborhoodsOrderArray = () => {
        let arr = [];
        if (neighborhoods.length === 0) return arr;
        for (let i = 0; i < neighborhoods.length; i++){
            for(let j = 0; j < neighborhoods[i].nhRules.length; j++){
                arr.push((i+1) * j);
            }
        }
        return arr;
    }

    let mncaStarter1 = [
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0
    ],
    [
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0
    ],
    [
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0
    ],
    [
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0
    ],
    [
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0
    ],
    [
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0
    ],
    [
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0
    ],
    [
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0
    ],
    [
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ]
]
    let mncaStart1Rules = [
        new NhRule(0.21, 0.22, true, 0),
        new NhRule(0.35, 0.5, false, 1),
        new NhRule(0.75, 0.85, false, 2),
        new NhRule(0.12, 0.15, false, 5),
    ]

    let mncaStarter2 = [
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ]
]

    let mncaStart2Rules = [
        new NhRule(0.1, 0.28, false, 3),
        new NhRule(0.43, 0.55, true, 4)
    ]

    let mncaConway = [
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ]
    ]

    let mncaConwayRules = [
        new NhRule(0.0, 0.22, false, 0),
        new NhRule(0.33,0.34,true,1),
        new NhRule(0.341, 1.0, false, 2)
    ]

    let mncaBugs = [
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ]
    ]

    let mncaBugsRules = [
        new NhRule(0.0, 0.2727, false, 0),
        new NhRule(0.273,0.3719, true, 1),
        new NhRule(0.479, 1.0, false, 2)
    ]

    let selectedNeighborhoodArray = [];
    let selectedNeighborhoodID = null;

    let isDrag = false;

    let isDragCanvas = false;
    let canvasCurrentMouseX = 0;
    let canvasCurrentMouseY = 0;

    // Mouse drag for table
    const beginDrag = () => {
        isDrag = true
    }
    
    const endDrag = () => {
        isDrag = false
    }
    
    const mouseHandler = (r, c) => (e) => {
        if (isDrag || e.type === 'mousedown') {
            handleNeighborhoodUpdate(r, c)
        }
    }

    async function playMNCA(){
        // This function runs the multi-neighborhood cellular automata simulation
        // It takes the current population tensor and returns the next generation
        let newPop = tf.tidy(() =>{
            // Create a copy of the population tensor
            let newPopulation = population.clone().toFloat();
            let wasAlive = tf.equal(newPopulation, 1);

            // Perform the convolutions using the neighborhoods
            let calculatedRules = [neighborhoodsOrderArray().length];
            for(let nh of neighborhoods){
                // Get the neighborhood tensor and remove the center cell
                let nhTensorArray = nh.nhTensor.arraySync();
                nhTensorArray[8][8] = 0;
                let nhTensor = tf.tensor(nhTensorArray);

                let convolvedPopulation = tf.conv2d(newPopulation, nhTensor, 1, 'same');
                let neighbors = tf.sub(convolvedPopulation, newPopulation);

                // Average the neighbors by dividing by the number of cells in the neighborhood (i.e. the number of 1s in the neighborhood tensor -1 for the center cell)
                let nhSum = tf.sum(nh.nhTensor);
                let neighborsAvg = tf.div(neighbors, nhSum);

                // Apply rules of the neighborhood
                for(let nhRule of nh.nhRules){
                    let upperRule = tf.lessEqual(neighborsAvg, nhRule.upper);
                    let lowerRule = tf.greaterEqual(neighborsAvg, nhRule.lower);
                    let rulePop = tf.logicalAnd(upperRule, lowerRule);

                    if(!nhRule.alive)
                    {
                        // Invert the rule population
                        let invertRulePop = tf.logicalNot(rulePop);
                        rulePop = invertRulePop;
                        // We need to do this so that when we go to AND the rulePop, we make sure that the cells that were alive are the only ones affected
                    }

                    // Now add the rulePop to the calculatedRules array
                    calculatedRules[nhRule.order] = {pop: rulePop, alive: nhRule.alive};
                }
            }

            // Now we need to combine the rules in order
            // Final pop starts as whatever the previous was alive tensor was
            let finalPop = wasAlive;
            for(let rule of calculatedRules){
                if(rule === undefined)
                    continue;

                if(rule.alive){
                    let finalPopOr = tf.logicalOr(finalPop, rule.pop);
                    finalPop = finalPopOr;
                }
                else{
                    let finalPopAnd = tf.logicalAnd(finalPop, rule.pop);
                    finalPop = finalPopAnd;
                }
            }

            // Update the population tensor
            newPopulation = finalPop.toFloat();

            // Now check if we are dragging the canvas
            if(isDragCanvas){
                // Get the cell that the mouse is currently over
                let x = Math.floor(canvasCurrentMouseX / resolution);
                let y = Math.floor(canvasCurrentMouseY / resolution);

                // Get the current population tensor
                let popArray = population.arraySync();

                // Set a 5x5 circle of cells to alive
                for(let i = -2; i <= 2; i++){
                    for(let j = -2; j <= 2; j++){
                        if(x+i >= 0 && x+i < width && y+j >= 0 && y+j < height){
                            popArray[y+j][x+i] = 1;
                        }
                    }
                }

                // Update the population tensor
                newPopulation = tf.tensor(popArray);
            }

            return newPopulation;
        });

        population.dispose();
        population = newPop;

        // Render the population tensor to the canvas
        tf.browser.toPixels(population, document.getElementById('canvas'));
    }

    // On mount, initialize the canvas
    onMount(() => {
        // Get the size of the wrapper element
        const wrapper = document.getElementById('wrapper');
        width = Math.round(wrapper.clientWidth / resolution);
        height = Math.round(wrapper.clientHeight / resolution);

        let blank = tf.zeros([height, width]);
        tf.browser.toPixels(blank, document.getElementById('canvas'));

        // Dispose of the blank tensor
        tf.dispose(blank);

        // Setup the starter neighborhoods
        setPreset(1);

        // Setup the population tensor
        // This represents the population of cells in the game of life
        // All cells are initialized to 0
        population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
        population = population.round().toInt();
        tf.browser.toPixels(population, document.getElementById('canvas'));

        backend = tf.getBackend();

        // Create a drag event listener for the canvas
        document.getElementById('canvas').addEventListener('mousedown', (e) => onDragCanvas(e));

        // Run the game of life simulation
        interval = setInterval(playMNCA, 1000 / speed);
    });

    function onDragCanvas(e){
        isDragCanvas = true;

        // Start dragging the canvas
        document.addEventListener('mousemove', onDragCanvasMove);

        // Stop dragging the canvas
        document.addEventListener('mouseup', onDragCanvasEnd);
    }

    function onDragCanvasMove(e){
        if(isDragCanvas){
            let canvas = document.getElementById('canvas');
            let rect = canvas.getBoundingClientRect();
            
            // Set the mouse position relative to the canvas
            canvasCurrentMouseX = e.clientX - rect.left;
            canvasCurrentMouseY = e.clientY - rect.top;
        }
    }

    function onDragCanvasEnd(e){
        isDragCanvas = false;

        document.removeEventListener('mousemove', onDragCanvasMove);
        document.removeEventListener('mouseup', onDragCanvasEnd);
    }

    function updateResolution(newResolution){
        // This function updates the resolution of the canvas
        // It also updates the population tensor to match the new resolution

        resolution = newResolution;

        clearInterval(interval);

        const wrapper = document.getElementById('wrapper');
        width = Math.round(wrapper.clientWidth / resolution);
        height = Math.round(wrapper.clientHeight / resolution);

        let blank = tf.zeros([height, width]);
        tf.browser.toPixels(blank, document.getElementById('canvas'));
        blank.dispose();

        population.dispose();
        population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
        population = population.round().toInt();
        tf.browser.toPixels(population, document.getElementById('canvas'));

        interval = setInterval(playMNCA, 1000 / speed);
    }

    function updateSpeed(newSpeed){
        // This function updates the speed of the game of life simulation
        // It changes the interval at which the simulation is run

        speed = newSpeed;

        clearInterval(interval);
        interval = setInterval(playMNCA, 1000 / speed);
    }

    function addNeighborhood(){
        clearInterval(interval);

        neighborhoods.push(new Neighborhood());
        neighborhoods = [...neighborhoods]; // Force reactivity

        // Slight delay to allow the canvas to be rendered before the neighborhood tensor is rendered
        setTimeout(() => {
            renderNeighborhood(neighborhoods[neighborhoods.length-1]);
        }, 500);

        interval = setInterval(playMNCA, 1000 / speed);
    }

    function removeNeighborhood(id){
        clearInterval(interval);

        neighborhoods = neighborhoods.filter(nh => nh.id !== id);

        interval = setInterval(playMNCA, 1000 / speed);
    }

    function renderNeighborhood(neighborhood){
        // This function renders the neighborhood tensor to the canvas
        tf.browser.toPixels(neighborhood.nhTensor.squeeze(), document.getElementById('nhCanvas-' + neighborhood.id));
    }

    function viewNeighborhood(id){
        // Show a modal with an HTML Table to allow the user to view the neighborhood tensor and modify it if necessary
        nh_modal.showModal();

        let neighborhood = neighborhoods.find(nh => nh.id === id);
        selectedNeighborhoodID = id;

        // Now convert the tensor to an array and display it in the modal
        selectedNeighborhoodArray = Array.from(neighborhood.nhTensor.squeeze().squeeze().dataSync());
        let newArr = [];
        while(selectedNeighborhoodArray.length) newArr.push(selectedNeighborhoodArray.splice(0,17));
        selectedNeighborhoodArray = newArr;
    }

    function handleNeighborhoodUpdate(i, j){
        clearInterval(interval);

        // This function updates the neighborhood tensor when the user clicks on a cell in the modal
        selectedNeighborhoodArray[i][j] = selectedNeighborhoodArray[i][j] == 1.0 ? 0.0 : 1.0;
        console.log(selectedNeighborhoodArray);

        // Update the neighborhood tensor
        let newTensor = tf.tensor(selectedNeighborhoodArray).expandDims(2).expandDims(3);
        let neighborhood = neighborhoods.find(nh => nh.id === selectedNeighborhoodID);
        neighborhood.nhTensor = newTensor;

        // Render the neighborhood tensor to the canvas
        renderNeighborhood(neighborhood);
        interval = setInterval(playMNCA, 1000 / speed);
    }

    function addRule(neighborhood){
        clearInterval(interval);

        // This function adds a rule to the neighborhood
        neighborhood.nhRules.push(new NhRule(0.5,0.5,true));
        neighborhood.nhRules = [...neighborhood.nhRules]; // Force reactivity
        neighborhoods = [...neighborhoods]; // Force reactivity

        interval = setInterval(playMNCA, 1000 / speed);
    }

    function removeRule(neighborhood, ruleID){
        clearInterval(interval);

        if(neighborhood.nhRules.length === 1){
            alert("You must have at least one rule in the neighborhood");
            return;
        }

        // This function removes a rule from the neighborhood
        neighborhood.nhRules = neighborhood.nhRules.filter(rule => rule.id !== ruleID);
        neighborhood.nhRules = [...neighborhood.nhRules]; // Force reactivity
        neighborhoods = [...neighborhoods]; // Force reactivity

        interval = setInterval(playMNCA, 1000 / speed);
    }

    function setPreset(presetOption){
        clearInterval(interval);

        // Make sure the presetOption is an integer
        presetOption = parseInt(presetOption);

        switch(presetOption){
            case 1:
                // Ciliates
                let nh1 = new Neighborhood();
                nh1.nhTensor = tf.tensor(mncaStarter1).expandDims(2).expandDims(3);
                nh1.nhRules = mncaStart1Rules;

                let nh2 = new Neighborhood();
                nh2.nhTensor = tf.tensor(mncaStarter2).expandDims(2).expandDims(3);
                nh2.nhRules = mncaStart2Rules;

                neighborhoods = [];

                neighborhoods.push(nh1);
                neighborhoods.push(nh2);

                // Set a delay to allow the canvas to be rendered before the neighborhood tensors are rendered
                setTimeout(() => {
                    renderNeighborhood(neighborhoods[0]);
                    renderNeighborhood(neighborhoods[1]);
                }, 2000);
                break;
            case 2:
                // Worms
                neighborhoods = [];

                // TODO: Add worm preset
                break;
            case 3:
                // Conway
                let nh3 = new Neighborhood();
                nh3.nhTensor = tf.tensor(mncaConway).expandDims(2).expandDims(3);
                nh3.nhRules = mncaConwayRules;

                neighborhoods = [];

                neighborhoods.push(nh3);

                // Set a delay to allow the canvas to be rendered before the neighborhood tensors are rendered
                setTimeout(() => {
                    renderNeighborhood(neighborhoods[0]);
                }, 2000);
                break;
            case 4:
                // Bugs
                let nh4 = new Neighborhood();
                nh4.nhTensor = tf.tensor(mncaBugs).expandDims(2).expandDims(3);
                nh4.nhRules = mncaBugsRules;

                neighborhoods = [];

                neighborhoods.push(nh4);

                // Set a delay to allow the canvas to be rendered before the neighborhood tensors are rendered
                setTimeout(() => {
                    renderNeighborhood(neighborhoods[0]);
                }, 2000);
                break;
            default:
                // Set neiboardhoods to empty
                neighborhoods = [];
                break;
        }

        // Reset the population tensor
        population = tf.randomUniform([height, width, 1], 0, 1, tf.int32);
        population = population.round().toInt();
        tf.browser.toPixels(population, document.getElementById('canvas'));

        backend = tf.getBackend();

        interval = setInterval(playMNCA, 1000 / speed);
    }
</script>

<svelte:window on:mousedown={beginDrag} on:mouseup={endDrag} bind:outerWidth={innerWidth}/>
<div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-4">
        <div style="position:relative" class="w-full h-full" id="wrapper">
            <canvas id="canvas" style="image-rendering: pixelated; cursor:pointer;" class="rounded-md h-full w-full"></canvas>
        </div>
    </div>
    <FormSideBar>
        <article class="prose mb-4">
            <h2>Instructions</h2>
            <p>This is a simple implementation of Conway's Game of Life using TensorFlow.js</p>
            <p>The game is controlled using a simple 2D convolution to sum the living neighbors and then tensor math to set the state of the new population.</p>
            <p>Use the sliders to control the speed (FPS) and resolution (size of the population) of the simulation.</p>
            <p>NOTE: Set your resolution and speed carefully. If your backend is not WebGL or if you do not have a powerful GPU, high speed and a lower resolution value will result in long compute time and possible crashing.</p>
        </article>

        <p>Current backend: {backend}</p>
        <label for="species">Speed (FPS)</label>
        <input class="range range-xs range-primary" type="range" id="species" name="species" min="1" max="60" step="1" value={speed} on:input={e => updateSpeed(e.target.value)}>
        <label for="population" class="block">{speed}</label>

        <label for="species">Zoom (lower value to zoom out)</label>
        <input class="range range-xs range-primary" type="range" id="species" name="species" min="1" max="10" value={resolution} on:input={e => updateResolution(e.target.value)}>
        <label for="population" class="block">{resolution}</label>

        <label for="preset">Presets</label>
        <select class="select select-bordered select-sm w-full mb-4" id="preset" name="preset" on:input={e => setPreset(e.target.value)}>
            <option value="0">Select a preset</option>
            <option value="1" selected>Ciliates</option>
            <option value="3">Conway</option>
            <option value="4">Bugs</option>
        </select>

        {#each neighborhoods as neighborhood}
            <div class="card w-full bg-base-100 shadow-xl mb-2">
                <div class="card-body">
                    <canvas id={"nhCanvas-" + neighborhood.id} style="image-rendering: pixelated; cursor:pointer;" class="rounded-md w-full" on:click={viewNeighborhood(neighborhood.id)}></canvas>
                    {#each neighborhood.nhRules as rule}
                        <div class="collapse collapse-arrow border-collapse bg-base-200">
                            <input type="checkbox" /> 
                            <div class="collapse-title">
                                <h6>Rule {rule.order}</h6>
                            </div>
                            <div class="collapse-content">
                                <div class="w-full">
                                    <div class="w-full">
                                        <label for="lower">Lower Threshold</label>
                                    </div>
                                    <div class="w-full">
                                        <input type="number" bind:value={rule.lower} class="input w-full input-sm input-bordered join-item" placeholder="0.5"/>
                                    </div>
                                </div>
                                <div class="w-full">
                                    <div class="w-full">
                                        <label for="upper">Upper Threshold</label>
                                    </div>
                                    <div class="w-full">
                                        <input type="number" bind:value={rule.upper} class="input w-full input-sm input-bordered join-item" placeholder="0.5"/>
                                    </div>
                                </div>
                                <div class="w-full">
                                    <div class="w-full">
                                        <label for="alive">Alive</label>
                                    </div>
                                <select bind:value={rule.alive} class="select select-bordered select-sm w-full">
                                    <option value={true} selected>A</option>
                                    <option value={false}>D</option>
                                </select>
                                </div>
                                <div class="w-full">
                                    <div class="w-full">
                                        <label for="alive">Order</label>
                                    </div>
                                <select bind:value={rule.order} class="select select-bordered select-sm w-full">
                                    {#each neighborhoodsOrderArray() as _, i}
                                        <option value={i} selected>{i}</option>
                                    {/each}
                                </select>
                                </div>
                                <button class="btn btn-error btn-sm w-full mt-2" on:click={removeRule(neighborhood, rule.id)}>Delete Rule</button>
                            </div>
                        </div>
                    {/each}
                    <button class="btn btn-primary btn-sm w-full mt-2" on:click={addRule(neighborhood)} >Add Rule</button>
                    <button class="btn btn-error btn-sm w-full mt-2" on:click={removeNeighborhood(neighborhood.id)}>Delete Neighborhood</button>
                </div>
            </div>
        {/each}

        <button class="btn btn-primary btn-sm w-full mb-2 mt-2" on:click={addNeighborhood}>Add Neighborhood</button>
    </FormSideBar>

    <dialog id="nh_modal" class="modal">
        <div class="modal-box" style="width: 360px;">
          <table class="table" width="340" height="340">
            <tbody>
                {#if selectedNeighborhoodArray.length > 0}
                    {#each Array(17) as _, i}
                        <tr>
                            {#each Array(17) as _, j}
                                {#if i == 8 && j == 8}
                                    <td id='con-{i}-{j}' class='alive' style='width: 20px; height: 20px; padding:0px; text-align:center; font-color:black; font-weight:bold;'>0</td>
                                {:else}
                                    <td id='con-{i}-{j}' class='{selectedNeighborhoodArray[i][j] == 1.0 ? 'alive' : 'dead'} clickable' style='width: 20px; height: 20px; padding:0px' on:mousedown={mouseHandler(i, j)} on:mouseenter={mouseHandler(i, j)}></td>
                                {/if}
                            {/each}
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
</div>

<style>
    .alive{
        background-color: #fff;
    }

    .dead{
        background-color: #000;
    }

    .clickable{
        cursor: pointer;
    }

    .clickable:hover{
        background-color: #ccc;
    }

    .clickable:active{
        background-color: #aaa;
    }

    td{
        border: 1px solid #000;
    }
</style>