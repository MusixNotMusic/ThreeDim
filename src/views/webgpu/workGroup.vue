<template>
    <div class="compute">
        <div class="workgroup">
            <div class="table">
                <div class="head">
                    <div class="th"></div>
                </div>
            </div>
        </div>
        <div class="local"></div>
        <div class="global"></div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted, ref } from 'vue';
  import { main } from '../../webgpu/compute/workgroup'

  const workgroupRef = ref([]);
  const localRef = ref([]);
  const globalRef = ref([]);
  
  onMounted(async() => {
    const { workgroup, local, global, numResults, numThreadsPerWorkgroup } = await main();
    workgroupRef.value = Array.from(workgroup);
    localRef.value = Array.from(local);
    globalRef.value = Array.from(global);

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
    width: 100%;
    height: 100%;
    overflow:  scroll;
    display: flex;
  }
  </style>