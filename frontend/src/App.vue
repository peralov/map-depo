<!-- frontend/src/App.vue -->
<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)

onMounted(() => {
  // Initialize auth from localStorage if available
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <header class="bg-primary-dark text-white shadow-md">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <router-link to="/" class="font-bold text-xl">Macedonia Landfill Tracker</router-link>
        
        <div class="flex items-center space-x-4">
          <template v-if="isLoggedIn">
            <router-link 
              to="/dashboard" 
              class="text-sm hover:text-gray-200"
            >
              Dashboard
            </router-link>
            <span class="text-sm">Welcome, {{ currentUser?.username }}</span>
            <button 
              @click="logout" 
              class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <router-link 
              to="/login" 
              class="px-3 py-1 bg-primary hover:bg-primary-light rounded text-sm transition"
            >
              Login
            </router-link>
            <router-link 
              to="/register" 
              class="px-3 py-1 bg-secondary hover:bg-secondary-light rounded text-sm transition"
            >
              Register
            </router-link>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-grow">
      <RouterView />
    </main>

    <footer class="bg-gray-100 border-t">
      <div class="container mx-auto px-4 py-3 text-center text-gray-600 text-sm">
        &copy; {{ new Date().getFullYear() }} Macedonia Landfill Tracker - Community Project
      </div>
    </footer>
  </div>
</template>