<template>
  <div v-if="windIns" class="slider">
    <el-slider :min="0" :max="windIns.depth" vertical :step="1" v-model="level" style="height: 200px;" @change="changeLevel"></el-slider>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import ThreeWind from '../../webgl/wind/wind.js';
import { fetchWindData } from '../../webgl/wind/fetch';

const wind = new ThreeWind()
const windIns = ref(null);
const level = ref(0);
const generateU8IntArray = (ins, level) => {
  const { width, height } = ins;
  const size = width * height;
  const start = size * level;
  const U = ins.U.slice(start, start + size);
  const V = ins.V.slice(start, start + size);

  const uMin = Math.min(...U);
  const uMax = Math.max(...U);
  const vMin = Math.min(...V);
  const vMax = Math.max(...V);
  // const data = new Uint8Array(size * 4);

  const canvas = document.createElement('canvas');
  canvas.width = width;  // 小尺寸（适合像素风格）
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data; // Uint8ClampedArray (R, G, B, A)

  for(let i = 0; i < size; i++) {
    data[i * 4 + 0] = (U[i] - uMin) / (uMax - uMin) * 255;
    data[i * 4 + 1] = (V[i] - vMin) / (vMax - vMin) * 255;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  const dataURL = canvas.toDataURL('image/png'); // 也可以是 'image/jpeg'

  // 4. 创建 Image 对象并设置 src
  const img = new Image();
  img.src = dataURL;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const data = {
        image: img,
        width,
        height,
        uMin,
        uMax,
        vMin,
        vMax
      }
      resolve(data);
    };
  });
}

const changeLevel = () => {
  if (windIns.value) {
    generateU8IntArray(windIns.value, level.value).then(windData => {
      wind.setWindData(windData);
    })
  }
}

onMounted(() => {
   fetchWindData().then((ins) => {
    //  console.log('ins ==>', ins);
     windIns.value = ins;
     return generateU8IntArray(ins, level.value);
    }).then(windData => {
      wind.setWindData(windData);
   })
})

onUnmounted(() => {
  wind.destroy();
})
</script>

<style scoped>
.threejs {
    width: 100%;
    height: 100vh;
}

.slider {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 20;
}
</style>