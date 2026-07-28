<script setup>
const props = defineProps({
  activeView: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change'])

const views = [
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
  { value: 'size', label: 'Size' }
]
</script>

<template>
  <div class="rounded-lg bg-white p-2 shadow-lg">
    <div class="flex gap-2" aria-label="Map marker color">
      <button
        v-for="view in views"
        :key="view.value"
        type="button"
        class="rounded-md px-3 py-1 text-sm"
        :class="
          props.activeView === view.value
            ? 'bg-primary text-white'
            : 'bg-gray-100 hover:bg-gray-200'
        "
        :aria-pressed="props.activeView === view.value"
        @click="emit('change', view.value)"
      >
        {{ view.label }}
      </button>
    </div>
  </div>
</template>
