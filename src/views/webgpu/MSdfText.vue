<template>
  <canvas></canvas>
  <div id="fail" style="display: none">
    <div class="content"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { main } from '../../webgpu/msdf/main.js'


onMounted(() => {
  main();
})

onUnmounted(() => {
})
</script>

<style scoped>
canvas { width: 100%; height: 100%; display: block; }

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
.wrap {
  width: 100%;
  height: 100%;
}
</style>