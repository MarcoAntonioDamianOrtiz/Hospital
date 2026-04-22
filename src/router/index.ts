import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import StatsView from '@/views/StatsView.vue'
import LoginView from '@/views/LoginView.vue'
import UserView from '@/views/UserView.vue'
import { useAuth } from '@/services/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/estadisticas',
    name: 'estadisticas',
    component: StatsView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/consulta',
    name: 'consulta',
    component: UserView,
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const { isLoggedIn, isAdmin, currentUser } = useAuth()

  // Ruta pública: si ya está logueado, redirigir según rol
  if (to.meta.public) {
    if (isLoggedIn()) {
      next(isAdmin() ? '/' : '/consulta')
    } else {
      next()
    }
    return
  }

  // Ruta que requiere login
  if (!isLoggedIn()) {
    next('/login')
    return
  }

  // Ruta solo admin
  if (to.meta.requiresAdmin && !isAdmin()) {
    next('/consulta')
    return
  }

  next()
})