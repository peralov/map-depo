// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css' 
import './assets/main.css' 

// Create the app instance
const app = createApp(App)

// Create and use Pinia BEFORE using any stores
const pinia = createPinia()
app.use(pinia)

// Add router
app.use(router)

// Mount the app
app.mount('#app')