<template>
  <div class="flex flex-column w-full h-full">
    <div class="w-full h-full max-h-[100vh] overflow-y-scroll p-8">
      <div class="flex flex-col gap-8">
        <!-- Cipher Visualization -->
        <div class="bg-base-200 p-6 rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Vigenere Cipher Encryption</h2>

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

          <!-- Key Display -->
          <div class="mb-2">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Key (repeated):</h3>
            <div class="text-lg font-mono leading-relaxed">
              <span
                v-for="(char, index) in getRepeatedKey()"
                :key="`key-${index}`"
                :class="{ 'bg-secondary text-secondary-content px-1 rounded': currentCharIndex === index && isEncrypting }"
                class="transition-colors duration-200"
              >
                {{ char }}
              </span>
            </div>
          </div>

          <!-- Vigenere Table -->
          <div class="mb-4 bg-base-300 p-4 rounded-lg overflow-x-auto">
            <h3 class="text-sm font-semibold text-gray-500 mb-3">Vigenere Table:</h3>
            <div class="flex justify-center">
              <div class="flex flex-col font-mono text-xs">
                <!-- Header row with plaintext alphabet -->
                <div class="flex">
                  <div class="w-6 h-6 flex items-center justify-center font-bold opacity-50"></div>
                  <div
                    v-for="(char, index) in alphabet"
                    :key="`header-${index}`"
                    class="w-6 h-6 flex items-center justify-center font-bold transition-all duration-200"
                    :class="{
                      'scale-125 bg-primary text-primary-content rounded': char === currentPlainChar && isEncrypting,
                      'bg-primary/20': char === currentPlainChar && isEncrypting
                    }"
                  >
                    {{ char }}
                  </div>
                </div>
                <!-- Table rows -->
                <div
                  v-for="(keyChar, rowIndex) in alphabet"
                  :key="`row-${rowIndex}`"
                  class="flex"
                >
                  <!-- Key letter label -->
                  <div
                    class="w-6 h-6 flex items-center justify-center font-bold transition-all duration-200"
                    :class="{
                      'scale-125 bg-secondary text-secondary-content rounded': keyChar === currentKeyChar && isEncrypting,
                      'bg-secondary/20': keyChar === currentKeyChar && isEncrypting
                    }"
                  >
                    {{ keyChar }}
                  </div>
                  <!-- Shifted alphabet for this key letter -->
                  <div
                    v-for="(plainChar, colIndex) in alphabet"
                    :key="`cell-${rowIndex}-${colIndex}`"
                    class="w-6 h-6 flex items-center justify-center transition-all duration-200"
                    :class="{
                      'bg-accent text-accent-content rounded scale-125 font-bold':
                        keyChar === currentKeyChar &&
                        plainChar === currentPlainChar &&
                        isEncrypting,
                      'bg-primary/20':
                        plainChar === currentPlainChar &&
                        keyChar !== currentKeyChar &&
                        isEncrypting,
                      'bg-secondary/20':
                        keyChar === currentKeyChar &&
                        plainChar !== currentPlainChar &&
                        isEncrypting
                    }"
                  >
                    {{ getVigenereChar(plainChar, keyChar) }}
                  </div>
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
                :class="{ 'bg-accent text-accent-content px-1 rounded': currentCharIndex === index && isEncrypting }"
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
              <div class="stat-desc">{{ cipherText.length > 0 ? `${mostFrequentCipherPercent}%` : '-' }}</div>
            </div>
            <div class="stat bg-base-300 rounded-lg">
              <div class="stat-title">Index of Coincidence</div>
              <div class="stat-value text-secondary">{{ indexOfCoincidence.toFixed(4) }}</div>
              <div class="stat-desc">{{ getICDescription() }}</div>
            </div>
          </div>

          <!-- Simple Frequency Analysis Attempt (shows why it fails) -->
          <div class="mt-6" v-if="cipherText.length > 10">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Simple Frequency Analysis Attempt:</h3>
            <div class="bg-base-300 p-4 rounded-lg">
              <div class="text-sm leading-relaxed mb-3">
                <p class="mb-2">
                  <strong>Most Frequent Cipher Letter:</strong> {{ mostFrequentCipher }} ({{ mostFrequentCipherPercent }}%)
                </p>
                <p class="mb-2">
                  <strong>Assumed Shift:</strong> {{ simpleDetectedShift }} (assuming {{ mostFrequentCipher }} = 'E')
                </p>
              </div>
              <div class="bg-base-200 p-3 rounded">
                <div class="text-xs font-semibold text-gray-500 mb-1">Attempted Decryption:</div>
                <div class="font-mono text-sm">{{ simpleDecryption }}</div>
              </div>
              <div class="mt-3 text-xs text-warning">
                ⚠ This doesn't work! Unlike Caesar cipher, Vigenere uses multiple shifts, so simple frequency analysis produces gibberish.
              </div>
            </div>
          </div>
        </div>

        <!-- Kasiski Examination Section -->
        <div class="bg-base-200 p-6 rounded-lg" v-if="cipherText.length > 20">
          <h2 class="text-2xl font-bold mb-4">Kasiski Examination</h2>

          <div class="bg-base-300 p-4 rounded-lg mb-4">
            <div class="text-sm leading-relaxed mb-3">
              <p class="mb-2">
                Kasiski examination finds repeated sequences in the ciphertext. The distances between repeats are likely multiples of the key length.
              </p>
            </div>

            <div v-if="kasiskiRepeats.length > 0" class="space-y-2">
              <div class="text-xs font-semibold text-gray-500 mb-2">Repeated Sequences Found:</div>
              <div v-for="(repeat, idx) in kasiskiRepeats.slice(0, 5)" :key="idx" class="bg-base-200 p-2 rounded text-xs">
                <span class="font-mono font-bold">{{ repeat.sequence }}</span>
                <span class="mx-2">→</span>
                <span>Distance: {{ repeat.distance }}</span>
                <span class="mx-2">|</span>
                <span>Factors: {{ repeat.factors.join(', ') }}</span>
              </div>

              <div class="mt-3 p-3 bg-base-200 rounded">
                <div class="text-xs font-semibold text-gray-500 mb-1">Most Common Factor (likely key length):</div>
                <div class="text-2xl font-bold text-primary">{{ estimatedKeyLength }}</div>
                <div class="text-xs mt-1">Actual key length: {{ key.replace(/[^a-z]/gi, '').length }}</div>
                <div class="text-xs mt-2" :class="estimatedKeyLength === key.replace(/[^a-z]/gi, '').length ? 'text-success' : 'text-warning'">
                  {{ estimatedKeyLength === key.replace(/[^a-z]/gi, '').length ? '✓ Correct!' : '⚠ May need longer ciphertext for accuracy' }}
                </div>
              </div>
            </div>

            <div v-else class="text-xs text-warning">
              No repeated sequences found. Longer ciphertext needed for Kasiski examination.
            </div>
          </div>

          <!-- Final Decryption using detected key length -->
          <div v-if="kasiskiRepeats.length > 0 && estimatedKeyLength > 0" class="bg-base-300 p-4 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Decryption using Key Length {{ estimatedKeyLength }}:</h3>
            <div class="text-sm leading-relaxed mb-3">
              <p class="mb-2">
                Once key length is known, split the ciphertext into {{ estimatedKeyLength }} groups. Each group uses the same Caesar shift, so frequency analysis works!
              </p>
            </div>
            <div class="bg-base-200 p-3 rounded">
              <div class="text-xs font-semibold text-gray-500 mb-1">Decrypted Text:</div>
              <div class="font-mono text-sm">{{ kasiskiDecryption }}</div>
            </div>
            <div class="mt-3 text-xs" :class="kasiskiDecryption.toLowerCase() === plainText.toLowerCase() ? 'text-success' : 'text-warning'">
              {{ kasiskiDecryption.toLowerCase() === plainText.toLowerCase() ? '✓ Successfully decrypted!' : '⚠ Partial success - may need more ciphertext' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <FormSideBar>
      <article class="prose mb-4">
        <h2>Instructions</h2>
        <p>
          The Vigenere cipher uses a keyword to create multiple Caesar shifts. Each letter of the key determines the shift for the corresponding letter in the plaintext.
        </p>
        <p>
          Watch the Vigenere table highlight as each letter is encrypted. The row is determined by the key letter, and the column by the plaintext letter.
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

        <!-- Key Input -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Cipher Key (letters only)</span>
          </div>
          <input
            v-model="key"
            type="text"
            class="input input-bordered"
            placeholder="SECRET"
            @input="onKeyChange"
            maxlength="20"
          />
          <div class="label">
            <span class="label-text-alt">{{ key.length }}/20 characters</span>
          </div>
        </label>

        <!-- Plain Text Input -->
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Plain Text (max 500 chars)</span>
          </div>
          <textarea
            v-model="plainText"
            class="textarea textarea-bordered h-24"
            maxlength="500"
            placeholder="Enter text to encrypt..."
            @input="onTextChange"
          ></textarea>
          <div class="label">
            <span class="label-text-alt">{{ plainText.length }}/500</span>
          </div>
        </label>
      </div>

      <article class="prose mt-4">
        <h3>Why It's Stronger</h3>
        <p class="text-sm">
          Unlike Caesar cipher, Vigenere uses multiple shifts determined by a keyword. This makes simple frequency analysis ineffective, as the same letter can be encrypted differently each time!
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
  'The quick brown fox jumps over the lazy dog and the quick brown fox jumps again over the fence while the lazy dog sleeps under the tree',
  'To be or not to be that is the question whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles',
  'All that glitters is not gold often have you heard that told many a man his life hath sold but my outside to behold gilded tombs do worms enfold',
  'A journey of a thousand miles begins with a single step and every step you take brings you closer to your destination so keep walking forward',
  'Knowledge is power and power corrupts absolutely but absolute power corrupts absolutely so those who seek power must be careful what they wish for',
  'The only thing we have to fear is fear itself and fear is the mind killer fear is the little death that brings total obliteration',
  'In cryptography we trust all others must use encryption because security is paramount and encryption protects our data from those who would steal it',
  'Security through obscurity is not true security because true security comes from strong encryption and proper key management practices',
];

const plainText = ref('The quick brown fox jumps over the lazy dog and the quick brown fox jumps again over the fence while the lazy dog sleeps under the tree');
const key = ref('SECRET');
const speed = ref(500);
const isEncrypting = ref(false);
const currentCharIndex = ref(-1);
const cipherText = ref('');
let encryptionInterval = null;
let chart = null;

const currentPlainChar = computed(() => {
  if (currentCharIndex.value >= 0 && currentCharIndex.value < plainText.value.length) {
    const char = plainText.value[currentCharIndex.value];
    if (char.match(/[a-z]/i)) {
      return char.toUpperCase();
    }
  }
  return '';
});

const currentKeyChar = computed(() => {
  if (currentCharIndex.value >= 0 && currentPlainChar.value) {
    const cleanKey = key.value.replace(/[^a-z]/gi, '').toUpperCase();
    if (cleanKey.length === 0) return '';

    // Count only letter positions
    const letterPositions = plainText.value.slice(0, currentCharIndex.value + 1)
      .split('')
      .filter(c => c.match(/[a-z]/i)).length - 1;

    const keyIndex = letterPositions % cleanKey.length;
    return cleanKey[keyIndex];
  }
  return '';
});

const mostFrequentCipher = computed(() => {
  if (!cipherText.value) return '-';
  const freq = getLetterFrequency(cipherText.value);
  const nonZero = freq.filter(f => f.count > 0);
  return nonZero.length > 0 ? nonZero[0].letter : '-';
});

const mostFrequentCipherPercent = computed(() => {
  if (!cipherText.value) return '0.00';
  const freq = getLetterFrequency(cipherText.value);
  const found = freq.find(f => f.letter === mostFrequentCipher.value);
  return found ? found.percentage : '0.00';
});

const indexOfCoincidence = computed(() => {
  if (!cipherText.value || cipherText.value.length < 2) return 0;

  const cleanText = cipherText.value.toUpperCase().replace(/[^A-Z]/g, '');
  const n = cleanText.length;
  if (n < 2) return 0;

  const freq = {};
  for (const char of cleanText) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let sum = 0;
  for (const count of Object.values(freq)) {
    sum += count * (count - 1);
  }

  return sum / (n * (n - 1));
});

function getICDescription() {
  const ic = indexOfCoincidence.value;
  if (ic === 0) return 'Calculating...';
  if (ic >= 0.065) return 'Similar to English';
  if (ic >= 0.045) return 'Polyalphabetic cipher';
  return 'Random-like text';
}

const simpleDetectedShift = computed(() => {
  if (mostFrequentCipher.value === '-') return 0;

  // Assume most frequent cipher letter is 'E'
  const cipherIndex = alphabet.indexOf(mostFrequentCipher.value);
  const eIndex = alphabet.indexOf('E');

  return (cipherIndex - eIndex + 26) % 26;
});

const simpleDecryption = computed(() => {
  if (!cipherText.value || simpleDetectedShift.value === 0) return '';

  return cipherText.value.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const isLower = char === char.toLowerCase();
      const upperChar = char.toUpperCase();
      const index = alphabet.indexOf(upperChar);
      if (index === -1) return char;

      // Apply simple Caesar shift backwards
      const decryptedIndex = (index - simpleDetectedShift.value + 26) % 26;
      const decryptedChar = alphabet[decryptedIndex];
      return isLower ? decryptedChar.toLowerCase() : decryptedChar;
    }
    return char;
  }).join('');
});

const kasiskiRepeats = computed(() => {
  if (!cipherText.value || cipherText.value.length < 20) return [];

  const cleanCipher = cipherText.value.toUpperCase().replace(/[^A-Z]/g, '');
  const repeats = [];
  const minLength = 3; // Minimum sequence length to consider

  // Find all repeated sequences of length 3-5
  for (let len = minLength; len <= 5; len++) {
    const positions = {};

    for (let i = 0; i <= cleanCipher.length - len; i++) {
      const sequence = cleanCipher.substring(i, i + len);

      if (!positions[sequence]) {
        positions[sequence] = [];
      }
      positions[sequence].push(i);
    }

    // Find sequences that appear more than once
    for (const [sequence, pos] of Object.entries(positions)) {
      if (pos.length > 1) {
        for (let i = 1; i < pos.length; i++) {
          const distance = pos[i] - pos[0];
          if (distance > 0) {
            repeats.push({
              sequence,
              distance,
              factors: getFactors(distance)
            });
          }
        }
      }
    }
  }

  // Sort by sequence length (longer is better) then by distance
  return repeats.sort((a, b) => {
    if (a.sequence.length !== b.sequence.length) {
      return b.sequence.length - a.sequence.length;
    }
    return a.distance - b.distance;
  });
});

const estimatedKeyLength = computed(() => {
  if (kasiskiRepeats.value.length === 0) return 0;

  // Count frequency of each factor
  const factorCount = {};
  kasiskiRepeats.value.forEach(repeat => {
    repeat.factors.forEach(factor => {
      if (factor > 1 && factor <= 20) { // Reasonable key lengths
        factorCount[factor] = (factorCount[factor] || 0) + 1;
      }
    });
  });

  // Find most common factor
  let maxCount = 0;
  let bestFactor = 0;
  for (const [factor, count] of Object.entries(factorCount)) {
    if (count > maxCount) {
      maxCount = count;
      bestFactor = parseInt(factor);
    }
  }

  return bestFactor;
});

const kasiskiDecryption = computed(() => {
  if (!cipherText.value || estimatedKeyLength.value === 0) return '';

  const cleanCipher = cipherText.value.replace(/[^a-z]/gi, '');
  const keyLength = estimatedKeyLength.value;

  // Split into groups based on key length
  const groups = [];
  for (let i = 0; i < keyLength; i++) {
    groups[i] = '';
    for (let j = i; j < cleanCipher.length; j += keyLength) {
      groups[i] += cleanCipher[j];
    }
  }

  // Perform frequency analysis on each group to find the shift
  const detectedKey = [];
  for (let i = 0; i < keyLength; i++) {
    const group = groups[i].toUpperCase();
    if (group.length === 0) {
      detectedKey.push(0);
      continue;
    }

    // Use chi-squared test for each possible shift
    const expectedFreq = {
      'E': 12.70, 'T': 9.06, 'A': 8.17, 'O': 7.51, 'I': 6.97, 'N': 6.75,
      'S': 6.33, 'H': 6.09, 'R': 5.99, 'D': 4.25, 'L': 4.03, 'C': 2.78,
      'U': 2.76, 'M': 2.41, 'W': 2.36, 'F': 2.23, 'G': 2.02, 'Y': 1.97,
      'P': 1.93, 'B': 1.29, 'V': 0.98, 'K': 0.77, 'J': 0.15, 'X': 0.15,
      'Q': 0.10, 'Z': 0.07
    };

    const freq = {};
    for (const char of group) {
      freq[char] = (freq[char] || 0) + 1;
    }
    const total = group.length;
    const actualMap = {};
    for (const letter of alphabet) {
      actualMap[letter] = ((freq[letter] || 0) / total * 100);
    }

    let bestShift = 0;
    let lowestChi = Infinity;

    for (let shift = 0; shift < 26; shift++) {
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

      if (chiSquared < lowestChi) {
        lowestChi = chiSquared;
        bestShift = shift;
      }
    }

    detectedKey.push(bestShift);
  }

  // Decrypt using detected key
  let result = '';
  let keyIndex = 0;
  for (const char of cipherText.value) {
    if (char.match(/[a-z]/i)) {
      const isLower = char === char.toLowerCase();
      const upperChar = char.toUpperCase();
      const index = alphabet.indexOf(upperChar);
      if (index !== -1) {
        const shift = detectedKey[keyIndex % keyLength];
        const decryptedIndex = (index - shift + 26) % 26;
        const decryptedChar = alphabet[decryptedIndex];
        result += isLower ? decryptedChar.toLowerCase() : decryptedChar;
        keyIndex++;
      }
    } else {
      result += char;
    }
  }

  return result;
});

function getFactors(n) {
  const factors = [];
  for (let i = 2; i <= n; i++) {
    if (n % i === 0) {
      factors.push(i);
    }
  }
  return factors;
}

function getRepeatedKey() {
  const cleanKey = key.value.replace(/[^a-z]/gi, '').toUpperCase();
  if (cleanKey.length === 0) return plainText.value.split('').map(() => ' ');

  let result = '';
  let keyIndex = 0;

  for (const char of plainText.value) {
    if (char.match(/[a-z]/i)) {
      result += cleanKey[keyIndex % cleanKey.length];
      keyIndex++;
    } else {
      result += ' ';
    }
  }

  return result;
}

function getVigenereChar(plainChar, keyChar) {
  const plainIndex = alphabet.indexOf(plainChar);
  const keyIndex = alphabet.indexOf(keyChar);
  return alphabet[(plainIndex + keyIndex) % 26];
}

function encryptChar(char, keyChar) {
  if (!char.match(/[a-z]/i)) return char;

  const isLower = char === char.toLowerCase();
  const plainUpper = char.toUpperCase();
  const encrypted = getVigenereChar(plainUpper, keyChar);

  return isLower ? encrypted.toLowerCase() : encrypted;
}

async function toggleEncryption() {
  if (isEncrypting.value) {
    pauseEncryption();
  } else {
    startEncryption();
  }
}

function startEncryption() {
  const cleanKey = key.value.replace(/[^a-z]/gi, '').toUpperCase();
  if (cleanKey.length === 0) {
    alert('Please enter a valid key (letters only)');
    return;
  }

  currentCharIndex.value = 0;
  cipherText.value = '';
  isEncrypting.value = true;

  let keyIndex = 0;

  encryptionInterval = setInterval(() => {
    if (currentCharIndex.value < plainText.value.length) {
      const char = plainText.value[currentCharIndex.value];

      if (char.match(/[a-z]/i)) {
        const keyChar = cleanKey[keyIndex % cleanKey.length];
        cipherText.value += encryptChar(char, keyChar);
        keyIndex++;
      } else {
        cipherText.value += char;
      }

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

function onKeyChange() {
  // Remove non-letter characters
  key.value = key.value.replace(/[^a-z]/gi, '');
  reset();
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
