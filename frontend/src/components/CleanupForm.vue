<!-- frontend/src/components/CleanupForm.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  depoId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['cleanup-submitted'])

const date = ref('')
const details = ref('')
const submitting = ref(false)
const error = ref(null)

// Set min date to today
const today = new Date()
const minDate = today.toISOString().split('T')[0]

const submitForm = async () => {
  if (!date.value) {
    error.value = 'Date is required'
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    const cleanupData = {
      date: date.value,
      details: details.value
    }
    
    // Emit event for parent component to handle API call
    emit('cleanup-submitted', cleanupData)
    
    // Reset form
    date.value = ''
    details.value = ''
  } catch (err) {
    error.value = 'Failed to schedule cleanup'
    console.error('Error scheduling cleanup:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div class="mb-4">
      <label for="date" class="block text-sm font-medium text-gray-700">Cleanup Date *</label>
      <input 
        id="date" 
        v-model="date" 
        type="date" 
        :min="minDate"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        required
      >
    </div>
    
    <div class="mb-4">
      <label for="details" class="block text-sm font-medium text-gray-700">Details</label>
      <textarea 
        id="details" 
        v-model="details" 
        rows="3" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        placeholder="Add details about the cleanup (e.g., what to bring, meeting point, etc.)"
      ></textarea>
    </div>
    
    <div v-if="error" class="p-2 text-sm text-red-700 bg-red-100 rounded-md mb-4">
      {{ error }}
    </div>
    
    <div class="flex justify-end">
      <button 
        type="submit" 
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        :disabled="submitting"
      >
        {{ submitting ? 'Scheduling...' : 'Schedule Cleanup' }}
      </button>
    </div>
  </form>
</template>