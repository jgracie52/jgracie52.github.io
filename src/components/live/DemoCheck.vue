<template>
  <slot v-if="innerWidth > 768" />
  <p v-else>Sorry, this is best viewed on larger screens</p>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const innerWidth = ref(0);

onMounted(() => {
  innerWidth.value = window.innerWidth;

  window.addEventListener('resize', () => {
    innerWidth.value = window.innerWidth;
  });
});
</script>
