<script lang="ts">
    import FormSideBar from "./FormSideBar.svelte";
    import { onMount } from "svelte";
    import cytoscape from 'cytoscape';
    import cola from 'cytoscape-cola';

    enum TraversalAlgorithm {
        BreadthFirstSearch,
        DepthFirstSearch,
    }

    // General variables
    let cy;
    let width;
    let height;
    let algorithm = TraversalAlgorithm.BreadthFirstSearch;
    let play = false;
    let delay = 100;
    let delayChange = false;
    let numberOfElements = 10;

    let options = {
            name: 'cola',
            animate: true, // whether to show the layout as it's running
                    refresh: 1, // number of ticks per frame; higher is faster but more jerky
                    maxSimulationTime: 4000, // max length in ms to run the layout
                    ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
                    fit: true, // on every layout reposition of nodes, fit the viewport
                    padding: 30, // padding around the simulation
                    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node

                    // layout event callbacks
                    ready: function(){}, // on layoutready
                    stop: function(){}, // on layoutstop

                    // positioning options
                    randomize: false, // use random node positions at beginning of layout
                    avoidOverlap: true, // if true, prevents overlap of node bounding boxes
                    handleDisconnected: true, // if true, avoids disconnected components from overlapping
                    convergenceThreshold: 0.01, // when the alpha value (system energy) falls below this value, the layout stops
                    nodeSpacing: function( node ){ return 10; }, // extra spacing around nodes
                    flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
                    alignment: undefined, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
                    gapInequalities: undefined, // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
                    centerGraph: true, // adjusts the node positions initially to center the graph (pass false if you want to start the layout from the current position)

                    // different methods of specifying edge length
                    // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
                    edgeLength: undefined, // sets edge length directly in simulation
                    edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
                    edgeJaccardLength: undefined, // jaccard edge length in simulation

                    // iterations of cola algorithm; uses default values on undefined
                    unconstrIter: undefined, // unconstrained initial layout iterations
                    userConstIter: undefined, // initial layout iterations with user-specified constraints
                    allConstIter: undefined, // initial layout iterations with all constraints including non-overlap
            };

    let graph = [];

    function setAlgorithm(value) {
        algorithm = parseInt(value);
    }

    function generateRandomGraph() {
        graph = [];
        for (let i = 0; i < numberOfElements; i++) {
            graph.push({ group: 'nodes', data: { id: i.toString() } });
        }

        // Make sure each node has at least two edges connected to it (one incoming and one outgoing)
        for (let i = 0; i < numberOfElements; i++) {
            let target = Math.floor(Math.random() * numberOfElements);
            // Element cannot be connected to itself
            while (target === i) {
                target = Math.floor(Math.random() * numberOfElements);
            }

            // Get a random weight for the edge
            let weight = Math.floor(Math.random() * 10) + 1;
            

            graph.push({ group: 'edges', data: { id: `${i}-${target}`, source: i.toString(), target: target.toString(), weigth:weight } });
        }        

        cy.add(graph);
    }

    onMount(() => {
        cy = cytoscape({
            container: document.getElementById('cy'),
            elements: [],
            style: cytoscape.stylesheet()
                .selector('node')
                .style({
                    'content': 'data(id)',
                    'color': 'white',
                })
                .selector(':selected')
                .style({
                    'background-color': '#9433eb',
                    'line-color': '#9433eb',
                    'text-outline-color': '#9433eb'
                })
                .selector('edge')
                .style({
                    'curve-style': 'bezier',
                    'width': 4,
                    'line-color': '#ddd',
                })
                .selector('.highlighted')
                .style({
                    'background-color': '#9433eb',
                    'line-color': '#9433eb',
                    'transition-property': 'background-color, line-color, target-arrow-color, source-arrow-color',
                    'transition-duration': '0.5s'
                }),
        });


        generateRandomGraph();
        cytoscape.use(cola);
        cy.layout(options).run();
    });

    function breadthFirstSearch(){
        // Perform Depth First Search, and highlight the nodes and edges as they are visited
        // Get the id of the selected node
        let typeIds = cy.elements('node:selected');

        // If no node is selected, start from the first node
        if (typeIds.length === 0) {
            typeIds = cy.elements('node');
        }

        let startNode = typeIds[0].id();

        let bfs = cy.elements().bfs("#"+startNode, function(){}, false);

        let i = 0;
        let highlightNextEle = function(){
            if (play === false) {
                return;
            }

        if( i < bfs.path.length ){
            bfs.path[i].addClass('highlighted');

            i++;
            setTimeout(highlightNextEle, delay);
        }else{
            play = false;
        }
        };

        // kick off first highlight
        highlightNextEle();
    }

    function depthFirstSearch(){
        // Perform Depth First Search, and highlight the nodes and edges as they are visited
        // Get the id of the selected node
        let typeIds = cy.elements('node:selected');

        // If no node is selected, start from the first node
        if (typeIds.length === 0) {
            typeIds = cy.elements('node');
        }

        let startNode = typeIds[0].id();

        let dfs = cy.elements().dfs("#"+startNode, function(){}, false);

        let i = 0;
        let highlightNextEle = function(){
            if (play === false) {
                return;
            }

        if( i < dfs.path.length ){
            dfs.path[i].addClass('highlighted');

            i++;
            setTimeout(highlightNextEle, delay);
        }
        else{
            play = false;
        }
        };

        // kick off first highlight
        highlightNextEle();
    }

    function startAlgorithm(){
        if (play) {
            return;
        }

        reset();
        play = true;
        switch (algorithm) {
            case TraversalAlgorithm.BreadthFirstSearch:
                breadthFirstSearch();
                break;
            case TraversalAlgorithm.DepthFirstSearch:
                depthFirstSearch();
                break;
        }
    }

    function reset(){
        play = false;
        cy.elements().removeClass('highlighted');
    }

    function randomize(){
        cy.elements().remove();
        generateRandomGraph();
        cy.layout(options).run();
    }
    
</script>

<div class="flex flex-column w-full h-full">
    <div class="w-full h-full flex items-center justify-center max-h-[100vh] overflow-y-scroll">
        <div id="cy" class="w-full h-full p-4" />
    </div>
    <FormSideBar>
        <article class="prose mb-4">
            <h2>Instructions</h2>
            <p>
                This is a simple visualization of several graph traversal algorithms. You can select the algorithm you want to visualize, the number of elements, and the speed of the visualization.
            </p>
            <p>
                To start the visualization, click on the play button. You can pause the visualization at any time by clicking on the pause button. You can also reset the visualization by clicking on the reset button.
            </p>
            <p>
                You can also select a node in the graph to start the traversal from that node. The traversal will start from the selected node and highlight the nodes and edges as they are visited.
            </p>
        </article>

        <div class="flex flex-col gap-2">
            <div class="join w-full">
                <div class="tooltip" data-tip={play ? "Pause": "Play"}>
                    <button class="btn btn-square join-item" on:click={() => startAlgorithm()}>
                        {#if !play}
                            <i class="fa-solid fa-play"></i>
                        {:else}
                            <i class="fa-solid fa-pause text-xl"></i>
                        {/if}
                    </button>
                </div>
                <div class="tooltip" data-tip="Randomize">
                    <button class="btn btn-square join-item" on:click={() => randomize()}>
                        <i class="fa-solid fa-shuffle text-xl"></i>
                    </button>
                </div>
                <div class="tooltip" data-tip="Reset">
                    <button class="btn btn-square join-item" on:click={() => reset()}>
                        <i class="fa-solid fa-rotate-right text-xl"></i>
                    </button>
                </div>
            </div>

            <label for="speed">Number of Elements</label>
            <input class="range range-xs range-primary" type="range" id="speed" name="speed" min="5" max="50" value={numberOfElements} step="5" on:input={e => numberOfElements = e.target.value}>
            <label for="speed" class="block">{numberOfElements}</label>

            <label class="form-control w-full max-w-xs">
                <div class="label">
                  <span class="label-text">Speed</span>
                </div>
            <input type="range" min="0" max="500" value={delay} class="range" step="100" on:input={e => delay = e.target.value} />
            <div class="w-full flex justify-between text-xs px-2">
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
            </div>
            </label>

            <label for="preset">Traversal Algorithm</label>
            <select class="select select-bordered select-sm w-full mb-4" id="preset" name="preset" on:input={e => setAlgorithm(e.target.value)}>
                <option value={TraversalAlgorithm.BreadthFirstSearch}>Breadth First Search</option>
                <option value={TraversalAlgorithm.DepthFirstSearch}>Depth First Search</option>
            </select>
        </div>        
    </FormSideBar>
</div>