// Animation system for neural network visualization

export class Particle {
  constructor(startX, startY, endX, endY, color, duration = 500) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    this.duration = duration;
    this.startTime = Date.now();
    this.alive = true;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Ease-in-out function
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    this.x = this.startX + (this.endX - this.startX) * eased;
    this.y = this.startY + (this.endY - this.startY) * eased;

    if (progress >= 1) {
      this.alive = false;
    }

    return this.alive;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export class AnimationManager {
  constructor() {
    this.particles = [];
    this.nodePositions = [];
    this.isAnimating = false;
    this.animationFrame = null;
  }

  setNodePositions(positions) {
    this.nodePositions = positions;
  }

  // Create particles for forward pass
  animateForward(weights, speed = 500) {
    if (!this.nodePositions || this.nodePositions.length < 2) return;

    const particles = [];

    // For each layer connection
    for (let i = 0; i < this.nodePositions.length - 1; i++) {
      const fromLayer = this.nodePositions[i];
      const toLayer = this.nodePositions[i + 1];
      const layerWeights = weights[i];

      // Create particles for significant connections
      for (let j = 0; j < toLayer.length; j++) {
        for (let k = 0; k < fromLayer.length; k++) {
          const weight = Math.abs(layerWeights[j][k]);

          // Only create particles for stronger connections
          if (weight > 0.2) {
            const from = fromLayer[k];
            const to = toLayer[j];

            // Stagger particle start times based on layer
            const delay = i * 150;

            setTimeout(() => {
              const particle = new Particle(
                from.x, from.y,
                to.x, to.y,
                'rgba(59, 130, 246, 0.8)', // Blue
                speed
              );
              this.particles.push(particle);
            }, delay);
          }
        }
      }
    }
  }

  // Create particles for backward pass (gradient flow)
  animateBackward(gradients, speed = 500) {
    if (!this.nodePositions || this.nodePositions.length < 2 || !gradients) return;

    // Go backward through layers
    // gradients array has one entry per hidden/output layer (not input layer)
    for (let i = this.nodePositions.length - 1; i > 0; i--) {
      const fromLayer = this.nodePositions[i];
      const toLayer = this.nodePositions[i - 1];

      // Gradients are indexed by layer (0 = first hidden, 1 = second hidden, 2 = output)
      // We want gradients for the current layer we're looking at
      const gradientIndex = i - 1; // Adjust for no input layer in gradients
      const layerGradients = gradients[gradientIndex];

      if (!layerGradients) continue;

      // Create particles from current layer back to previous layer
      for (let j = 0; j < fromLayer.length; j++) {
        const gradMagnitude = Math.abs(layerGradients[j] || 0);

        // Show particles for all connections if this node has any gradient
        if (gradMagnitude > 0.01) {
          const from = fromLayer[j];

          // Send gradient particles to all connected nodes in previous layer
          for (let k = 0; k < toLayer.length; k++) {
            const to = toLayer[k];

            // Stagger based on reverse layer order
            const delay = (this.nodePositions.length - 1 - i) * 150;

            setTimeout(() => {
              const particle = new Particle(
                from.x, from.y,
                to.x, to.y,
                'rgba(239, 68, 68, 0.8)', // Red
                speed
              );
              this.particles.push(particle);
            }, delay);
          }
        }
      }
    }
  }

  // Pulse nodes with gradient magnitude
  pulseNodes(ctx, gradients) {
    if (!this.nodePositions || !gradients) return;

    for (let i = 0; i < this.nodePositions.length; i++) {
      const layerNodes = this.nodePositions[i];
      const layerGradients = gradients[i] || [];

      for (let j = 0; j < layerNodes.length; j++) {
        const { x, y } = layerNodes[j];
        const gradient = Math.abs(layerGradients[j] || 0);

        if (gradient > 0.05) {
          // Draw pulsing ring
          const time = Date.now() / 300;
          const pulseRadius = 20 + Math.sin(time) * 5;
          const alpha = gradient * 0.5;

          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }

  // Update and draw all particles
  update(ctx) {
    // Update all particles
    this.particles = this.particles.filter(particle => particle.update());

    // Draw all particles
    this.particles.forEach(particle => particle.draw(ctx));

    return this.particles.length > 0;
  }

  clear() {
    this.particles = [];
  }

  hasParticles() {
    return this.particles.length > 0;
  }
}
