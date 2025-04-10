// frontend/src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('http://localhost:3000/api/login', {
          username,
          password
        });
        
        this.token = response.data.token;
        this.user = {
          id: response.data.userId,
          username: response.data.username,
          role: response.data.role
        };
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    
    async register(username, email, password) {
      try {
        const response = await axios.post('http://localhost:3000/api/register', {
          username,
          email,
          password
        });
        
        this.token = response.data.token;
        this.user = {
          id: response.data.userId,
          username: response.data.username,
          role: 'public'
        };
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return true;
      } catch (error) {
        console.error('Registration error:', error);
        return false;
      }
    },
    
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
})