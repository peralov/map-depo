<!-- frontend/src/components/CreateDepoForm.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useDepoStore } from '../stores/depo'

const props = defineProps({
  location: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['depo-created'])

const depoStore = useDepoStore()
const name = ref('')
const description = ref('')
const status = ref('medium')
const type = ref('garbage')
const size = ref('medium')
const submitting = ref(false)
const error = ref(null)
const userLocation = ref(null)
const useUserLocation = ref(false)

// Status options with explanations
const statusOptions = [
  { value: 'clean', label: 'Clean (No waste visible)' },
  { value: 'low', label: 'Low (Minor waste present)' },
  { value: 'medium', label: 'Medium (Considerable waste)' },
  { value: 'high', label: 'High (Severe waste contamination)' }
]

// Type options
const typeOptions = [
  { value: 'garbage', label: 'Household Garbage' },
  { value: 'debris', label: 'Debris/Rubble' },
  { value: 'landfill', label: 'Landfill' },
  { value: 'electronic', label: 'Electronic Waste' },
  { value: 'hazardous', label: 'Hazardous Materials' },
  { value: 'construction', label: 'Construction Waste' },
  { value: 'organic', label: 'Organic/Biodegradable' },
  { value: 'plastic', label: 'Plastic/Non-biodegradable' },
  { value: 'other', label: 'Other' }
]

// Size options with explanations
const sizeOptions = [
  { value: 'small', label: 'Small (<2m radius or <10kg)' },
  { value: 'medium', label: 'Medium (<10m radius or <100kg)' },
  { value: 'large', label: 'Large (>10m radius or >100kg)' }
]

// Get user's location if available
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
    },
    error => {
      console.warn('Error getting location:', error)
    }
  )
}

// Computed property for effective location (clicked or user's current)
const effectiveLocation = computed(() => {
  if (useUserLocation.value && userLocation.value) {
    return userLocation.value
  }
  return props.location
})

const submitForm = async () => {
  if (!name.value) {
    error.value = 'Name is required'
    return
  }
  
  const locationToUse = effectiveLocation.value
  
  if (!locationToUse.latitude || !locationToUse.longitude) {
    error.value = 'Valid location is required'
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    const depoData = {
      name: name.value,
      description: description.value,
      latitude: locationToUse.latitude,
      longitude: locationToUse.longitude,
      status: status.value,
      type: type.value,
      size: size.value
    }
    
    const result = await depoStore.createDepo(depoData)
    
    if (result) {
      // Reset form
      name.value = ''
      description.value = ''
      status.value = 'medium'
      type.value = 'garbage'
      size.value = 'medium'
      useUserLocation.value = false
      
      // Emit event to parent
      emit('depo-created')
    }
  } catch (err) {
    error.value = 'Failed to create landfill site'
    console.error('Error creating depo:', err)
  } finally {
    submitting.value = false
  }
}

// Toggle between clicked location and current user location
const toggleLocationSource = () => {
  // Only allow toggle if we have user location
  if (userLocation.value) {
    useUserLocation.value = !useUserLocation.value
  } else {
    // Try to get user location again
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          userLocation.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          useUserLocation.value = true
        },
        error => {
          console.warn('Error getting location:', error)
        }
      )
    }
  }
}
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div class="mb-4">
      <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
      <input 
        id="name" 
        v-model="name" 
        type="text" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        placeholder="Enter a name for this site"
        required
      >
    </div>
    
    <div class="mb-4">
      <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
      <textarea 
        id="description" 
        v-model="description" 
        rows="3" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        placeholder="Describe the site and its environmental impact"
      ></textarea>
    </div>
    
    <div class="mb-4">
      <label for="status" class="block text-sm font-medium text-gray-700">Contamination Status</label>
      <select 
        id="status" 
        v-model="status" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
      >
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div class="mb-4">
      <label for="type" class="block text-sm font-medium text-gray-700">Waste Type</label>
      <select 
        id="type" 
        v-model="type" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
      >
        <option v-for="option in typeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div class="mb-4">
      <label for="size" class="block text-sm font-medium text-gray-700">Size</label>
      <select 
        id="size" 
        v-model="size" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
      >
        <option v-for="option in sizeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700">Location</label>
      
      <div class="mt-1">
        <div class="flex items-center mb-2">
          <input 
            type="radio" 
            id="clickedLocation" 
            :checked="!useUserLocation" 
            @change="useUserLocation = false"
            class="mr-2"
          >
          <label for="clickedLocation" class="text-sm">Use clicked map location</label>
        </div>
        
        <div class="flex items-center mb-2">
          <input 
            type="radio" 
            id="userLocation" 
            :checked="useUserLocation" 
            @change="toggleLocationSource"
            class="mr-2"
            :disabled="!userLocation"
          >
          <label for="userLocation" class="text-sm" :class="{ 'text-gray-400': !userLocation }">
            Use my current location
          </label>
        </div>
      </div>
      
      <div class="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
        <p class="text-sm">
          <strong>Using: </strong>
          {{ useUserLocation ? 'Your current location' : 'Clicked map location' }}
        </p>
        <p class="text-sm">Latitude: {{ effectiveLocation.latitude?.toFixed(6) }}</p>
        <p class="text-sm">Longitude: {{ effectiveLocation.longitude?.toFixed(6) }}</p>
      </div>
    </div>
    
    <div v-if="error" class="p-2 text-sm text-red-700 bg-red-100 rounded-md mb-4">
      {{ error }}
    </div>
    
    <div class="flex justify-end">
      <button 
        type="submit" 
        class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        :disabled="submitting"
      >
        {{ submitting ? 'Submitting...' : 'Submit' }}
      </button>
    </div>
  </form>
</template>