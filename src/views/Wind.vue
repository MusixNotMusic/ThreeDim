<template>
</template>

<script setup>
import { onUnmounted } from 'vue';
import ThreeWind2 from '../wind/v3.js';


const wind = new ThreeWind2()

onUnmounted(() => {
  wind.destroy();
})
</script>

<style scoped>
.threejs {
    width: 100%;
    height: 100vh;
}
</style>