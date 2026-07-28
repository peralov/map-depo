<script setup>
import { computed, reactive, shallowRef } from 'vue'
import { useDepoStore } from '../stores/depo'

const props = defineProps({
  location: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['site-created'])

const depoStore = useDepoStore()
const form = reactive({
  name: '',
  description: '',
  status: 'medium',
  type: 'garbage',
  size: 'medium'
})
const submitting = shallowRef(false)
const error = shallowRef('')
const userLocation = shallowRef(null)
const useUserLocation = shallowRef(false)

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

// Computed property for effective location (clicked or user's current)
const effectiveLocation = computed(() => {
  if (useUserLocation.value && userLocation.value) {
    return userLocation.value
  }
  return props.location
})

const submitForm = async () => {
  if (!form.name.trim()) {
    error.value = 'Name is required'
    return
  }
  
  const locationToUse = effectiveLocation.value
  const latitude = Number(locationToUse?.latitude)
  const longitude = Number(locationToUse?.longitude)
  
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    error.value = 'Valid location is required'
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    const depoData = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude,
      longitude,
      status: form.status,
      type: form.type,
      size: form.size
    }
    
    const createdSite = await depoStore.createDepo(depoData)
    
    if (createdSite) {
      form.name = ''
      form.description = ''
      form.status = 'medium'
      form.type = 'garbage'
      form.size = 'medium'
      useUserLocation.value = false
      emit('site-created', createdSite)
    }
  } catch (err) {
    error.value = depoStore.error || 'Failed to create waste site'
    console.error('Error creating waste site:', err)
  } finally {
    submitting.value = false
  }
}

const selectUserLocation = () => {
  if (userLocation.value) {
    useUserLocation.value = true
    return
  }

  if (!navigator.geolocation) {
    error.value = 'Location access is not supported by this browser'
    useUserLocation.value = false
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      useUserLocation.value = true
      error.value = ''
    },
    (geolocationError) => {
      console.warn('Error getting location:', geolocationError)
      error.value =
        'Your location could not be accessed. Continue with the clicked map location.'
      useUserLocation.value = false
    }
  )
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submitForm">
    <div class="mb-4">
      <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
      <input 
        id="name" 
        v-model="form.name"
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
        v-model="form.description"
        rows="3" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        placeholder="Describe the site and its environmental impact"
      ></textarea>
    </div>
    
    <div class="mb-4">
      <label for="status" class="block text-sm font-medium text-gray-700">Contamination Status</label>
      <select 
        id="status" 
        v-model="form.status"
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
        v-model="form.type"
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
        v-model="form.size"
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
            @change="selectUserLocation"
            class="mr-2"
          >
          <label for="userLocation" class="text-sm">
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
