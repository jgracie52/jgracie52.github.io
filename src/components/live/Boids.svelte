<script>
    import FormSideBar from "./FormSideBar.svelte";
    import { onMount } from "svelte";

    let boidsCanvas;
    let ctx;
    let boids = [];
    let boidCount = 100;
    let boidSpeed = 1;
    let boidMinSpeed = 0.5;
    let boidMaxSpeed = 2;
    let boidSize = 10;
    let boidSight = 100;
    let separationWeight = 0.25;
    let alignmentWeight = 0.25;
    let cohesionWeight = 0.25;
    let interval;

    onMount(() => {
        boidsCanvas = document.getElementById('boidsCanvas');
        ctx = boidsCanvas.getContext('2d');
        boidsCanvas.width = window.innerWidth;
        boidsCanvas.height = window.innerHeight;
        initBoids();
        drawBoids();

        interval = setInterval(() => {
            // Move the boids
            for (let i = 0; i < boids.length; i++) {
                moveBoid(boids[i]);
            }

            // Finally draw the boids
            // Fire as an async function to allow for the canvas to be cleared
            drawBoids();
        }, 1000 / 60);
    });

    class Boid {
        constructor(x, y, dx, dy) {
            this.x = x;
            this.y = y;
            this.vx = dx;
            this.vy = dy;
        }
    }

    function initBoids() {
        for (let i = 0; i < boidCount; i++) {
            boids.push(new Boid(Math.random() * boidsCanvas.width, Math.random() * boidsCanvas.height, Math.random() * boidSpeed, Math.random() * boidSpeed));
        }
    }

    function moveBoid(boid) {
        // Move the boid based on its direction
        // Dx and dy are the velocity of the boid

        let acceleration = calculateForces(boid);
        let velocity = { x: boid.vx, y: boid.vy };
        let dir = {x: 0, y: 0};

        velocity.x += acceleration.x;
        velocity.y += acceleration.y;

        let speed = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
        dir.x = (velocity.x / speed);
        dir.y = (velocity.y / speed);
        speed = clamp(speed, boidMinSpeed, boidMaxSpeed);

        velocity.x = dir.x * speed;
        velocity.y = dir.y * speed;

        // We now have the velocity of the boid, so we can move it
        // But, we don't want the boid to instantly turn to the new direction, so we'll lerp the velocity
        boid.vx = lerp(boid.vx, velocity.x, 0.1);
        boid.vy = lerp(boid.vy, velocity.y, 0.1);

        // Move the boid
        boid.x += boid.vx;
        boid.y += boid.vy;

        // Wrap around the screen
        if (boid.x > boidsCanvas.width) {
            boid.x = 0;
        } else if (boid.x < 0) {
            boid.x = boidsCanvas.width;
        }

        if (boid.y > boidsCanvas.height) {
            boid.y = 0;
        } else if (boid.y < 0) {
            boid.y = boidsCanvas.height;
        }
    }

    function calculateForces(boid) {
        // Calculate the forces of the boid based on the rules of Boids

        // Calculate the vectors for separation, alignment, and cohesion
        let separation = { x: 0, y: 0 };
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let nearbyCount = 0;

        for(let i = 0; i < boids.length; i++){
            if(boids[i] === boid) continue;

            // Calculate distance considering wraparound
            let dx = boids[i].x - boid.x;
            let dy = boids[i].y - boid.y;

            // Check if wrapping around gives a shorter distance
            if (Math.abs(dx) > boidsCanvas.width / 2) {
                dx = dx > 0 ? dx - boidsCanvas.width : dx + boidsCanvas.width;
            }
            if (Math.abs(dy) > boidsCanvas.height / 2) {
                dy = dy > 0 ? dy - boidsCanvas.height : dy + boidsCanvas.height;
            }

            let dist = Math.sqrt(dx * dx + dy * dy);

            if(dist < boidSight){
                separation.x += -dx / dist;
                separation.y += -dy / dist;
                alignment.x += boids[i].vx;
                alignment.y += boids[i].vy;
                cohesion.x += dx;
                cohesion.y += dy;
                nearbyCount++;
            }
        }

        // Divide the alignment and cohesion vectors by the number of nearby boids
        if (nearbyCount > 0) {
            alignment.x /= nearbyCount;
            alignment.y /= nearbyCount;
            cohesion.x /= nearbyCount;
            cohesion.y /= nearbyCount;
        }

        // Set the forces of the boid
        let forces = { x: 0, y: 0 };
        forces.x += separation.x * separationWeight + alignment.x * alignmentWeight + cohesion.x * cohesionWeight;
        forces.y += separation.y * separationWeight + alignment.y * alignmentWeight + cohesion.y * cohesionWeight;

        return forces;
    }

    async function drawBoids() {
        ctx.clearRect(0, 0, boidsCanvas.width, boidsCanvas.height);
        for (let i = 0; i < boids.length; i++) {
            // Boids are equilateral triangles
            // The angle of the triangle is the direction of the boid (dx, dy)

            // Get the angle of the boid
            let angle = Math.atan2(boids[i].vy, boids[i].vx) + Math.PI;

            // Draw the boid
            ctx.beginPath();
            ctx.moveTo(boids[i].x, boids[i].y);
            ctx.lineTo(boids[i].x + Math.cos(angle - Math.PI / 6) * 10, boids[i].y + Math.sin(angle - Math.PI / 6) * 10);
            ctx.lineTo(boids[i].x + Math.cos(angle + Math.PI / 6) * 10, boids[i].y + Math.sin(angle + Math.PI / 6) * 10);
            ctx.lineTo(boids[i].x, boids[i].y);
            ctx.fillStyle = 'white';
            ctx.fill();

            // Now draw the direction of the boid as a small line
            ctx.beginPath();
            ctx.moveTo(boids[i].x, boids[i].y);
            ctx.lineTo(boids[i].x + boids[i].vx * 10, boids[i].y + boids[i].vy * 10);
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }

        return 0;
    }

    function setBoidCount(count){
        // Need to restart the boids
        // Remove the setInterval and reinit the boids
        clearInterval(interval);

        boidCount = count;
        boids = [];
        initBoids();
        drawBoids();

        interval = setInterval(() => {
            // Move the boids
            for (let i = 0; i < boids.length; i++) {
                moveBoid(boids[i]);
            }

            // Finally draw the boids
            // Fire as an async function to allow for the canvas to be cleared
            drawBoids();
        }, 1000 / 60);

        return 0;
    }

    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }

    const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
</script>

<div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll">
        <canvas id="boidsCanvas" class="w-full h-full" />
    </div>
    <FormSideBar>
        <article class="prose mb-4">
            <h2>Instructions</h2>
            <p>
                This is a simple implementation of the <a href="https://cs.stanford.edu/people/eroberts/courses/soco/projects/2008-09/modeling-natural-systems/boids.html">Boids</a> algorithm. The Boids algorithm is a simple algorithm that simulates the flocking behavior of birds. The algorithm is based on three simple rules: separation, alignment, and cohesion.</p>
            <p>The separation rule ensures that boids do not collide with each other, the alignment rule ensures that boids move in the same direction, and the cohesion rule ensures that boids stay close to each other.</p>
            <p>You can use the sliders below to adjust these values as well as the number of boids and how far they can see around them.</p>
            <p>Check out the <a href="/project-files/boids">project</a> page for more details.</p>
        </article>
        <label for="speed">Number of Boids</label>
        <input class="range range-xs range-primary" type="range" id="speed" name="speed" min="50" max="500" value={boidCount} step="50" on:input={e => setBoidCount(e.target.value)}>
        <label for="speed" class="block">{boidCount}</label>

        <label for="speed">Sight Range</label>
        <input class="range range-xs range-primary" type="range" id="speed" name="speed" min="50" max="500" value={boidSight} step="50" on:input={e => boidSight = e.target.value}>
        <label for="speed" class="block">{boidSight}</label>

        <label for="speed">Separation Factor</label>
        <input class="range range-xs range-primary" type="range" id="speed" name="speed" min="0.25" max="5" value={separationWeight} step="0.25" on:input={e => separationWeight = e.target.value}>
        <label for="speed" class="block">{separationWeight}</label>

        <label for="generations">Alignment Factor</label>
        <input class="range range-xs range-primary" type="range" id="generations" name="generations" min="0.25" max="5" value={alignmentWeight} step="0.25" on:input={e => alignmentWeight = e.target.value}>
        <label for="generations" class="block">{alignmentWeight}</label>

        <label for="generations">Cohesion Factor</label>
        <input class="range range-xs range-primary" type="range" id="generations" name="generations" min="0.25" max="5" value={cohesionWeight} step="0.25" on:input={e => cohesionWeight = e.target.value}>
        <label for="generations" class="block">{cohesionWeight}</label>

    </FormSideBar>
</div>