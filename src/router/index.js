import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Wind from '../views/webgl/Wind.vue'
import Wireframe from '../views/threejs/Wireframe.vue'
import Terrian from '../views/threejs/Terrain.vue'

export const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/threejs/Wireframe',
    name: 'Wireframe',
    component: () => import('../views/threejs/Wireframe.vue')
  },
  {
    path: '/threejs/Terrain',
    name: 'Terrain',
    component: () => import('../views/threejs/Terrain.vue')
  },
  {
    path: '/webgl/Wind',
    name: 'Wind',
    component: () => import('../views/webgl/Wind.vue')
  },
  {
    path: '/webgl/Box',
    name: 'webgl-box',
    component: () => import('../views/webgl/Box.vue')
  },
  {
    path: '/webgpu/Box',
    name: 'webgpu-box',
    component: () => import('../views/webgpu/Box.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router