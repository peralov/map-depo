<!-- frontend/src/views/DepoDetailView.vue -->
<script setup>
import {
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
  useTemplateRef
} from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import DepoComments from '../components/DepoComments.vue'
import { appConfig } from '../config/app'
import { useDepoStore } from '../stores/depo'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const depoStore = useDepoStore()
const router = useRouter()
const depo = shallowRef(null)
const map = shallowRef(null)
const mapContainer = useTemplateRef('mapContainer')
const loading = shallowRef(true)
const error = shallowRef('')
const mapError = shallowRef('')

onMounted(async () => {
  try {
    loading.value = true
    depo.value = await depoStore.fetchDepoById(parseInt(props.id))
    
    if (!depo.value) {
      error.value = 'Waste site not found'
      return
    }
    
    await nextTick()
    initializeMap()
  } catch (err) {
    console.error('Error loading waste site:', err)
    error.value = 'Failed to load waste site details'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  map.value?.remove()
  map.value = null
})

const initializeMap = () => {
  if (!depo.value || !mapContainer.value) {
    return
  }

  if (!appConfig.map.accessToken) {
    mapError.value =
      'Mapbox is not configured. Add VITE_MAPBOX_TOKEN to frontend/.env.local.'
    return
  }
  
  mapboxgl.accessToken = appConfig.map.accessToken
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: appConfig.map.style,
    center: [depo.value.longitude, depo.value.latitude],
    zoom: 14
  })
  
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')
  
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
    .addTo(map.value)
    
  const popupContent = document.createElement('h3')
  popupContent.className = 'font-bold'
  popupContent.textContent = depo.value.name

  new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  })
    .setLngLat([depo.value.longitude, depo.value.latitude])
    .setDOMContent(popupContent)
    .addTo(map.value)
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
        <div
          v-if="mapError"
          class="flex h-64 items-center justify-center bg-gray-100 p-6 text-center text-sm text-red-700 lg:h-96"
          role="alert"
        >
          {{ mapError }}
        </div>
        <div v-else ref="mapContainer" class="h-64 lg:h-96"></div>
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
            {{ depo.size ? depo.size.charAt(0).toUpperCase() + depo.size.slice(1) : 'Unknown' }}
          </span>
          
          <span class="text-gray-500 text-sm">
            Reported on {{ new Date(depo.createdAt).toLocaleDateString() }}
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
        
        <DepoComments :depo-id="depo.id" />
      </div>
    </div>
  </div>
</template>
