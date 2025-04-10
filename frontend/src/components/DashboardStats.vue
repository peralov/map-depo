<!-- frontend/src/components/DashboardStats.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useDepoStore } from '../stores/depo'

const depoStore = useDepoStore()
const stats = ref({
  totalDepos: 0,
  byStatus: {
    clean: 0,
    low: 0,
    medium: 0,
    high: 0
  },
  byType: {
    garbage: 0,
    debris: 0,
    landfill: 0,
    electronic: 0,
    hazardous: 0,
    construction: 0,
    organic: 0,
    plastic: 0,
    other: 0
  },
  bySize: {
    small: 0,
    medium: 0,
    large: 0
  }
})

onMounted(async () => {
  // Make sure depos are loaded
  if (depoStore.depos.length === 0) {
    await depoStore.fetchDepos()
  }
  
  calculateStats()
})

const calculateStats = () => {
  // Reset counters
  stats.value = {
    totalDepos: 0,
    byStatus: {
      clean: 0,
      low: 0,
      medium: 0,
      high: 0
    },
    byType: {
      garbage: 0,
      debris: 0,
      landfill: 0,
      electronic: 0,
      hazardous: 0,
      construction: 0,
      organic: 0,
      plastic: 0,
      other: 0
    },
    bySize: {
      small: 0,
      medium: 0,
      large: 0
    }
  }
  
  // Count depos
  depoStore.depos.forEach(depo => {
    // Total count
    stats.value.totalDepos++
    
    // By status
    const status = depo.status || 'medium'
    if (stats.value.byStatus[status] !== undefined) {
      stats.value.byStatus[status]++
    }
    
    // By type
    const type = depo.type || 'garbage'
    if (stats.value.byType[type] !== undefined) {
      stats.value.byType[type]++
    }
    
    // By size
    const size = depo.size || 'medium'
    if (stats.value.bySize[size] !== undefined) {
      stats.value.bySize[size]++
    }
  })
}

// Get percentage
const getPercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
</script>

<template>
  <div class="bg-white shadow-md rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4">Landfill Statistics</h2>
    
    <div class="mb-6">
      <p class="text-3xl font-bold text-primary">{{ stats.totalDepos }}</p>
      <p class="text-gray-600">Total registered sites</p>
    </div>
    
    <!-- Status breakdown -->
    <div class="mb-4">
      <h3 class="font-medium text-gray-700 mb-2">Contamination Status</h3>
      <div class="space-y-2">
        <!-- Clean -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span>Clean</span>
            <span>{{ stats.byStatus.clean }} ({{ getPercentage(stats.byStatus.clean, stats.totalDepos) }}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-green-500 h-2.5 rounded-full" :style="{ width: `${getPercentage(stats.byStatus.clean, stats.totalDepos)}%` }"></div>
          </div>
        </div>
        
        <!-- Low -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span>Low</span>
            <span>{{ stats.byStatus.low }} ({{ getPercentage(stats.byStatus.low, stats.totalDepos) }}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-lime-400 h-2.5 rounded-full" :style="{ width: `${getPercentage(stats.byStatus.low, stats.totalDepos)}%` }"></div>
          </div>
        </div>
        
        <!-- Medium -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span>Medium</span>
            <span>{{ stats.byStatus.medium }} ({{ getPercentage(stats.byStatus.medium, stats.totalDepos) }}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-yellow-400 h-2.5 rounded-full" :style="{ width: `${getPercentage(stats.byStatus.medium, stats.totalDepos)}%` }"></div>
          </div>
        </div>
        
        <!-- High -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span>High</span>
            <span>{{ stats.byStatus.high }} ({{ getPercentage(stats.byStatus.high, stats.totalDepos) }}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-red-500 h-2.5 rounded-full" :style="{ width: `${getPercentage(stats.byStatus.high, stats.totalDepos)}%` }"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Size breakdown -->
    <div class="mb-4">
      <h3 class="font-medium text-gray-700 mb-2">Size Distribution</h3>
      <div class="grid grid-cols-3 gap-2">
        <div class="text-center p-2 bg-gray-50 rounded">
          <div class="text-xl font-bold text-green-500">{{ stats.bySize.small }}</div>
          <div class="text-xs text-gray-600">Small</div>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded">
          <div class="text-xl font-bold text-yellow-400">{{ stats.bySize.medium }}</div>
          <div class="text-xs text-gray-600">Medium</div>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded">
          <div class="text-xl font-bold text-red-500">{{ stats.bySize.large }}</div>
          <div class="text-xs text-gray-600">Large</div>
        </div>
      </div>
    </div>
    
    <!-- Type breakdown -->
    <div>
      <h3 class="font-medium text-gray-700 mb-2">Waste Type Distribution</h3>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div v-for="(count, type) in stats.byType" :key="type" class="flex justify-between items-center">
          <span class="capitalize">{{ type }}</span>
          <span class="font-medium">{{ count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>