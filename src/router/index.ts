import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import StatsView from '@/views/StatsView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/estadisticas',
    name: 'estadisticas',
    component: StatsView,
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
