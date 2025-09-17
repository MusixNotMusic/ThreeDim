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
    path: '/Wireframe',
    name: 'Wireframe',
    component: () => import('../views/threejs/Wireframe.vue')
  },
  {
    path: '/Terrain',
    name: 'Terrain',
    component: () => import('../views/threejs/Terrain.vue')
  },
  {
    path: '/Wind',
    name: 'Wind',
    component: () => import('../views/webgl/Wind.vue')
  },
  {
    path: '/webgpu',
    name: 'webgpu',
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router