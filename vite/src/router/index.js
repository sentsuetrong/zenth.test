import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login, meta: { guest: true } },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }, // 🔒 หน้านี้ต้องล็อกอิน
  },
]

const router = createRouter({
  history: createWebHistory(), // ใช้ History Mode
  routes,
})

// --- Navigation Guard ---
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  // 1. ถ้าจะไปหน้า requiresAuth แต่ยังไม่ล็อกอิน -> ดีดไป Login
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/login')
  }

  // 2. ถ้าจะไปหน้า guest (Login) แต่ล็อกอินแล้ว -> ดีดไป Dashboard
  if (to.meta.guest && isLoggedIn) {
    return next('/dashboard')
  }

  next()
})

export default router
