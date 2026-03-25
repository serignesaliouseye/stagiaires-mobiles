import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Remplacez cette IP par l'IP de votre ordinateur (pas 127.0.0.1)
// Pour trouver votre IP sur Windows: ipconfig (cherchez IPv4)
const API_URL = 'http://192.168.1.x:8000/api'; // À MODIFIER AVEC VOTRE IP

// Alternative pour émulateur Android
// const API_URL = 'http://10.0.2.2:8000/api';

// Alternative pour émulateur iOS
// const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur récupération token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      // Rediriger vers login (à gérer avec un event emitter)
      console.log('Session expirée, veuillez vous reconnecter');
    }
    return Promise.reject(error);
  }
);

export default api;