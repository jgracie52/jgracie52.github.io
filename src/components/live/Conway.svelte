<script>
    import { onMount, tick } from 'svelte';
    import FormSideBar from './FormSideBar.svelte';

    class ConwayCell {
        constructor(alive, td){
            this.alive = alive;
            this.td = td;
        }
    }

    let aliveInitChance = 0.2;
    let delay = 600;
    let gridParent = null;
    let innerWidth = 0;
    let width = 500;
    let height = 500;
    let cellPer = 50;
    let cellWidth = 16;
    let cellHeight = 0
    let play = true;
    let conwayGrid = [...Array(cellPer)].map(e => Array(cellPer));
    let isDrag = false;

    // Mouse drag for table
    const beginDrag = () => {
        isDrag = true
    }
    
    const endDrag = () => {
        isDrag = false
    }

    const toggle = (r, c) => {
        conwayGrid[r][c].alive = !conwayGrid[r][c].alive
    }
    
    const mouseHandler = (r, c) => (e) => {
        if (isDrag || e.type === 'mousedown') {
            toggle(r, c)
        }
    }

    onMount(() => {
        width = document.getElementById("conway-grid").clientWidth;
        height = document.getElementById("conway-grid").clientHeight;

        // Get a cell width and height that are more or less equal based on the width and height of the grid
        cellWidth = Math.floor(width / cellPer);
        cellHeight = Math.floor(height / cellPer);

        playConway();
    });

    async function playConway(){
        // Only play when play is true
        if(!play)
        {
            setTimeout(playConway, delay);
            return;
        }

        // Generate temporary grid
        let temp = [...Array(cellPer)].map(e => Array(cellPer))
        console.log(temp)

        // Loop over the grid
        for(let row = 0; row < cellPer; row++){
            for(let col = 0; col < cellPer; col++){
                // Count living and dead neighbors
                let count = countNeighbors(row,col);

                if(!conwayGrid[row][col].alive){
                    // Dead cell logic
                    if(count == 3)
                        temp[row][col] = true;
                    else
                        temp[row][col] = false;
                }
                else{
                    // Live cell logic
                    if(count < 2 || count > 3)
                        temp[row][col] = false; 
                    else
                        temp[row][col] = true;   
                }                
            }
        }

        // Replace old grid with new grid
        // Prevents updates to alive prop from affecting calculations for other cells
        for(let row = 0; row < cellPer; row++){
            for(let col = 0; col < cellPer; col++){
                conwayGrid[row][col].alive = temp[row][col];
            }
        }

        await tick();
        
        setTimeout(function(){
            playConway();
        }, delay);
    }

    function countNeighbors(i,j){
        let count = 0;
        if(i != 0 && j != 0 && conwayGrid[i-1][j-1].alive)
            count++;
        if(i != 0 && conwayGrid[i-1][j].alive)
            count++;
        if(i != 0 && j != cellPer - 1 && conwayGrid[i-1][j+1].alive)
            count++;
        if(j != 0 && conwayGrid[i][j-1].alive)
            count++;
        if(j != 0 && i != cellPer - 1 && conwayGrid[i+1][j-1].alive)
            count++;
        if(i != cellPer - 1 && j != cellPer - 1 && conwayGrid[i+1][j+1].alive)
            count++;
        if(i != cellPer - 1 && conwayGrid[i+1][j].alive)
            count++;
        if(j != cellPer - 1 && conwayGrid[i][j+1].alive)
            count++;

        // Allow neighbors to wrap around the grid
        if(i == 0 && conwayGrid[cellPer-1][j].alive)
            count++;
        if(i == cellPer - 1 && conwayGrid[0][j].alive)
            count++;
        if(j == 0 && conwayGrid[i][cellPer-1].alive)
            count++;
        if(j == cellPer - 1 && conwayGrid[i][0].alive)
            count++;

        return count;
    }

    function shuffleConway(){
        for(let row = 0; row < cellPer; row++){
            for(let col = 0; col < cellPer; col++){
                let alive = Math.random() < aliveInitChance ? true : false;
                conwayGrid[row][col].alive = alive;
            }
        }
    }

    function resetConway(){
        for(let row = 0; row < cellPer; row++){
            for(let col = 0; col < cellPer; col++){
                conwayGrid[row][col].alive = false;
            }
        }
    }

    function genGridItem(i,j){
        let alive = Math.random() < aliveInitChance ? true : false;
        conwayGrid[i][j] = new ConwayCell(alive, `con-${i}-${j}`);
    }

</script>

<svelte:window on:mousedown={beginDrag} on:mouseup={endDrag} bind:outerWidth={innerWidth}/>
<div class="flex flex-column w-full h-full">
<div class="w-full h-full">
<div class="conway-grid h-full w-full" id="conway-grid">
    <table class='conway-grid-inner' id='conway-grid-inner' style='height:{height}px; width:{width}px'>
    {#each Array(cellPer) as _ , i}
        <tr>
        {#each Array(cellPer) as _, j}
            {#await genGridItem(i,j) then item}
            <td id='con-{i}-{j}' class='{conwayGrid[i][j].alive ? 'alive' : ''}' style='height:{cellHeight}px; width:{cellWidth}px' on:mousedown={mouseHandler(i, j)} on:mouseenter={mouseHandler(i, j)}>

            </td>
            {/await}
        {/each}
        </tr>
    {/each}
    </table>
</div>
</div>
<FormSideBar>
    <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>Conway's Game of Life is a cellular automaton simulation where cells on a grid evolve based on simple rules, creating fascinating patterns and behaviors. It serves as a classic example of emergent complexity in a dynamic system. </p>
        <p>You can play the game by clicking any cell to 'activate' it. Once you activated all the cells you want, press play and watch the magic happen.</p>
        <p>You can also reset the game or shuffle it to have randomly activated cells. Check out the <a href="/project-files/conway">project</a> page for more details</p>
    </article>
    <div class="join">
    <div class="tooltip" data-tip={play ? "Pause": "Play"}>
        <button class="btn btn-square join-item" on:click={() => play = !play}>
            {#if !play}
                <i class="fa-solid fa-play"></i>
            {:else}
                <i class="fa-solid fa-pause text-xl"></i>
            {/if}
        </button>
    </div>
    <div class="tooltip" data-tip="Randomize">
        <button class="btn btn-square join-item" on:click={() => shuffleConway()}>
            <i class="fa-solid fa-shuffle text-xl"></i>
        </button>
    </div>
    <div class="tooltip" data-tip="Reset">
        <button class="btn btn-square join-item" on:click={() => resetConway()}>
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
    <input type="range" min="200" max="1000" value={delay} class="range" step="200" on:input={e => delay = e.target.value} />
    <div class="w-full flex justify-between text-xs px-2">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
    </div>
    </label>
    <!-- <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Grid Size</span>
        </div>
    <input type="range" min="30" max="150" value={cellPer} class="range" step="30" on:input={e => cellPer = e.target.value} />
    <div class="w-full flex justify-between text-xs px-2">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
    </div>
    </label> -->
</FormSideBar>
</div>