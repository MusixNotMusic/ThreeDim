import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Wind from '../views/Wind.vue'
import Wireframe from '../views/Wireframe.vue'

export const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/Wind',
    name: 'Wind',
    component: Wind
  },
  {
    path: '/Wireframe',
    name: 'Wireframe',
    component: Wireframe
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router