<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useDepoStore } from '../stores/depo'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  depoId: {
    type: Number,
    required: true
  }
})

const depoStore = useDepoStore()
const authStore = useAuthStore()
const comments = ref([])
const newComment = shallowRef('')
const isLoading = shallowRef(true)
const isSubmitting = shallowRef(false)
const error = shallowRef('')
const isLoggedIn = computed(() => authStore.isAuthenticated)

onMounted(async () => {
  await fetchComments()
})

const fetchComments = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    comments.value = await depoStore.fetchDepoComments(props.depoId)
  } catch (err) {
    console.error('Error fetching comments:', err)
    error.value = 'Failed to load comments'
  } finally {
    isLoading.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  
  isSubmitting.value = true
  
  try {
    const createdComment = await depoStore.addComment(
      props.depoId,
      newComment.value
    )
    
    if (createdComment) {
      comments.value.unshift(createdComment)
      newComment.value = ''
    }
  } catch (err) {
    console.error('Error submitting comment:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mt-6">
    <h3 class="font-semibold text-gray-700 mb-2">Comments</h3>
    
    <div v-if="isLoggedIn" class="mb-4">
      <form @submit.prevent="submitComment">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          rows="2"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
        ></textarea>
        <button
          type="submit"
          :disabled="isSubmitting || !newComment.trim()"
          class="mt-2 inline-flex justify-center py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </form>
    </div>
    
    <div v-else class="mb-4 p-3 bg-gray-100 rounded text-sm">
      <router-link to="/login" class="text-primary hover:text-primary-dark font-medium">Sign in</router-link>
      to post comments
    </div>
    
    <div v-if="isLoading" class="text-center py-4 text-gray-500 text-sm">
      Loading comments...
    </div>
    
    <div v-else-if="error" class="text-center py-4 text-red-500 text-sm">
      {{ error }}
    </div>
    
    <div v-else-if="comments.length === 0" class="text-center py-4 text-gray-500 text-sm">
      No comments yet. Be the first to comment!
    </div>
    
    <div v-else class="space-y-3">
      <div v-for="comment in comments" :key="comment.id" class="bg-gray-50 p-3 rounded">
        <div class="flex justify-between">
          <span class="font-medium text-sm">{{ comment.author.username }}</span>
          <span class="text-xs text-gray-500">{{ new Date(comment.createdAt).toLocaleDateString() }}</span>
        </div>
        <p class="mt-1 text-sm">{{ comment.content }}</p>
      </div>
    </div>
  </div>
</template>
