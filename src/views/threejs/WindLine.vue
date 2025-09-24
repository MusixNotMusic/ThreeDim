<template>
   <div class="wrap">
    <canvas></canvas>
  </div>
</template>

<script setup>
import { onMounted , onUnmounted } from 'vue';
import { WindLine } from '../../threejs/windLine';

let windLine

onMounted(() => {
  windLine = new WindLine(document.querySelector('canvas'))
})

onUnmounted(() => {
  windLine.dispose();
})
</script>

<style scoped>
canvas { width: 100%; height: 100%; display: block; }
.wrap {
  width: 100%;
  height: 100%;
}
</style>