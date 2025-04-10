<!-- frontend/src/views/MapView.vue -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDepoStore } from '../stores/depo'
import { useAuthStore } from '../stores/auth'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import DepoInfo from '../components/DepoInfo.vue'
import CreateDepoForm from '../components/CreateDepoForm.vue'

const depoStore = useDepoStore()
const authStore = useAuthStore()
const mapContainer = ref(null)
const map = ref(null)
const selectedDepo = ref(null)
const newDepoLocation = ref(null)
const loading = ref(true)
const error = ref(null)
const mapLegendOpen = ref(false)
const activeLayerView = ref('status') // 'status', 'type', or 'size'

const isLoggedIn = computed(() => authStore.isAuthenticated)

// Map initialization options
const mapOptions = {
  container: mapContainer.value,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [21.7453, 41.6086], // Center of Macedonia
  zoom: 8
}

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicGVyYWxvdiIsImEiOiJjbTlidDBpMXkwaXV1MmtzY3RpZGJqOW9iIn0.H02yq2yUVsLDQb3kKyp_Dw'

onMounted(async () => {
  try {
    // Fetch depos data
    await depoStore.fetchDepos()
    
    // Initialize map
    initializeMap()
  } catch (err) {
    console.error('Error initializing map:', err)
    error.value = 'Failed to load map data'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})

const initializeMap = () => {
  // Create map instance
  map.value = new mapboxgl.Map({
    ...mapOptions,
    container: mapContainer.value
  })
  
  // Add navigation control
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')
  
  // When map loads, add data
  map.value.on('load', () => {
    addClusteredData()
    
    // Add click listener for adding new depos
    if (isLoggedIn.value) {
      map.value.on('click', (e) => {
        // Check if clicked on a feature
        const features = map.value.queryRenderedFeatures(e.point, { 
          layers: ['unclustered-point', 'clusters'] 
        })
        
        // If clicked on empty space and logged in
        if (features.length === 0 && isLoggedIn.value) {
          // Set location for new depo
          newDepoLocation.value = {
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng
          }
          // Clear selected depo
          selectedDepo.value = null
        }
      })
    }
  })
}

const addClusteredData = () => {
  // Add source with clustering enabled
  map.value.addSource('depos', {
    type: 'geojson',
    data: createGeoJson(),
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points
    clusterRadius: 50 // Radius of each cluster when clustering points
  })
  
  // Add cluster layer
  map.value.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'depos',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions for cluster size and color based on point count
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6', // Small cluster color
        10, '#f1f075', // Medium cluster color
        30, '#f28cb1' // Large cluster color
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // Base radius for small clusters
        10, 30, // Medium clusters
        30, 40 // Large clusters
      ]
    }
  })
  
  // Add cluster count labels
  map.value.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'depos',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  })
  
  // Add individual point layer for unclustered points
  map.value.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'depos',
    filter: ['!', ['has', 'point_count']],
    paint: {
      // Color based on status
      'circle-color': [
        'match',
        ['get', activeLayerView.value === 'status' ? 'status' : 
               activeLayerView.value === 'type' ? 'type' : 'size'],
        // Status colors
        'clean', '#4ade80', // green
        'low', '#a3e635', // lime
        'medium', '#facc15', // yellow
        'high', '#ef4444', // red
        // Type colors (if view is set to type)
        'garbage', '#3b82f6', // blue
        'debris', '#a855f7', // purple
        'landfill', '#ec4899', // pink
        'electronic', '#14b8a6', // teal
        'hazardous', '#f97316', // orange
        'construction', '#6b7280', // gray
        'organic', '#84cc16', // lime
        'plastic', '#38bdf8', // sky
        // Default color
        '#3b82f6' // blue default
      ],
      'circle-radius': 10,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })
  
  // Cluster click handler - zoom in
  map.value.on('click', 'clusters', (e) => {
    const features = map.value.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    const clusterId = features[0].properties.cluster_id
    map.value.getSource('depos').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      
      map.value.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      })
    })
  })
  
  // Individual point click handler - show info
  map.value.on('click', 'unclustered-point', (e) => {
    // Clear new depo form if open
    newDepoLocation.value = null
    
    const features = map.value.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] })
    if (features.length > 0) {
      const feature = features[0]
      const depoId = feature.properties.id
      
      // Find the depo in our store
      const depo = depoStore.depos.find(d => d.id === depoId)
      if (depo) {
        selectedDepo.value = depo
      }
    }
  })
  
  // Change cursor on hover
  map.value.on('mouseenter', 'clusters', () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })
  
  map.value.on('mouseleave', 'clusters', () => {
    map.value.getCanvas().style.cursor = ''
  })
  
  map.value.on('mouseenter', 'unclustered-point', () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })
  
  map.value.on('mouseleave', 'unclustered-point', () => {
    map.value.getCanvas().style.cursor = ''
  })
}

// Convert depos to GeoJSON format
const createGeoJson = () => {
  return {
    type: 'FeatureCollection',
    features: depoStore.depos.map(depo => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [depo.longitude, depo.latitude]
      },
      properties: {
        id: depo.id,
        name: depo.name,
        status: depo.status || 'medium',
        type: depo.type || 'garbage',
        size: depo.size || 'medium',
        description: depo.description
      }
    }))
  }
}

// Change layer view (status, type, size)
const changeLayerView = (view) => {
  activeLayerView.value = view
  
  // Update the map style if it exists
  if (map.value && map.value.getSource('depos')) {
    map.value.setPaintProperty('unclustered-point', 'circle-color', [
      'match',
      ['get', view],
      // Status colors
      'clean', '#4ade80',
      'low', '#a3e635',
      'medium', '#facc15',
      'high', '#ef4444',
      // Type colors
      'garbage', '#3b82f6',
      'debris', '#a855f7',
      'landfill', '#ec4899',
      'electronic', '#14b8a6',
      'hazardous', '#f97316',
      'construction', '#6b7280',
      'organic', '#84cc16',
      'plastic', '#38bdf8',
      // Default color
      '#3b82f6'
    ])
  }
}

// Toggle map legend
const toggleMapLegend = () => {
  mapLegendOpen.value = !mapLegendOpen.value
}

// Handle depo creation success
const handleDepoCreated = async () => {
  // Reset form state
  newDepoLocation.value = null
  
  // Refresh map data
  await depoStore.fetchDepos()
  
  // Update the map source
  if (map.value && map.value.getSource('depos')) {
    map.value.getSource('depos').setData(createGeoJson())
  }
}

// Close sidebars
const closeSidebar = () => {
  selectedDepo.value = null
  newDepoLocation.value = null
}
</script>

<template>
  <div class="relative h-screen w-full flex">
    <!-- Map Container -->
    <div ref="mapContainer" class="w-full h-full"></div>
    
    <!-- Loading Overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
      <p class="text-lg font-semibold text-gray-700">Loading map data...</p>
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>
    
    <!-- Layer Control -->
    <div class="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-2 z-10">
      <div class="flex space-x-2">
        <button 
          @click="changeLayerView('status')" 
          class="px-3 py-1 text-sm rounded-md"
          :class="activeLayerView === 'status' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'"
        >
          Status
        </button>
        <button 
          @click="changeLayerView('type')" 
          class="px-3 py-1 text-sm rounded-md"
          :class="activeLayerView === 'type' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'"
        >
          Type
        </button>
        <button 
          @click="changeLayerView('size')" 
          class="px-3 py-1 text-sm rounded-md"
          :class="activeLayerView === 'size' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'"
        >
          Size
        </button>
      </div>
    </div>
    
    <!-- Map Legend -->
    <div class="absolute bottom-4 left-4 z-10">
      <button 
        @click="toggleMapLegend" 
        class="bg-white p-2 rounded-full shadow-lg mb-2"
      >
        <span v-if="mapLegendOpen">✖</span>
        <span v-else>ℹ️</span>
      </button>
      
      <div v-if="mapLegendOpen" class="bg-white shadow-lg rounded-lg p-3 max-w-xs">
        <h3 class="font-bold mb-2">Map Legend</h3>
        
        <div v-if="activeLayerView === 'status'">
          <p class="text-sm font-medium mb-1">Contamination Status</p>
          <div class="space-y-1">
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span class="text-xs">Clean</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-lime-400 mr-2"></div>
              <span class="text-xs">Low</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
              <span class="text-xs">Medium</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
              <span class="text-xs">High</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="activeLayerView === 'type'">
          <p class="text-sm font-medium mb-1">Waste Type</p>
          <div class="space-y-1 grid grid-cols-2 gap-x-2">
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
              <span class="text-xs">Garbage</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
              <span class="text-xs">Debris</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-pink-500 mr-2"></div>
              <span class="text-xs">Landfill</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-teal-500 mr-2"></div>
              <span class="text-xs">Electronic</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
              <span class="text-xs">Hazardous</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-gray-500 mr-2"></div>
              <span class="text-xs">Construction</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-lime-500 mr-2"></div>
              <span class="text-xs">Organic</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-sky-500 mr-2"></div>
              <span class="text-xs">Plastic</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="activeLayerView === 'size'">
          <p class="text-sm font-medium mb-1">Size</p>
          <div class="space-y-1">
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span class="text-xs">Small (<2m radius, <10kg)</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
              <span class="text-xs">Medium (<10m radius, <100kg)</span>
            </div>
            <div class="flex items-center">
              <div class="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
              <span class="text-xs">Large (>10m radius, >100kg)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Sidebar for Depo Info -->
    <div v-if="selectedDepo" class="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg overflow-y-auto z-10">
      <div class="p-4">
        <button @click="closeSidebar" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <span class="text-xl">&times;</span>
        </button>
        <DepoInfo :depo="selectedDepo" />
      </div>
    </div>
    
    <!-- Sidebar for New Depo Form -->
    <div v-else-if="newDepoLocation" class="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg overflow-y-auto z-10">
      <div class="p-4">
        <button @click="closeSidebar" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <span class="text-xl">&times;</span>
        </button>
        <h2 class="text-xl font-bold mb-4">Add New Landfill Site</h2>
        <CreateDepoForm 
          :location="newDepoLocation" 
          @depo-created="handleDepoCreated" 
        />
      </div>
    </div>
    
    <!-- No-Login Message -->
    <div v-if="!isLoggedIn" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-md">
      <p class="text-sm text-gray-700">
        <router-link to="/login" class="text-primary hover:text-primary-dark font-medium">Sign in</router-link>
        to add new landfill sites
      </p>
    </div>
  </div>
</template>