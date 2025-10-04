---
layout: "../../layouts/PostLayout.astro"
title: "Conway's Game of Life"
description: "A recreation of Conway's Game of Life with Javascript and Svelte."
pubDate: "Oct 16 2022"
heroImage: "/conway.png"
tags: [ "cellular automata", "live demo" ]
categories: [ "Cellular Automata", "Web Development" ]
badge: "Demo"
---

Conway's Game of Life is a cellular automaton that was created by the British mathematician John Horton Conway in 1970. It is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves.

## Rules

The universe of the Game of Life is an infinite, two-dimensional orthogonal grid of square cells, each of which is in one of two possible states, live or dead. Every cell interacts with its eight neighbors, which are the cells that are horizontally, vertically, or diagonally adjacent.

At each step in time, the following transitions occur:

1. **Any live cell with fewer than two live neighbors dies, as if by underpopulation.**
2. **Any live cell with two or three live neighbors lives on to the next generation.**
3. **Any live cell with more than three live neighbors dies, as if by overpopulation.**
4. **Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.**

These rules, which compare the behavior of the automaton to real life, can be condensed into the following:

1. **Any live cell with two or three live neighbors survives.**
2. **Any dead cell with three live neighbors becomes a live cell.**
3. **All other live cells die in the next generation. Similarly, all other dead cells stay dead.**

## Implementation

### The Grid

In order to implement Conway's Game of Life, we need to set a few things up. Firstly, we need to create a grid of cells, an HTML table in my case. Each cell will be a `div` element with a class of `alive` if it is alive, and no class if it is dead. We will also need to create a 2D array to store the state of each cell.

Cells also need to be easily accessible, so we will give each cell an `id` that is based on its row and column. This will allow us to easily access the state of any cell by using `document.getElementById()`.

```svelte
<script>
    let width = 500;
    let height = 500;
    let cellPer = 50; // Number of cells per row and column, we want a square grid so this will be the same for both.
    let cellWidth = 10;
    let cellHeight = 10;
    let grid = [...Array(cellPer)].map(e => Array(cellPer));

    onMount(() => {
        width = document.getElementById("grid-wrapper").clientWidth;
        height = document.getElementById("grid-wrapper").clientHeight;

        // Get a cell width and height that are more or less equal based on the width and height of the grid
        cellWidth = Math.floor(width / cellPer);
        cellHeight = Math.floor(height / cellPer);
    });
</script>

<div id="grid-wrapper">
    <table class='conway-grid-inner' id='conway-grid-inner' style='height:{height}px; width:{width}px'>
        {#each Array(cellPer) as _ , i}
            <tr>
            {#each Array(cellPer) as _, j}
                {#await genGridItem(i,j) then item}
                <td id='con-{i}-{j}' class='{grid[i][j].alive ? 'alive' : ''}' style='height:{cellHeight}px; width:{cellWidth}px'>
                </td>
                {/await}
            {/each}
            </tr>
        {/each}
    </table>
</div>

```

To generate the grid, we will use a function called `genGridItem` that will return a promise. This function will be called for each cell in the grid, and it will return an object that represents the state of the cell. This object will have a property called `alive` that will be set to `true` if the cell is alive, and `false` if the cell is dead.

```javascript

function genGridItem(i,j){
        let alive = Math.random() < aliveInitChance ? true : false;
        conwayGrid[i][j] = new ConwayCell(alive, `con-${i}-${j}`);
    }

```

### The Rules

Once we have our grid set up, we can start implementing the rules. We will create a function that will be called every `n` milliseconds to update the state of the grid. This function will loop through each cell and apply the rules to determine the next state of the cell.

```javascript

async function playConway(){
        // Generate temporary grid, we don't want to update the grid while we are still calculating the next state
        let temp = [...Array(cellPer)].map(e => Array(cellPer))

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

```

This function creates a temporary grid that will store the next state of each cell. It then loops through each cell and calculates the number of living neighbors. Based on the number of living neighbors, it will determine the next state of the cell and store it in the temporary grid. Once all cells have been updated, the temporary grid will replace the old grid.

As you can see, the logic is fairly simple and straightforward. The only thing that is left to do is to create a function that will count the number of living neighbors for a given cell.

```javascript

function countNeighbors(row, col){
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

        return count;
    }

```

This function simply checks the state of each neighbor and increments a counter if the neighbor is alive. Once all neighbors have been checked, the function will return the number of living neighbors.

## Conclusion

And that's it! We now have a fully functional implementation of Conway's Game of Life. If you want, you can add some additional features such as the ability to add or remove cells by clicking on the grid, or the ability to adjust the speed of the simulation.

You can see a live demo of the game [here](https://joshgracie.com/demos/conwaydemo) on my portfolio. Click on the grid to add or remove cells, and press the play button to start the simulation. You can also adjust the speed of the simulation using the slider.

I hope you enjoyed this tutorial, and I hope you have fun experimenting with Conway's Game of Life! If you have any questions or comments, feel free to leave them below.

Happy coding!

## References

- [Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life): Conway's Game of Life
- [Conway's Game of Life](https://bitstorm.org/gameoflife/): A great resource for learning more about Conway's Game of Life
- [Conway's Game of Life](https://www.conwaylife.com/): Another great resource for learning more about Conway's Game of Life