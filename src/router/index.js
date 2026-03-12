import { createRouter, createWebHistory } from 'vue-router'
import { useJwt } from '@/shared/composables/useJwt'

const routes = [
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
  },
  {
    path: '/auth/invite/:token',
    name: 'invite',
    component: () => import('@/features/auth/views/InviteView.vue'),
  },
  {
    path: '/',
    component: () => import('@/shared/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isExpired } = useJwt()
  const token = localStorage.getItem('access_token')
  const isAuthenticated = !!token && !isExpired(token)

  if (!isAuthenticated && token) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  if (to.matched.some((r) => r.meta.requiresAuth) && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.path.startsWith('/auth/') && isAuthenticated) {
    return { path: '/' }
  }
})

export default router
