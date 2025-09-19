<template>
  <div class="compute">
    <div>{{ inputRef }}</div>
    <div>{{ resultRef }}</div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { main } from '../../webgpu/Compute'

const inputRef = ref(new Array(1000).fill(1).map((o, i) => i + 1));
const resultRef = ref([]);

onMounted(async() => {
  const { input, result } = await main(inputRef.value);
  resultRef.value = Array.from(result);
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

.compute {
  font-size: 12px;
}
</style>