<script setup>
import { onUnmounted } from 'vue';
import ThreeWind from './wind/v2.js';
const wind = new ThreeWind()

onUnmounted(() => {
  wind.destroy();
})
</script>

<template>
 
</template>

<style scoped>

</style>
