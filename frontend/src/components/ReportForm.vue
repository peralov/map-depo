<!-- frontend/src/components/ReportForm.vue -->
<script setup>
import { ref, shallowRef } from 'vue'

const emit = defineEmits(['report-submitted'])

const details = shallowRef('')
const images = ref([])
const submitting = shallowRef(false)
const error = shallowRef('')

const submitForm = async () => {
  if (!details.value.trim()) {
    error.value = 'Details are required'
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    const reportData = {
      details: details.value,
      images: images.value
    }
    
    // Emit event for parent component to handle API call
    emit('report-submitted', reportData)
    
    // Reset form
    details.value = ''
    images.value = []
  } catch (err) {
    error.value = 'Failed to submit report'
    console.error('Error submitting report:', err)
  } finally {
    submitting.value = false
  }
}

// File upload handling
const handleFileUpload = (event) => {
  const files = event.target.files
  if (!files.length) return
  
  // In a real app, you would upload the files to a server
  // For now, we'll just simulate storing the file data
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const reader = new FileReader()
    
    reader.onload = (e) => {
      images.value.push(e.target.result)
    }
    
    reader.readAsDataURL(file)
  }
}

// Remove image
const removeImage = (index) => {
  images.value.splice(index, 1)
}
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div class="mb-4">
      <label for="details" class="block text-sm font-medium text-gray-700">Issue Details *</label>
      <textarea 
        id="details" 
        v-model="details" 
        rows="3" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        placeholder="Describe the issue (e.g., increasing waste, hazardous materials, etc.)"
        required
      ></textarea>
    </div>
    
    <div class="mb-4">
      <label for="images" class="block text-sm font-medium text-gray-700">Add Photos</label>
      <input 
        type="file" 
        id="images" 
        @change="handleFileUpload" 
        multiple 
        accept="image/*" 
        class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
      >
      
      <!-- Preview uploaded images -->
      <div v-if="images.length > 0" class="mt-2 flex flex-wrap gap-2">
        <div v-for="(image, index) in images" :key="index" class="relative w-20 h-20">
          <img :src="image" class="w-full h-full object-cover rounded" />
          <button 
            @click.prevent="removeImage(index)" 
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="p-2 text-sm text-red-700 bg-red-100 rounded-md mb-4">
      {{ error }}
    </div>
    
    <div class="flex justify-end">
      <button 
        type="submit" 
        class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
        :disabled="submitting"
      >
        {{ submitting ? 'Submitting...' : 'Submit Report' }}
      </button>
    </div>
  </form>
</template>
