<!-- frontend/src/components/DepoInfo.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDepoStore } from '../stores/depo'
import { useAuthStore } from '../stores/auth'
import ReportForm from './ReportForm.vue'
import CleanupForm from './CleanupForm.vue'

const props = defineProps({
  depo: {
    type: Object,
    required: true
  }
})

const depoStore = useDepoStore()
const authStore = useAuthStore()
const reports = ref([])
const cleanups = ref([])
const comments = ref([])
const newComment = ref('')
const activeTab = ref('info')
const showReportForm = ref(false)
const showCleanupForm = ref(false)
const hasVouched = ref(false)
const vouchCount = ref(props.depo.vouch_count || 0)
const loading = ref(false)
const error = ref(null)

const isLoggedIn = computed(() => authStore.isAuthenticated)

// Helper computed properties for visualization
const statusColor = computed(() => depoStore.getStatusColor(props.depo.status || 'medium'))
const sizeColor = computed(() => depoStore.getSizeColor(props.depo.size || 'medium'))
const typeIcon = computed(() => depoStore.getTypeIcon(props.depo.type || 'garbage'))
const sizeLabel = computed(() => depoStore.getSizeLabel(props.depo.size || 'medium'))

// Status descriptions
const statusDescriptions = {
  clean: 'No waste visible at this site.',
  low: 'Minor waste present, but not a significant environmental concern.',
  medium: 'Considerable waste present, may require attention.',
  high: 'Severe waste contamination, immediate action recommended.'
}

// Type descriptions
const typeDescriptions = {
  garbage: 'Household waste and general garbage.',
  debris: 'Rubble, broken materials, and non-specific waste.',
  landfill: 'Designated or unofficial waste disposal site.',
  electronic: 'Discarded electronic devices and components.',
  hazardous: 'Toxic, flammable, or otherwise dangerous materials.',
  construction: 'Waste materials from construction or demolition.',
  organic: 'Biodegradable waste such as food scraps or yard waste.',
  plastic: 'Non-biodegradable plastics and synthetic materials.',
  other: 'Other types of waste not categorized above.'
}

const loadData = async () => {
  if (props.depo && props.depo.id) {
    loading.value = true
    try {
      // Fetch reports, cleanups, and comments in parallel
      const [reportData, cleanupData, commentData, vouchesData] = await Promise.all([
        depoStore.fetchReports(props.depo.id),
        depoStore.fetchCleanups(props.depo.id),
        depoStore.fetchDepoComments(props.depo.id),
        depoStore.fetchDepoVouches(props.depo.id)
      ])
      
      reports.value = reportData
      cleanups.value = cleanupData
      comments.value = commentData
      
      // Check if user has already vouched
      if (isLoggedIn.value && props.depo.vouches) {
        hasVouched.value = props.depo.vouches.includes(authStore.user.id)
      }
    } catch (err) {
      console.error('Error fetching depo details:', err)
      error.value = 'Failed to load complete details'
    } finally {
      loading.value = false
    }
  }
}

onMounted(async () => {
  // loadData();
})

watch( () => props.depo, (newVal, oldVal) => {

  loadData()

}, {immediate:true, deep: true});

// Switch between tabs
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// Submit a comment
const submitComment = async () => {
  if (!newComment.value.trim() || !isLoggedIn.value) return
  
  try {
    const comment = await depoStore.addComment(props.depo.id, newComment.value)
    comments.value.unshift(comment)
    newComment.value = ''
  } catch (err) {
    console.error('Error adding comment:', err)
  }
}

// Toggle report form
const toggleReportForm = () => {
  showReportForm.value = !showReportForm.value
  if (showReportForm.value) {
    showCleanupForm.value = false
  }
}

// Toggle cleanup form
const toggleCleanupForm = () => {
  showCleanupForm.value = !showCleanupForm.value
  if (showCleanupForm.value) {
    showReportForm.value = false
  }
}

// Submit a report
const handleReportSubmit = async (reportData) => {
  try {
    const report = await depoStore.reportDepo(props.depo.id, reportData)
    reports.value.unshift(report)
    showReportForm.value = false
  } catch (err) {
    console.error('Error submitting report:', err)
  }
}

// Submit a cleanup
const handleCleanupSubmit = async (cleanupData) => {
  try {
    const cleanup = await depoStore.scheduleCleanup(props.depo.id, cleanupData)
    cleanups.value.unshift(cleanup)
    showCleanupForm.value = false
  } catch (err) {
    console.error('Error scheduling cleanup:', err)
  }
}

// Vouch for the depo
const vouchForDepo = async () => {
  if (!isLoggedIn.value || hasVouched.value) return
  
  try {
    const result = await depoStore.vouchForDepo(props.depo.id)
    vouchCount.value = result.vouchCount
    hasVouched.value = true
  } catch (err) {
    console.error('Error vouching for depo:', err)
  }
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<template>
  <div class="relative">
    <h2 class="text-2xl font-bold mb-2">{{ depo.name }}</h2>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="py-4 text-center">
      <p class="text-gray-500">Loading details...</p>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="p-2 text-sm text-red-700 bg-red-100 rounded-md mb-4">
      {{ error }}
    </div>
    
    <!-- Tab navigation -->
    <div class="flex border-b mb-4">
      <button 
        @click="setActiveTab('info')" 
        class="px-4 py-2 focus:outline-none"
        :class="activeTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'"
      >
        Info
      </button>
      <button 
        @click="setActiveTab('reports')" 
        class="px-4 py-2 focus:outline-none"
        :class="activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'"
      >
        Reports ({{ reports.length }})
      </button>
      <button 
        @click="setActiveTab('cleanups')" 
        class="px-4 py-2 focus:outline-none"
        :class="activeTab === 'cleanups' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'"
      >
        Cleanups ({{ cleanups.length }})
      </button>
      <button 
        @click="setActiveTab('comments')" 
        class="px-4 py-2 focus:outline-none"
        :class="activeTab === 'comments' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'"
      >
        Comments ({{ comments.length }})
      </button>
    </div>
    
    <!-- Info tab -->
    <div v-if="activeTab === 'info'" class="space-y-4">
      <!-- Basic info -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <p v-if="depo.description" class="text-gray-700 mb-4">{{ depo.description }}</p>
        
        <!-- Contamination status -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Contamination Status</h3>
          <div class="flex items-center">
            <div class="h-3 w-3 rounded-full mr-2" :style="{ backgroundColor: statusColor }"></div>
            <span class="font-medium">{{ depo.status ? depo.status.charAt(0).toUpperCase() + depo.status.slice(1) : 'Medium' }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ statusDescriptions[depo.status] || statusDescriptions.medium }}</p>
        </div>
        
        <!-- Waste Type -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Waste Type</h3>
          <div class="flex items-center">
            <span class="font-medium">{{ depo.type ? depo.type.charAt(0).toUpperCase() + depo.type.slice(1) : 'Garbage' }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ typeDescriptions[depo.type] || typeDescriptions.garbage }}</p>
        </div>
        
        <!-- Size -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Size</h3>
          <div class="flex items-center">
            <div class="h-3 w-3 rounded-full mr-2" :style="{ backgroundColor: sizeColor }"></div>
            <span class="font-medium">{{ sizeLabel }}</span>
          </div>
        </div>
        
        <!-- Location -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Location</h3>
          <p class="text-sm">
            Lat: {{ depo.latitude.toFixed(6) }}, 
            Lng: {{ depo.longitude.toFixed(6) }}
          </p>
        </div>
        
        <!-- Added by -->
        <div v-if="depo.createdBy" class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Added by</h3>
          <p class="text-sm">{{ depo.createdBy.username }} on {{ formatDate(depo.createdAt) }}</p>
        </div>
        
        <!-- Vouches -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-500 mb-1">Reported by {{ vouchCount }} people</h3>
          <button 
            v-if="isLoggedIn && !hasVouched"
            @click="vouchForDepo"
            class="mt-1 text-sm px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          >
            Vouch for this report
          </button>
          <p v-else-if="hasVouched" class="text-sm text-green-600">You've vouched for this report</p>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div v-if="isLoggedIn" class="flex flex-wrap gap-2">
        <button 
          @click="toggleReportForm"
          class="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
        >
          Report Issue
        </button>
        <button 
          @click="toggleCleanupForm"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Schedule Cleanup
        </button>
      </div>
      
      <!-- Report form -->
      <div v-if="showReportForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Report an Issue</h3>
        <ReportForm :depo-id="depo.id" @report-submitted="handleReportSubmit" />
      </div>
      
      <!-- Cleanup form -->
      <div v-if="showCleanupForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Schedule a Cleanup</h3>
        <CleanupForm :depo-id="depo.id" @cleanup-submitted="handleCleanupSubmit" />
      </div>
    </div>
    
    <!-- Reports tab -->
    <div v-else-if="activeTab === 'reports'" class="space-y-4">
      <div v-if="reports.length === 0" class="py-4 text-center text-gray-500">
        No reports yet
      </div>
      
      <div v-for="report in reports" :key="report.id" class="p-4 bg-gray-50 rounded-lg">
        <p class="font-medium">{{ report.details }}</p>
        <div class="mt-2 text-sm text-gray-500">
          <span>Reported by {{ report.reporter.username }}</span>
          <span class="mx-1">•</span>
          <span>{{ formatDate(report.createdAt) }}</span>
          <span 
            class="ml-2 px-2 py-0.5 rounded text-xs" 
            :class="{
              'bg-yellow-100 text-yellow-800': report.status === 'pending',
              'bg-green-100 text-green-800': report.status === 'verified',
              'bg-red-100 text-red-800': report.status === 'rejected'
            }"
          >
            {{ report.status.charAt(0).toUpperCase() + report.status.slice(1) }}
          </span>
        </div>
      </div>
      
      <button 
        v-if="isLoggedIn && !showReportForm"
        @click="toggleReportForm"
        class="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
      >
        Report Issue
      </button>
      
      <div v-if="showReportForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Report an Issue</h3>
        <ReportForm :depo-id="depo.id" @report-submitted="handleReportSubmit" />
      </div>
    </div>
    
    <!-- Cleanups tab -->
    <div v-else-if="activeTab === 'cleanups'" class="space-y-4">
      <div v-if="cleanups.length === 0" class="py-4 text-center text-gray-500">
        No cleanups scheduled yet
      </div>
      
      <div v-for="cleanup in cleanups" :key="cleanup.id" class="p-4 bg-gray-50 rounded-lg">
        <h3 class="font-medium">Cleanup on {{ new Date(cleanup.date).toLocaleDateString() }}</h3>
        <p v-if="cleanup.details" class="text-sm mt-1">{{ cleanup.details }}</p>
        <div class="mt-2 text-sm text-gray-500">
          <span>Organized by {{ cleanup.organizer.username }}</span>
          <span 
            class="ml-2 px-2 py-0.5 rounded text-xs" 
            :class="{
              'bg-blue-100 text-blue-800': cleanup.status === 'scheduled',
              'bg-green-100 text-green-800': cleanup.status === 'completed',
              'bg-red-100 text-red-800': cleanup.status === 'cancelled'
            }"
          >
            {{ cleanup.status.charAt(0).toUpperCase() + cleanup.status.slice(1) }}
          </span>
        </div>
        <div v-if="cleanup.participants && cleanup.participants.length > 0" class="mt-2 text-sm">
          <p class="text-gray-500">{{ cleanup.participants.length }} participants</p>
        </div>
      </div>
      
      <button 
        v-if="isLoggedIn && !showCleanupForm"
        @click="toggleCleanupForm"
        class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
      >
        Schedule Cleanup
      </button>
      
      <div v-if="showCleanupForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Schedule a Cleanup</h3>
        <CleanupForm :depo-id="depo.id" @cleanup-submitted="handleCleanupSubmit" />
      </div>
    </div>
    
    <!-- Comments tab -->
    <div v-else-if="activeTab === 'comments'" class="space-y-4">
      <div v-if="isLoggedIn" class="mb-4">
        <textarea 
          v-model="newComment" 
          rows="3" 
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          placeholder="Add your comment..."
        ></textarea>
        <div class="flex justify-end mt-2">
          <button 
            @click="submitComment"
            :disabled="!newComment.trim()"
            class="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      </div>
      
      <div v-if="comments.length === 0" class="py-4 text-center text-gray-500">
        No comments yet
      </div>
      
      <div v-for="comment in comments" :key="comment.id" class="p-4 bg-gray-50 rounded-lg">
        <p>{{ comment.content }}</p>
        <div class="mt-2 text-sm text-gray-500">
          <span>{{ comment.author.username }}</span>
          <span class="mx-1">•</span>
          <span>{{ formatDate(comment.createdAt) }}</span>
        </div>
      </div>
      
      <div v-if="!isLoggedIn" class="py-2 text-center text-gray-500 text-sm">
        <router-link to="/login" class="text-primary hover:underline">Sign in</router-link>
        to add comments
      </div>
    </div>
  </div>
</template>