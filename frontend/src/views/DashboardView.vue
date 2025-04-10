<!-- frontend/src/views/DashboardView.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDepoStore } from '../stores/depo'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import DashboardStats from '../components/DashboardStats.vue'

const depoStore = useDepoStore()
const authStore = useAuthStore()
const router = useRouter()
const recentDepos = ref([])
const recentCleanups = ref([])
const loading = ref(true)

const isLoggedIn = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

onMounted(async () => {
  // Redirect if not logged in
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  
  loading.value = true
  
  try {
    // Fetch depos if not already loaded
    if (depoStore.depos.length === 0) {
      await depoStore.fetchDepos()
    }
    
    // Get most recent 5 depos
    recentDepos.value = [...depoStore.depos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      
    // TODO: Fetch recent cleanups
    // recentCleanups.value = await depoStore.fetchRecentCleanups()
  } catch (err) {
    console.error('Error loading dashboard data:', err)
  } finally {
    loading.value = false
  }
})

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Get status badge class
const getStatusClass = (status) => {
  switch (status) {
    case 'clean': return 'bg-green-100 text-green-800'
    case 'low': return 'bg-lime-100 text-lime-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Navigate to depo details
const goToDepo = (id) => {
  router.push(`/depo/${id}`)
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-gray-600">Welcome back, {{ user?.username }}</p>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Loading dashboard data...</p>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Stats column -->
      <div>
        <DashboardStats />
      </div>
      
      <!-- Recent depos column -->
      <div class="lg:col-span-2">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
          <h2 class="text-xl font-bold mb-4">Recent Landfill Sites</h2>
          
          <div v-if="recentDepos.length === 0" class="text-center py-4 text-gray-500">
            No landfill sites have been reported yet
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="depo in recentDepos" 
              :key="depo.id" 
              class="border-b border-gray-100 pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
              @click="goToDepo(depo.id)"
            >
              <div class="flex justify-between">
                <h3 class="font-medium">{{ depo.name }}</h3>
                <span 
                  :class="getStatusClass(depo.status)"
                  class="px-2 py-0.5 rounded-full text-xs"
                >
                  {{ depo.status ? depo.status.charAt(0).toUpperCase() + depo.status.slice(1) : 'Medium' }}
                </span>
              </div>
              <p v-if="depo.description" class="text-sm text-gray-600 line-clamp-1">{{ depo.description }}</p>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>Type: {{ depo.type ? depo.type.charAt(0).toUpperCase() + depo.type.slice(1) : 'Garbage' }}</span>
                <span>{{ formatDate(depo.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="mt-4 text-center">
            <router-link to="/" class="text-primary hover:text-primary-dark text-sm">
              View all landfill sites on map &rarr;
            </router-link>
          </div>
        </div>
        
        <div class="bg-white shadow-md rounded-lg p-4">
          <h2 class="text-xl font-bold mb-4">Upcoming Cleanups</h2>
          
          <div v-if="recentCleanups.length === 0" class="text-center py-4 text-gray-500">
            No cleanups have been scheduled yet
          </div>
          
          <div v-else class="space-y-3">
            <!-- Cleanup items would go here -->
          </div>
          
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-medium mb-2">Organize a Cleanup Event</h3>
            <p class="text-sm text-gray-600 mb-3">
              Help clean up Macedonia by organizing a community cleanup event at one of the reported sites.
            </p>
            <router-link 
              to="/" 
              class="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Find a site to clean
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>