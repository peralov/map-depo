<!-- frontend/src/views/DepoDetailView.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useDepoStore } from '../stores/depo'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import DepoComments from '../components/DepoComments.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const depoStore = useDepoStore()
const authStore = useAuthStore()
const router = useRouter()
const depo = ref(null)
const mapContainer = ref(null)
const loading = ref(true)
const error = ref(null)

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94LWRlbW8iLCJhIjoiY2szdWJuZnliMGJrazNvcGNiZDc3M2diNSJ9.Gj-5_JOGy1Dh5T8a4nNJJw'

onMounted(async () => {
  try {
    loading.value = true
    depo.value = await depoStore.fetchDepoById(parseInt(props.id))
    
    if (!depo.value) {
      error.value = 'Landfill site not found'
      return
    }
    
    // Initialize map
    await initializeMap()
    
  } catch (err) {
    console.error('Error loading depo:', err)
    error.value = 'Failed to load landfill site details'
  } finally {
    loading.value = false
  }
})

const initializeMap = async () => {
  if (!depo.value) return
  
  const map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [depo.value.longitude, depo.value.latitude],
    zoom: 14
  })
  
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  
  // Add marker
  const markerColor = getMarkerColor(depo.value.size)
  
  const el = document.createElement('div')
  el.className = 'marker'
  el.style.backgroundColor = markerColor
  el.style.width = '25px'
  el.style.height = '25px'
  el.style.borderRadius = '50%'
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)'
  
  new mapboxgl.Marker(el)
    .setLngLat([depo.value.longitude, depo.value.latitude])
    .addTo(map)
    
  // Add popup
  new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  })
  .setLngLat([depo.value.longitude, depo.value.latitude])
  .setHTML(`<h3 class="font-bold">${depo.value.name}</h3>`)
  .addTo(map)
  
  // Wait for map to load
  await new Promise(resolve => {
    map.on('load', resolve)
  })
}

const getMarkerColor = (size) => {
  switch (size) {
    case 'small': return '#4ade80' // green
    case 'medium': return '#facc15' // yellow
    case 'large': return '#ef4444' // red
    default: return '#3b82f6' // blue
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <button 
      @click="goBack" 
      class="mb-4 flex items-center text-primary hover:text-primary-dark"
    >
      &larr; Back to Map
    </button>
    
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading site details...</p>
    </div>
    
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500">{{ error }}</p>
    </div>
    
    <div v-else-if="depo" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div ref="mapContainer" class="h-64 lg:h-96"></div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold mb-2">{{ depo.name }}</h1>
        
        <div class="mb-4">
          <span 
            :class="{
              'bg-green-100 text-green-800': depo.size === 'small',
              'bg-yellow-100 text-yellow-800': depo.size === 'medium',
              'bg-red-100 text-red-800': depo.size === 'large',
              'bg-blue-100 text-blue-800': !['small', 'medium', 'large'].includes(depo.size)
            }"
            class="inline-block px-2 py-1 rounded text-xs font-semibold mr-2"
          >
            {{ depo.size.charAt(0).toUpperCase() + depo.size.slice(1) }}
          </span>
          
          <span class="text-gray-500 text-sm">
            Reported on {{ new Date(depo.created_at).toLocaleDateString() }}
          </span>
        </div>
        
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Description</h2>
          <p class="text-gray-700">{{ depo.description || 'No description provided.' }}</p>
        </div>
        
        <div class="mb-4">
          <h2 class="text-lg font-semibold mb-2">Location</h2>
          <p class="text-gray-700">
            Latitude: {{ depo.latitude.toFixed(6) }}<br>
            Longitude: {{ depo.longitude.toFixed(6) }}
          </p>
        </div>
        
        <DepoComments :depoId="depo.id" />
      </div>
    </div>
  </div>
</template>