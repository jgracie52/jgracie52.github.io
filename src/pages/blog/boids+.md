---
layout: "../../layouts/PostLayout.astro"
title: "Boids+"
description: "A bird flocking simulation using the Boids algorithm."
pubDate: "Mar 3 2024"
published: false
heroImage: "/boids.png"
tags: [ "simulation", "live demo" ]
categories: [ "Simulations", "Algorithms" ]
badge: "Demo"
---

Most of us who have spent any time on YouTube have undoubtedly seen a myriad of videos discussing boids algorithm. After all, it is fairly simple to implement, and
extremely fun to watch. But what if I told you there was an even better way to simulate bird flocking? Well, I'm here to tell you that there is! And it's called

..._cue drumroll_...

Roids! 

Just kidding, it's actually from a paper called 'V-like Formations in Flocks of Artificial Birds' by Andre Nathan and Valmir C. Barbosa, but I think Roids would have been a much cooler name. For now, I'll just call it Boids+.

## Refresh

Quick refresher on the original Boids algorithm. It was created by Craig Reynolds in 1986, and it simulates the flocking behavior of birds. The algorithm is based on three simple rules:

1. **Separation**: Each boid steers to avoid crowding local flockmates.
2. **Alignment**: Each boid steers towards the average heading of local flockmates.
3. **Cohesion**: Each boid steers to move towards the average position of local flockmates.

By following these three rules, the boids are able to simulate the complex flocking behavior of birds, fish, and other animals. Fun fact: the term "boids" is a portmanteau of "bird-oid object", who knew?

## Boids+

The algorithm from 'V-like Formations in Flocks of Artificial Birds' (Boids+) is similar to the original Boids algorithm. It was created by Andre Nathan and Valmir C. Barbosa in 200+, and it uses a similar, but slightly more complex set of rules:

1. **Coalescence**: Each boid steers to move towards the nearest flockmate.
2. **Gap Seeking**: If rule 1 no longer applies, each boid steers to the nearest position that affords an unobstructed _forward_ view.
3. **Stationing**: Apply Rule 2 while the view that is sought is not obtained or the effort to keep up with the group decreases due to increased upwash.

Now, I know what you're thinking, "What on earth is an upwash?" Well, upwash is the upward flow of air that is created by the flapping of wings. It's a key component of the Boids+ algorithm, and it's what allows the boids to simulate the V-like formations that are often seen in bird flocks.

A way that you can think of upwash is as a sort of "wind tunnel" that is created by the flapping of wings. Boids will seek out this upwash (as opposed to a downwash) in order to conserve energy and stay in formation.

Typically, upwash is found in the wake of a bird, with two regions of upwash to the left and right of the bird. A region of downwash is found directly behind the bird.

## Parameters

In order to execute the rules, we need to define some parameters. The parameters that we will use are based on the original paper:

- **l**: The lateral distance of the upwash region.
- **d**: The longitudinal distance of the upwash region.
- **w**: The wing span of the boid.
