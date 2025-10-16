<template>
  <div class="compute">
    <canvas id="canvas" width="500px" height="500px"></canvas>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { main } from '../../webgpu/compute/ball.js'

onMounted(async() => {
  await main();
})

onUnmounted(() => {
})
</script>

<style scoped>
canvas { width: 500px; height: 500px; display: block; border: 1px solid black; }

#fail {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: red;
  color: white;
  font-weight: bold;
  font-family: monospace;
  font-size: 16pt;
  text-align: center;
}

</style>