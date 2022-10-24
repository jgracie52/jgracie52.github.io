<script>
    import { onMount, tick } from 'svelte';

    class ConwayCell {
        constructor(alive, td){
            this.alive = alive;
            this.td = td;
        }
    }

    let gridSize = 32;
    let aliveInitChance = 0.2;
    let delay = 500;
    let gridParent = null;
    let innerWidth = 0;
    let width = 500;
    let cellWidth = 0;
    let play = true;
    let conwayGrid = [...Array(gridSize)].map(e => Array(gridSize));
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
        document.addEventListener("DOMContentLoaded", function() {
            gridParent = document.getElementById('conway-grid');
            gridParent.style.height = gridParent.clientWidth;
            cellWidth = width / gridSize;
        });

        width = innerWidth < 500 ? innerWidth : 500;

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
        let temp = [...Array(gridSize)].map(e => Array(gridSize))

        // Loop over the grid
        for(let row = 0; row < gridSize; row++){
            for(let col = 0; col < gridSize; col++){
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
        for(let row = 0; row < gridSize; row++){
            for(let col = 0; col < gridSize; col++){
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
        if(i != 0 && j != gridSize - 1 && conwayGrid[i-1][j+1].alive)
            count++;
        if(j != 0 && conwayGrid[i][j-1].alive)
            count++;
        if(j != 0 && i != gridSize - 1 && conwayGrid[i+1][j-1].alive)
            count++;
        if(i != gridSize - 1 && j != gridSize - 1 && conwayGrid[i+1][j+1].alive)
            count++;
        if(i != gridSize - 1 && conwayGrid[i+1][j].alive)
            count++;
        if(j != gridSize - 1 && conwayGrid[i][j+1].alive)
            count++;

        return count;
    }

    function shuffleConway(){
        for(let row = 0; row < gridSize; row++){
            for(let col = 0; col < gridSize; col++){
                let alive = Math.random() < aliveInitChance ? true : false;
                conwayGrid[row][col].alive = alive;
            }
        }
    }

    function resetConway(){
        for(let row = 0; row < gridSize; row++){
            for(let col = 0; col < gridSize; col++){
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
<!-- <div class="text-5xl font-bold inline">Conway's <div class="inline text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500">Game of Life</div></div> -->
<div class="toolbar space-x-1">
    <div class="tooltip" data-tip={play ? "Pause": "Play"}>
        <button class="btn btn-square" on:click={() => play = !play}>
            {#if !play}
                <i class="fa-solid fa-play"></i>
            {:else}
                <i class="fa-solid fa-pause text-xl"></i>
            {/if}
        </button>
    </div>
    <div class="tooltip" data-tip="Randomize">
        <button class="btn btn-square" on:click={() => shuffleConway()}>
            <i class="fa-solid fa-shuffle text-xl"></i>
        </button>
    </div>
    <div class="tooltip" data-tip="Reset">
        <button class="btn btn-square" on:click={() => resetConway()}>
            <i class="fa-solid fa-rotate-right text-xl"></i>
        </button>
    </div>
    <div class="tooltip" data-tip="Github Repo">
        <button class="btn btn-square" href="">
            <i class="fa-brands fa-github text-xl"></i>
        </button>
    </div>
</div>
<div id="conway-grid">
    <table class='conway-grid-inner' id='conway-grid-inner' style='height:{width}px; width:{width}px'>
    {#each Array(gridSize) as _ , i}
        <tr>
        {#each Array(gridSize) as _, j}
            {#await genGridItem(i,j) then item}
            <td id='con-{i}-{j}' class='{conwayGrid[i][j].alive ? 'alive' : ''}' style='height:{cellWidth}px; width:{cellWidth}px' on:mousedown={mouseHandler(i, j)} on:mouseenter={mouseHandler(i, j)}>

            </td>
            {/await}
        {/each}
        </tr>
    {/each}
    </table>
</div>