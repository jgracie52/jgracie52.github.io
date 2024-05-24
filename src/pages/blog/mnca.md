---
layout: "../../layouts/PostLayout.astro"
title: "Multi Neighborhood Cellular Automata"
description: "An interactive demo of a multi neighborhood cellular automata"
pubDate: "May 24 2024"
heroImage: "/MNCA.gif"
tags: [ "cellular automata", "live demo" ]
badge: "Demo"
---

In my previous post about [Conway's Game of Life in TensorFlow](/blog/conwaytensor), I implemented Conway's Game of Life using TensorFlowJS. In that implementation, I used a 2D tensor to represent the state of each cell and updated the state of each cell based on the state of its neighbors. Using that tensor, I was able to update the state of each cell in parallel, which was much faster than using a 2D array and updating an HTML table.

While that implementation certainly worked, it was limited to the standard Moore neighborhood, where each cell has 8 neighbors. In this post, I will be implementing a multi neighborhood cellular automata using TensorFlowJS. This will allow me to define custom neighborhoods for each cell, which can lead to much more interesting and complex patterns.

I'm going to spare myself from rewriting the basics of cellular automata and jump straight into the implementation. If you're not familiar with cellular automata, I recommend reading my previous post on [Conway's Game of Life](/blog/conwaytensor) first.

## Defining the Neighborhoods

Just like in Conway's Game of Life, we need to represent the neighborhood's of MNCA as a 3D tensor. However, instead of using a fixed kernel for convolution, we will define custom neighborhoods for each cell. The first dimension represents the number of neighbors, and the second and third dimensions represent the relative positions of each neighbor.

```javascript
// Create an array of 0s with a single 1 in the middle
let nhArray = Array.from({length: 17}, () => Array.from({length: 17}, () => 0));
nhArray[8][8] = 1;

// Convert the array to a tensor
this.nhTensor = tf.tensor(nhArray).expandDims(2).expandDims(3);
```

The above code creates a 17x17 array with a single 1 in the middle. We then convert the array to a tensor and expand the dimensions to match the shape of the population tensor. This gives us a custom neighborhood tensor that we can use to calculate the number of live neighbors for each cell.

Since we have unique neighborhoods, we can define custom rules for each of the 17x17 neighborhoods. This allows us to create much more complex patterns than the standard Moore neighborhood.

## The Rules

Each rule is a simple _neighborAvg_>=_lower bound_ && _neighborAvg_<=_upper bound_ statement. The _neighborAvg_ is the number of live neighbors for the current cell, and the _lower bound_ and _upper bound_ are the minimum and maximum number of live neighbors for the cell to survive.

Each rule can also have an _alive_ flag, which determines if the cell should be alive or dead based on the rule. This allows us to define rules for both survival and birth. We can also define the order of the rules, which determines the order in which the rules should be applied, with lower order rules taking precedence over higher order rules.

With this information, can define a class to represent the rules so that we can easily add new rules and test different configurations.

```javascript
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
```

Now that we have a way to define the rules and the neighborhood tensors, we can now create a class to hold both the rules and the neighborhoods.

```javascript
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
```

The above code creates a class that holds the neighborhood tensor and the rules for the neighborhood. The constructor initializes the neighborhood tensor and creates a single rule for the neighborhood.

## The Simulation

Now that we have the neighborhoods and the rules, we can begin to work on the simulation. We can start by grabbing a copy of the population tensor, and the _wasAlive_ tensor, which will be used to determine if a cell was alive in the previous generation.

```javascript
 let newPop = tf.tidy(() =>{
            // Create a copy of the population tensor
            let newPopulation = population.clone().toFloat();
            let wasAlive = tf.equal(newPopulation, 1);
    
    ...
 });
```

> **Note:** I'm using the `tf.tidy` function to clean up any intermediate tensors that are created during the simulation. This helps prevent memory leaks and keeps the code clean.

Next, we can start iterating over the neighborhoods and applying the rules to the population tensor. 

```javascript
...

// Perform the convolutions using the neighborhoods
let calculatedRules = [neighborhoodsOrderArray().length];
for(let nh of neighborhoods){
    let convolvedPopulation = tf.conv2d(newPopulation, nh.nhTensor, 1, 'same');
    let neighbors = tf.sub(convolvedPopulation, newPopulation);

    // Average the neighbors by dividing by the number of cells in the neighborhood (i.e. the number of 1s in the neighborhood tensor -1 for the center cell)
    let nhSum = tf.sum(nh.nhTensor);
    let neighborsAvg = tf.div(neighbors, nhSum);

    ...
}

...
```

In the above code, we first create an array to store our calculated rules (defined later) so that we can apply them in order. We need to do this since the order of the rules can affect the outcome of the simulation. Because the rules are defined in the neighborhoods, we need to store the final rules in an array so that we can apply them in order with esae later on.

Next, we iterate through the rules of the neighborhood and apply the rules to the cells.

```javascript
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
```

In the above code, we first generate the upper and lower rules for the neighborhood rule. We then apply the rules to the neighbors average tensor to get the rule population. If the rule is for the cell to be alive, we insert it directly into the calculated rules array. If the rule is for the cell to be dead, we invert the rule population before inserting it into the calculated rules array.

The reason we invert the rule population for dead cells is that we want to make sure that only the cells that were alive are affected by the rule. We can do that by making every cell that is not affected by the rule alive, and then ANDing the rule population with the population tensor. This, in effect, makes sure that only the cells that were alive and should now be dead are affected by the rule.

Finally, we can apply the calculated rules to the population tensor.

```javascript
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
```

We first set the final population tensor to the _wasAlive_ tensor, which is a boolean of the previous state of each cell. We then use logical operators, OR for alive cells and AND for dead cells, to combine the rules in order.

Finally, we update the population tensor with the final population tensor and return the new population tensor.

## The Demo

I've created an interactive demo of the MNCA using TensorFlowJS. You can find the demo [here](joshgracie.com/demos/mnca). The demo allows you to create custom neighborhoods and rules, and see how they affect the simulation. You can also choose from a list of pre-defined neighborhoods and rules to see how they affect the simulation.

You also have the ability to change the speed and zoom of the simulation, but be warned that the simulation can be quite slow on older devices. There is also a function to allow you to click-drag new cells into the simulation, which can be quite fun to play with.

## Conclusion

In this post, I implemented a multi neighborhood cellular automata using TensorFlowJS. I defined custom neighborhoods for each cell and created rules for each neighborhood. I then applied the rules to the population tensor to simulate the automata.

The MNCA is much more flexible than the standard Conway's Game of Life, as it allows for custom neighborhoods and rules. This can lead to much more complex and interesting patterns than the standard Moore neighborhood.

I hope you enjoyed this post and found it informative. If you have any questions or comments, please feel free to leave them below. Thanks for reading!

## References

- [TensorFlowJS](https://www.tensorflow.org/js): TensorFlowJS documentation
- [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life): Wikipedia page on Conway's Game of Life
- [MNCA Demo](joshgracie.com/demos/mnca): An interactive demo of the MNCA
- [Slackermanz](https://www.slackermanz.com/): For the inspiration for this post