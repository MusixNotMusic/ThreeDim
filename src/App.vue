<script setup>
import { routes } from './router/index.js';
import { ref } from 'vue';
const activeIndex = ref(0);
const paths = ref(routes);
</script>

<template>
  <div class="app">
    <div class="menu">
      <el-menu :default-active="activeIndex">
        <el-menu-item v-for="(item, index) in paths" :key="index" :index="index + 1">
          <router-link :to="item.path" class="menu-link" :class="{active: index == activeIndex}" @click="activeIndex = index">
            {{ item.name }}
          </router-link>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  z-index: 2;
}

.menu {
  width: 200px;
  z-index: 2;
  height: 100vh;
}
.el-menu--vertical {
  height: 100vh;
  background: rgba(255, 255, 255, 0.85);
}
.active {
  color: orange;
}

.menu-link {
  display: block;
  width: 100%;
}

::v-deep(.el-menu .is-active){
  background: rgba(255, 255, 255, 0.85);
  border-left: 4px solid orange;
}

</style>
