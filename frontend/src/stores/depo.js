// frontend/src/stores/depo.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { appConfig } from '../config/app'
import { useAuthStore } from './auth'

export const useDepoStore = defineStore('depo', () => {
  const depos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const apiUrl = appConfig.apiUrl
  
  // Get the auth store for token access
  const authStore = useAuthStore()
  
  // Fetch all depos
  const fetchDepos = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${apiUrl}/sites`)
      depos.value = response.data
      return depos.value
    } catch (err) {
      console.error('Error fetching waste sites:', err)
      error.value = 'Failed to fetch waste sites'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Fetch a single depo by ID
  const fetchDepoById = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${apiUrl}/sites/${id}`)
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        return null
      }
      console.error(`Error fetching waste site ${id}:`, err)
      error.value = 'Failed to fetch waste site details'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Create a new depo
  const createDepo = async (depoData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(
        `${apiUrl}/sites`,
        depoData,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      
      // Add the new depo to the local store
      depos.value.push(response.data)
      return response.data
    } catch (err) {
      console.error('Error creating waste site:', err)
      error.value = 'Failed to create waste site'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Update an existing depo
  const updateDepo = async (id, depoData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(
        `${apiUrl}/sites/${id}`,
        depoData,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      
      // Update the depo in the local store
      const index = depos.value.findIndex(d => d.id === id)
      if (index !== -1) {
        depos.value[index] = response.data
      }
      
      return response.data
    } catch (err) {
      console.error(`Error updating waste site ${id}:`, err)
      error.value = 'Failed to update waste site'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Report a depo issue
  const reportDepo = async (id, reportData) => {
    try {
      const response = await axios.post(
        `${apiUrl}/sites/${id}/reports`,
        reportData,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      return response.data
    } catch (err) {
      console.error(`Error reporting waste site ${id}:`, err)
      throw err
    }
  }
  
  // Schedule a cleanup
  const scheduleCleanup = async (id, cleanupData) => {
    try {
      const response = await axios.post(
        `${apiUrl}/sites/${id}/cleanups`,
        cleanupData,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      return response.data
    } catch (err) {
      console.error(`Error scheduling cleanup for waste site ${id}:`, err)
      throw err
    }
  }

  const fetchUpcomingCleanups = async () => {
    try {
      const response = await axios.get(`${apiUrl}/cleanups/upcoming`)
      return response.data
    } catch (err) {
      console.error('Error fetching upcoming cleanups:', err)
      throw err
    }
  }
    
  // Fetch vouches for a depo
  const fetchDepoVouches = async (depoId) => {
    try {
      const response = await axios.get(`${apiUrl}/sites/${depoId}/vouches`)
      return response.data
    } catch (err) {
      console.error(`Error fetching vouches for waste site ${depoId}:`, err)
      throw err
    }
  }
  
  // Vouch for a depo
  const vouchForDepo = async (id) => {
    try {
      const response = await axios.post(
        `${apiUrl}/sites/${id}/vouches`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      
      // Update the vouch count in local store
      const index = depos.value.findIndex(d => d.id === id)
      if (index !== -1) {
        depos.value[index].vouchCount = response.data.vouchCount
      }
      
      return response.data
    } catch (err) {
      console.error(`Error vouching for waste site ${id}:`, err)
      throw err
    }
  }
  
  // Fetch reports for a depo
  const fetchReports = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/sites/${id}/reports`)
      return response.data
    } catch (err) {
      console.error(`Error fetching reports for waste site ${id}:`, err)
      throw err
    }
  }
  
  // Fetch cleanups for a depo
  const fetchCleanups = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/sites/${id}/cleanups`)
      return response.data
    } catch (err) {
      console.error(`Error fetching cleanups for waste site ${id}:`, err)
      throw err
    }
  }
  
  // Fetch comments for a depo
  const fetchDepoComments = async (depoId) => {
    try {
      const response = await axios.get(`${apiUrl}/sites/${depoId}/comments`)
      return response.data
    } catch (err) {
      console.error(`Error fetching comments for waste site ${depoId}:`, err)
      throw err
    }
  }
  
  // Add a comment to a depo
  const addComment = async (depoId, content) => {
    try {
      const response = await axios.post(
        `${apiUrl}/sites/${depoId}/comments`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
      return response.data
    } catch (err) {
      console.error(`Error adding comment to waste site ${depoId}:`, err)
      throw err
    }
  }
  
  // Get color for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'clean': return '#4ade80' // green
      case 'low': return '#facc15' // yellow
      case 'medium': return '#fb923c' // orange
      case 'high': return '#ef4444' // red
      default: return '#3b82f6' // blue
    }
  }
  
  // Get color for size
  const getSizeColor = (size) => {
    switch (size) {
      case 'small': return '#4ade80' // green
      case 'medium': return '#facc15' // yellow
      case 'large': return '#ef4444' // red
      default: return '#3b82f6' // blue
    }
  }
  
  // Get label for size
  const getSizeLabel = (size) => {
    switch (size) {
      case 'small': return 'Small (<2m radius or <10kg)'
      case 'medium': return 'Medium (<10m radius or <100kg)'
      case 'large': return 'Large (>10m radius or >100kg)'
      default: return 'Unknown size'
    }
  }
  
  return {
    depos,
    loading,
    error,
    fetchDepos,
    fetchDepoById,
    createDepo,
    updateDepo,
    reportDepo,
    scheduleCleanup,
    fetchUpcomingCleanups,
    vouchForDepo,
    fetchReports,
    fetchDepoVouches,
    fetchCleanups,
    fetchDepoComments,
    addComment,
    getStatusColor,
    getSizeColor,
    getSizeLabel
  }
})
