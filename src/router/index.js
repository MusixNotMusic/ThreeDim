import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Wind from '../views/Wind.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router