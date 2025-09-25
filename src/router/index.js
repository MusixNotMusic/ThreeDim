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
  },
  {
    path: '/webgpu/Triangle',
    name: 'webgpu-triangle',
    component: () => import('../views/webgpu/Triangle.vue')
  },
  {
    path: '/webgpu/multi-triangle',
    name: 'webgpu-multi-triangle',
    component: () => import('../views/webgpu/MultiTriangle.vue')
  },
  {
    path: '/webgpu/Compute',
    name: 'webgpu-compute',
    component: () => import('../views/webgpu/Compute.vue')
  },
  {
    path: '/webgpu/MSdfText',
    name: 'webgpu-MSdfText',
    component: () => import('../views/webgpu/MSdfText.vue')
  },
  {
    path: '/threejs/WindLine',
    name: 'WindLine',
    component: () => import('../views/threejs/WindLine.vue')
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router