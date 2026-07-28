<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink, RouterView } from 'vue-router'
import { appConfig } from './config/app'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)
const currentYear = new Date().getFullYear()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <header class="bg-primary-dark text-white shadow-md">
      <nav
        class="container mx-auto px-4 py-3 flex flex-wrap gap-3 justify-between items-center"
        aria-label="Main navigation"
      >
        <RouterLink to="/" class="font-bold text-xl">
          {{ appConfig.name }}
        </RouterLink>
        
        <div class="flex flex-wrap items-center gap-3">
          <template v-if="isLoggedIn">
            <RouterLink
              to="/dashboard" 
              class="text-sm hover:text-gray-200"
            >
              Dashboard
            </RouterLink>
            <span class="text-sm">Welcome, {{ currentUser?.username }}</span>
            <button 
              type="button"
              @click="logout" 
              class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login" 
              class="px-3 py-1 bg-primary hover:bg-primary-light rounded text-sm transition"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/register" 
              class="px-3 py-1 bg-secondary hover:bg-secondary-light rounded text-sm transition"
            >
              Register
            </RouterLink>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-grow">
      <RouterView />
    </main>

    <footer class="bg-gray-100 border-t">
      <div class="container mx-auto px-4 py-3 text-center text-gray-600 text-sm">
        &copy; {{ currentYear }} {{ appConfig.name }} — {{ appConfig.tagline }}
      </div>
    </footer>
  </div>
</template>
