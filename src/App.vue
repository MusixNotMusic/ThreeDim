<script setup>
import { onUnmounted } from 'vue';
// import ThreeWind from './wind/v2.js';
import ThreeWind2 from './wind/v3.js';
// import ThreeWind2 from './wind/v4.js';
const wind = new ThreeWind2()
// import ThreeWind from './wind/index.js';

onUnmounted(() => {
  wind.destroy();
})
</script>

<template>
 
</template>

<style scoped>

</style>
