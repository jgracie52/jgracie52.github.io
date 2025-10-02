<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-8">
      <div class="flex flex-col gap-8">
        <!-- Cipher Visualization -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Caesar Cipher Encryption</h2>

          <!-- Plain Text with Letter Highlighting -->
          <div class="mb-2">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Plain Text:</h3>
            <div class="text-lg font-mono leading-relaxed">
              <span
                v-for="(char, index) in plainText"
                :key="`plain-${index}`"
                :class="{ 'bg-primary text-primary-content px-1 rounded': currentCharIndex === index && isEncrypting }"
                class="transition-colors duration-200"
              >
                {{ char }}
              </span>
            </div>
          </div>

          <!-- Alphabet Shift Mapping -->
          <div class="mb-4 bg-base-300 p-4 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-500 mb-3">Alphabet Shift Mapping (Shift: {{ shift }}):</h3>
            <div class="flex justify-center gap-1 flex-wrap">
              <div
                v-for="(char, index) in alphabet"
                :key="`alpha-${index}`"
                class="flex flex-col items-center transition-all duration-200"
                :class="{ 'scale-125': isCurrentCharInCodex(char) && isEncrypting }"
              >
                <div
                  class="w-8 h-8 flex items-center justify-center font-mono font-bold rounded transition-colors duration-200"
                  :class="{ 'bg-primary text-primary-content': isCurrentCharInCodex(char) && isEncrypting }"
                >
                  {{ char }}
                </div>
                <div class="text-xs opacity-50 my-1">↓</div>
                <div
                  class="w-8 h-8 flex items-center justify-center font-mono font-bold rounded transition-colors duration-200"
                  :class="{ 'bg-secondary text-secondary-content': isCurrentCharInCodex(char) && isEncrypting }"
                >
                  {{ getShiftedChar(char) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Cipher Text -->
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Cipher Text:</h3>
            <div class="text-lg font-mono leading-relaxed">
              <span
                v-for="(char, index) in cipherText"
                :key="`cipher-${index}`"
                :class="{ 'bg-secondary text-secondary-content px-1 rounded': currentCharIndex === index && isEncrypting }"
                class="transition-colors duration-200"
              >
                {{ char }}
              </span>
            </div>
          </div>
        </div>

        <!-- Frequency Analysis -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Frequency Analysis</h2>
          <canvas id="frequencyChart" class="w-full" style="max-height: 300px;"></canvas>

          <div class="mt-4 grid grid-cols-2 gap-4">
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Most Frequent (Cipher)</div>
              <div class="stat-value text-primary">{{ mostFrequentCipher }}</div>
              <div class="stat-desc">{{ mostFrequentPlainChar ? `Actually represents '${mostFrequentPlainChar}'` : 'In analysis...' }}</div>
            </div>
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Detected Shift</div>
              <div class="stat-value text-secondary">{{ detectedShift }}</div>
              <div class="stat-desc">{{ detectedShift === shift ? 'Correct!' : 'Analyzing...' }}</div>
            </div>
          </div>

          <!-- Estimated Plaintext -->
          <div class="mt-6" v-if="cipherText.length > 0">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Estimated Plaintext (using detected shift {{ detectedShift }}):</h3>
            <div class="bg-base-300 p-4 rounded-lg">
              <div class="text-lg font-mono leading-relaxed">
                {{ estimatedPlaintext }}
              </div>
              <div class="mt-3 text-sm" :class="detectedShift == shift ? 'text-success' : 'text-warning'">
                {{ detectedShift == shift ? '✓ Decryption successful!' : detectedShift === 0 ? '⚠ Need more text (min 10 letters)' : '⚠ Detected shift may be inaccurate - longer text gives better results' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          The Caesar cipher is one of the simplest encryption techniques. Each letter in the plaintext is shifted a fixed number of positions down the alphabet.
        </p>
        <p>
          Click Play to watch the encryption process word by word. The frequency analysis shows how often each letter appears, which can be used to crack the cipher!
        </p>
      </article>

      <div class="flex flex-col gap-4">
        <!-- Control Buttons -->
        <div class="join w-full">
          <div class="tooltip" :data-tip="isEncrypting ? 'Pause' : 'Play'">
            <button class="btn btn-square join-item" @click="toggleEncryption">
              <i v-if="!isEncrypting" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-pause text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Randomize Text">
            <button class="btn btn-square join-item" @click="randomizeText">
              <i class="fa-solid fa-shuffle text-xl"></i>
            </button>
          </div>
          <div class="tooltip" data-tip="Reset">
            <button class="btn btn-square join-item" @click="reset">
              <i class="fa-solid fa-rotate-right text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Speed Control -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Encryption Speed</span>
          </div>
          <input
            type="range"
            min="100"
            max="1000"
            v-model="speed"
            class="range range-primary"
            step="100"
          />
          <div class="w-full flex justify-between text-xs px-2">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </label>

        <!-- Shift Control -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Cipher Shift: {{ shift }}</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            v-model.number="shift"
            class="range range-secondary"
            step="1"
            @input="onShiftChange"
          />
        </label>

        <!-- Plain Text Input -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Plain Text (max 200 chars)</span>
          </div>
          <textarea
            v-model="plainText"
            class="textarea textarea-bordered h-24"
            maxlength="200"
            placeholder="Enter text to encrypt..."
            @input="onTextChange"
          ></textarea>
          <div class="label">
            <span class="label-text-alt">{{ plainText.length }}/200</span>
          </div>
        </label>
      </div>

      <article class="prose mt-4">
        <h3>How to Break It</h3>
        <p class="text-sm">
          In English, 'E' is the most common letter (~12.7% frequency). By finding the most frequent letter in the cipher text and calculating the shift from 'E', you can break the cipher!
        </p>
      </article>
    </FormSideBar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import FormSideBar from './FormSideBar.vue';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const sampleTexts = [
  'The quick brown fox jumps over the lazy dog',
  'To be or not to be that is the question',
  'All that glitters is not gold',
  'A journey of a thousand miles begins with a single step',
  'Knowledge is power and power corrupts',
  'The only thing we have to fear is fear itself',
  'In the beginning was the Word and the Word was with God',
  'Four score and seven years ago our fathers brought forth',
];

const plainText = ref('The quick brown fox jumps over the lazy dog');
const shift = ref(3);
const speed = ref(500);
const isEncrypting = ref(false);
const currentCharIndex = ref(-1);
const cipherText = ref('');
let encryptionInterval = null;
let chart = null;

const currentPlainChar = computed(() => {
  if (currentCharIndex.value >= 0 && currentCharIndex.value < plainText.value.length) {
    return plainText.value[currentCharIndex.value].toUpperCase();
  }
  return '';
});

const currentCipherChar = computed(() => {
  if (currentCharIndex.value >= 0 && currentCharIndex.value < cipherText.value.length) {
    return cipherText.value[currentCharIndex.value].toUpperCase();
  }
  return '';
});

const mostFrequentCipher = computed(() => {
  if (!cipherText.value) return '-';
  const freq = getLetterFrequency(cipherText.value);
  // Filter out zero frequencies and get the first non-zero
  const nonZero = freq.filter(f => f.count > 0);
  return nonZero.length > 0 ? nonZero[0].letter : '-';
});

const mostFrequentPlainChar = computed(() => {
  if (mostFrequentCipher.value === '-') return '';
  // Decrypt the most frequent cipher letter using the actual shift
  const index = alphabet.indexOf(mostFrequentCipher.value);
  if (index === -1) return '';
  const shiftValue = parseInt(shift.value);
  const plainIndex = (index - shiftValue + 26) % 26;
  return alphabet[plainIndex];
});

const detectedShift = computed(() => {
  if (!cipherText.value || cipherText.value.length < 10) return 0;

  // Try multiple common letters and use chi-squared test
  const commonLetters = ['E', 'T', 'A', 'O', 'I', 'N']; // Most common in English
  const expectedFreq = {
    'E': 12.70, 'T': 9.06, 'A': 8.17, 'O': 7.51, 'I': 6.97, 'N': 6.75,
    'S': 6.33, 'H': 6.09, 'R': 5.99, 'D': 4.25, 'L': 4.03, 'C': 2.78,
    'U': 2.76, 'M': 2.41, 'W': 2.36, 'F': 2.23, 'G': 2.02, 'Y': 1.97,
    'P': 1.93, 'B': 1.29, 'V': 0.98, 'K': 0.77, 'J': 0.15, 'X': 0.15,
    'Q': 0.10, 'Z': 0.07
  };

  // Get actual frequencies
  const actualFreq = getLetterFrequency(cipherText.value);
  const actualMap = {};
  actualFreq.forEach(f => {
    actualMap[f.letter] = parseFloat(f.percentage);
  });

  // Try all possible shifts and find the one with lowest chi-squared
  let bestShift = 0;
  let lowestChiSquared = Infinity;

  for (let shift = 1; shift <= 25; shift++) {
    let chiSquared = 0;

    for (const letter of alphabet) {
      const shiftedIndex = (alphabet.indexOf(letter) - shift + 26) % 26;
      const originalLetter = alphabet[shiftedIndex];
      const expected = expectedFreq[originalLetter] || 0;
      const actual = actualMap[letter] || 0;

      if (expected > 0) {
        chiSquared += Math.pow(actual - expected, 2) / expected;
      }
    }

    if (chiSquared < lowestChiSquared) {
      lowestChiSquared = chiSquared;
      bestShift = shift;
    }
  }

  return bestShift;
});

const estimatedPlaintext = computed(() => {
  if (!cipherText.value || detectedShift.value === 0) return '';

  return cipherText.value.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const isLower = char === char.toLowerCase();
      const upperChar = char.toUpperCase();
      const index = alphabet.indexOf(upperChar);
      if (index === -1) return char;

      // Reverse the shift
      const decryptedIndex = (index - detectedShift.value + 26) % 26;
      const decryptedChar = alphabet[decryptedIndex];
      return isLower ? decryptedChar.toLowerCase() : decryptedChar;
    }
    return char;
  }).join('');
});

function getShiftedChar(char) {
  const index = alphabet.indexOf(char.toUpperCase());
  if (index === -1) return char;
  const shiftValue = parseInt(shift.value);
  return alphabet[(index + shiftValue) % 26];
}

function isCurrentCharInCodex(char) {
  if (currentCharIndex.value === -1 || !isEncrypting.value) return false;
  const currentChar = plainText.value[currentCharIndex.value];
  if (!currentChar) return false;
  return currentChar.toUpperCase() === char;
}

function encryptChar(char) {
  if (char.match(/[a-z]/i)) {
    const isLower = char === char.toLowerCase();
    const shifted = getShiftedChar(char);
    return isLower ? shifted.toLowerCase() : shifted;
  }
  return char;
}

async function toggleEncryption() {
  if (isEncrypting.value) {
    pauseEncryption();
  } else {
    startEncryption();
  }
}

function startEncryption() {
  // Always reset to start fresh
  currentCharIndex.value = 0;
  cipherText.value = '';

  isEncrypting.value = true;

  encryptionInterval = setInterval(() => {
    if (currentCharIndex.value < plainText.value.length) {
      const char = plainText.value[currentCharIndex.value];
      cipherText.value += encryptChar(char);
      currentCharIndex.value++;

      if (currentCharIndex.value >= plainText.value.length) {
        pauseEncryption();
        updateFrequencyChart();
      }
    }
  }, speed.value);
}

function pauseEncryption() {
  isEncrypting.value = false;
  if (encryptionInterval) {
    clearInterval(encryptionInterval);
    encryptionInterval = null;
  }
}

function reset() {
  pauseEncryption();
  currentCharIndex.value = -1;
  cipherText.value = '';
  if (chart) {
    chart.data.datasets[1].data = new Array(26).fill(0);
    chart.update();
  }
}

function randomizeText() {
  reset();
  plainText.value = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
}

function onShiftChange() {
  // Stop any ongoing encryption
  pauseEncryption();
  // Clear cipher text and reset position
  currentCharIndex.value = -1;
  cipherText.value = '';
  // Clear chart
  if (chart) {
    chart.data.datasets[1].data = new Array(26).fill(0);
    chart.update();
  }
}

function onTextChange() {
  reset();
}

function getLetterFrequency(text) {
  const freq = {};
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');

  for (const char of cleanText) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const total = cleanText.length || 1;
  return alphabet.map(letter => ({
    letter,
    count: freq[letter] || 0,
    percentage: ((freq[letter] || 0) / total * 100).toFixed(2)
  })).sort((a, b) => b.count - a.count);
}

async function updateFrequencyChart() {
  const plainFreq = getLetterFrequency(plainText.value);
  const cipherFreq = getLetterFrequency(cipherText.value);

  if (chart) {
    // Create ordered arrays matching alphabet order
    const plainData = alphabet.map(letter => {
      const found = plainFreq.find(f => f.letter === letter);
      return found ? parseFloat(found.percentage) : 0;
    });

    const cipherData = alphabet.map(letter => {
      const found = cipherFreq.find(f => f.letter === letter);
      return found ? parseFloat(found.percentage) : 0;
    });

    chart.data.datasets[0].data = plainData;
    chart.data.datasets[1].data = cipherData;
    chart.update();
  }
}

onMounted(async () => {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  const ctx = document.getElementById('frequencyChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: alphabet,
      datasets: [
        {
          label: 'Plain Text Frequency (%)',
          data: new Array(26).fill(0),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        },
        {
          label: 'Cipher Text Frequency (%)',
          data: new Array(26).fill(0),
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Letters'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });
});
</script>
