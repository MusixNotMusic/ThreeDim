<script setup>
import { routes } from './router/index.js';
import { ref } from 'vue';
const activeIndex = ref('0');
const paths = ref(routes);
</script>

<template>
  <div class="app">
    <div class="menu">
      <el-menu :default-active="activeIndex">
        <el-menu-item v-for="(item, index) in paths" :key="index" :index="`${index}`">
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

.router-link-active  {
  color: orange;
  border-left: 4px solid orange !important;
  background: rgba(255, 255, 255, 0.85);
}

.menu-link {
  display: block;
  width: 100%;
  padding: 0px 20px;
  border-left: 4px solid transparent;
}


::v-deep(.el-menu-item) {
  padding: 0px !important;
}

.content {
  width: 100%;
}

</style>
