import axios from 'axios'
import { defineStore } from 'pinia'
import { appConfig } from '../config/app'

const readStoredAuth = () => {
  const storedUser = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  if (!storedUser || !token) {
    return { token: null, user: null }
  }

  try {
    return { token, user: JSON.parse(storedUser) }
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return { token: null, user: null }
  }
}

export const useAuthStore = defineStore('auth', {
  state: readStoredAuth,

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    currentUser: (state) => state.user
  },

  actions: {
    async login(username, password) {
      try {
        const response = await axios.post(`${appConfig.apiUrl}/login`, {
          username,
          password
        })

        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      } catch (loginError) {
        console.error('Login error:', loginError)
        if (loginError.response?.status === 400) {
          return false
        }
        throw loginError
      }
    },

    async register(username, email, password) {
      try {
        const response = await axios.post(`${appConfig.apiUrl}/register`, {
          username,
          email,
          password
        })

        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      } catch (registrationError) {
        console.error('Registration error:', registrationError)
        if (registrationError.response?.status === 400) {
          return false
        }
        throw registrationError
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
