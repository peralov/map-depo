<script setup>
import { computed, shallowRef } from 'vue'

const props = defineProps({
  activeView: {
    type: String,
    required: true
  }
})

const isOpen = shallowRef(false)

const legends = {
  status: {
    title: 'Contamination status',
    items: [
      { label: 'Clean', color: '#4ade80' },
      { label: 'Low', color: '#a3e635' },
      { label: 'Medium', color: '#facc15' },
      { label: 'High', color: '#ef4444' }
    ]
  },
  type: {
    title: 'Waste type',
    items: [
      { label: 'Household garbage', color: '#3b82f6' },
      { label: 'Debris', color: '#a855f7' },
      { label: 'Landfill', color: '#ec4899' },
      { label: 'Electronic', color: '#14b8a6' },
      { label: 'Hazardous', color: '#f97316' },
      { label: 'Construction', color: '#6b7280' },
      { label: 'Organic', color: '#84cc16' },
      { label: 'Plastic', color: '#38bdf8' },
      { label: 'Other', color: '#64748b' }
    ]
  },
  size: {
    title: 'Site size',
    items: [
      { label: 'Small (<2m radius or <10kg)', color: '#4ade80' },
      { label: 'Medium (<10m radius or <100kg)', color: '#facc15' },
      { label: 'Large (>10m radius or >100kg)', color: '#ef4444' }
    ]
  }
}

const activeLegend = computed(() => legends[props.activeView] || legends.status)
</script>

<template>
  <div>
    <button
      type="button"
      class="mb-2 rounded-full bg-white p-2 shadow-lg"
      :aria-expanded="isOpen"
      aria-controls="map-legend"
      :aria-label="isOpen ? 'Close map legend' : 'Open map legend'"
      @click="isOpen = !isOpen"
    >
      <span aria-hidden="true">{{ isOpen ? '✕' : 'ⓘ' }}</span>
    </button>

    <div
      v-if="isOpen"
      id="map-legend"
      class="max-w-xs rounded-lg bg-white p-3 shadow-lg"
    >
      <h2 class="mb-2 font-bold">Map legend</h2>
      <p class="mb-2 text-sm font-medium">{{ activeLegend.title }}</p>
      <ul class="grid gap-1" :class="{ 'grid-cols-2': props.activeView === 'type' }">
        <li
          v-for="item in activeLegend.items"
          :key="item.label"
          class="flex items-center gap-2 text-xs"
        >
          <span
            class="h-3 w-3 shrink-0 rounded-full"
            :style="{ backgroundColor: item.color }"
            aria-hidden="true"
          ></span>
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
