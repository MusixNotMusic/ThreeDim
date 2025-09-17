<template>
</template>

<script setup>
import { onUnmounted } from 'vue';
import Terrain from '../../threejs/terrain/index.js';

const terrain = new Terrain()

onUnmounted(() => {
  terrain.dispose();
})
</script>

<style scoped>
.threejs {
    width: 100%;
    height: 100vh;
}
</style>