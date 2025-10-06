// Core Neural Network implementation with visualization support

export class NeuralNetwork {
  constructor(layers, activationFn = 'sigmoid', learningRate = 0.1) {
    this.layers = layers; // e.g., [2, 4, 4, 1]
    this.activationFn = activationFn;
    this.learningRate = learningRate;

    // Network state
    this.weights = [];
    this.biases = [];
    this.activations = [];
    this.zValues = []; // Pre-activation values
    this.gradients = [];

    this.initializeWeights();
  }

  initializeWeights() {
    this.weights = [];
    this.biases = [];

    // Xavier/He initialization
    for (let i = 0; i < this.layers.length - 1; i++) {
      const inputSize = this.layers[i];
      const outputSize = this.layers[i + 1];

      // Xavier initialization: sqrt(1/n)
      const scale = Math.sqrt(1 / inputSize);

      const layerWeights = [];
      for (let j = 0; j < outputSize; j++) {
        const neuronWeights = [];
        for (let k = 0; k < inputSize; k++) {
          neuronWeights.push((Math.random() * 2 - 1) * scale);
        }
        layerWeights.push(neuronWeights);
      }
      this.weights.push(layerWeights);

      // Initialize biases to zero
      this.biases.push(Array(outputSize).fill(0));
    }
  }

  // Activation functions
  activate(x, derivative = false) {
    switch (this.activationFn) {
      case 'sigmoid':
        if (derivative) {
          const sig = this.sigmoid(x);
          return sig * (1 - sig);
        }
        return this.sigmoid(x);

      case 'relu':
        if (derivative) {
          return x > 0 ? 1 : 0;
        }
        return Math.max(0, x);

      case 'tanh':
        if (derivative) {
          const t = Math.tanh(x);
          return 1 - t * t;
        }
        return Math.tanh(x);

      default:
        return this.sigmoid(x);
    }
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); // Clip for stability
  }

  // Forward pass - stores activations for backprop and visualization
  forward(input) {
    this.activations = [];
    this.zValues = [];

    // Input layer
    this.activations.push([...input]);

    // Hidden and output layers
    for (let i = 0; i < this.weights.length; i++) {
      const prevActivations = this.activations[i];
      const layerWeights = this.weights[i];
      const layerBiases = this.biases[i];

      const z = [];
      const a = [];

      // For each neuron in current layer
      for (let j = 0; j < layerWeights.length; j++) {
        const neuronWeights = layerWeights[j];

        // Weighted sum + bias
        let sum = layerBiases[j];
        for (let k = 0; k < prevActivations.length; k++) {
          sum += prevActivations[k] * neuronWeights[k];
        }

        z.push(sum);
        a.push(this.activate(sum));
      }

      this.zValues.push(z);
      this.activations.push(a);
    }

    return this.activations[this.activations.length - 1];
  }

  // Backward pass - computes gradients
  backward(input, target) {
    const output = this.activations[this.activations.length - 1];
    this.gradients = [];

    // Output layer error (MSE derivative)
    let delta = [];
    for (let i = 0; i < output.length; i++) {
      const error = output[i] - target[i];
      const derivative = this.activate(this.zValues[this.zValues.length - 1][i], true);
      delta.push(error * derivative);
    }
    this.gradients.unshift(delta);

    // Backpropagate through hidden layers
    for (let i = this.weights.length - 2; i >= 0; i--) {
      const nextDelta = [];

      for (let j = 0; j < this.layers[i + 1]; j++) {
        let error = 0;
        for (let k = 0; k < this.weights[i + 1].length; k++) {
          error += this.weights[i + 1][k][j] * delta[k];
        }
        const derivative = this.activate(this.zValues[i][j], true);
        nextDelta.push(error * derivative);
      }

      delta = nextDelta;
      this.gradients.unshift(delta);
    }

    // Update weights and biases
    this.updateWeights();
  }

  updateWeights() {
    for (let i = 0; i < this.weights.length; i++) {
      const prevActivations = this.activations[i];
      const layerGradients = this.gradients[i];

      for (let j = 0; j < this.weights[i].length; j++) {
        // Update biases
        this.biases[i][j] -= this.learningRate * layerGradients[j];

        // Update weights
        for (let k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] -= this.learningRate * layerGradients[j] * prevActivations[k];
        }
      }
    }
  }

  // Train on a single sample
  train(input, target) {
    this.forward(input);
    this.backward(input, target);
  }

  // Predict (forward pass only)
  predict(input) {
    return this.forward(input);
  }

  // Calculate loss (MSE)
  calculateLoss(input, target) {
    const output = this.predict(input);
    let loss = 0;
    for (let i = 0; i < output.length; i++) {
      loss += Math.pow(output[i] - target[i], 2);
    }
    return loss / output.length;
  }

  // Getters for visualization
  getActivations() {
    return this.activations;
  }

  getGradients() {
    return this.gradients;
  }

  getWeights() {
    return this.weights;
  }

  getBiases() {
    return this.biases;
  }

  setLearningRate(rate) {
    this.learningRate = rate;
  }

  setActivationFunction(fn) {
    this.activationFn = fn;
  }
}
