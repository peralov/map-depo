// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DepoDetailView from '../views/DepoDetailView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/sites/:id',
      name: 'site-detail',
      component: DepoDetailView,
      props: true
    },
    {
      path: '/depo/:id',
      redirect: (to) => `/sites/${to.params.id}`
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard for protected routes
router.beforeEach((to) => {
  const authRequired = to.matched.some((record) => record.meta.requiresAuth)
  const token = localStorage.getItem('token')

  if (authRequired && !token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
})

export default router
