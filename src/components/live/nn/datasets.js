// Training datasets for neural network visualization

export const datasets = {
  // XOR Problem - Classic non-linearly separable problem
  xor: {
    name: 'XOR',
    data: [
      { input: [0.15, 0.15], target: [0], label: 0 },
      { input: [0.15, 0.85], target: [1], label: 1 },
      { input: [0.85, 0.15], target: [1], label: 1 },
      { input: [0.85, 0.85], target: [0], label: 0 },
    ],
    description: 'Classic XOR problem - non-linearly separable',
  },

  // Circle Dataset - Inner vs outer circle
  circle: {
    name: 'Circle',
    data: generateCircleData(),
    description: 'Inner circle (class 0) vs outer ring (class 1)',
  },

  // Spiral Dataset - Two interleaved spirals
  spiral: {
    name: 'Spiral',
    data: generateSpiralData(),
    description: 'Two interleaved spirals - highly non-linear',
  },

  // Diagonal Split - Simple linear problem
  diagonal: {
    name: 'Diagonal',
    data: generateDiagonalData(),
    description: 'Simple diagonal split - linearly separable',
  },
};

// Generate circle dataset
function generateCircleData() {
  const data = [];
  const numPoints = 50;

  // Inner circle (class 0)
  for (let i = 0; i < numPoints / 2; i++) {
    const angle = (i / (numPoints / 2)) * Math.PI * 2;
    const radius = 0.2 + Math.random() * 0.1;
    const x = 0.5 + Math.cos(angle) * radius;
    const y = 0.5 + Math.sin(angle) * radius;
    data.push({ input: [x, y], target: [0], label: 0 });
  }

  // Outer circle (class 1)
  for (let i = 0; i < numPoints / 2; i++) {
    const angle = (i / (numPoints / 2)) * Math.PI * 2;
    const radius = 0.4 + Math.random() * 0.1;
    const x = 0.5 + Math.cos(angle) * radius;
    const y = 0.5 + Math.sin(angle) * radius;
    data.push({ input: [x, y], target: [1], label: 1 });
  }

  return data;
}

// Generate spiral dataset
function generateSpiralData() {
  const data = [];
  const numPoints = 50;

  // Spiral 1 (class 0)
  for (let i = 0; i < numPoints / 2; i++) {
    const t = i / (numPoints / 2);
    const angle = t * Math.PI * 3;
    const radius = t * 0.4;
    const x = 0.5 + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.05;
    const y = 0.5 + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.05;
    data.push({ input: [x, y], target: [0], label: 0 });
  }

  // Spiral 2 (class 1)
  for (let i = 0; i < numPoints / 2; i++) {
    const t = i / (numPoints / 2);
    const angle = t * Math.PI * 3 + Math.PI;
    const radius = t * 0.4;
    const x = 0.5 + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.05;
    const y = 0.5 + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.05;
    data.push({ input: [x, y], target: [1], label: 1 });
  }

  return data;
}

// Generate diagonal split dataset
function generateDiagonalData() {
  const data = [];
  const numPoints = 50;

  for (let i = 0; i < numPoints; i++) {
    const x = Math.random();
    const y = Math.random();

    // Points below diagonal are class 0, above are class 1
    const label = x + y > 1 ? 1 : 0;
    data.push({ input: [x, y], target: [label], label });
  }

  return data;
}

// Get dataset by name
export function getDataset(name) {
  return datasets[name] || datasets.xor;
}

// Get all dataset names
export function getDatasetNames() {
  return Object.keys(datasets);
}
