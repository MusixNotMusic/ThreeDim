<template>
</template>

<script setup>
import { onUnmounted } from 'vue';
import ShaderDemo5 from '../threejs/wireframe-tendrils-shader/index.js';


const demo = new ShaderDemo5()

onUnmounted(() => {
  demo.dispose();
})
</script>

<style scoped>
.threejs {
    width: 100%;
    height: 100vh;
}
</style>