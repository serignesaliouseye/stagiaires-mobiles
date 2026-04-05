import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Utilisez l'URL de votre backend déployé sur Render
const API_URL = process.env.API_URL || 'https://backend-pointage-cwb8.onrender.com/api';

console.log('🌐 API_URL utilisée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Augmenté pour Render (service gratuit parfois lent au réveil)
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  async (config) => {
    console.log('📡 Requête:', config.method?.toUpperCase(), config.url);
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
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('💥 Connexion refusée. Vérifiez que:');
      console.error(`   1. Le backend est accessible: ${API_URL}`);
      console.error('   2. Le backend n\'est pas en veille sur Render');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🌍 Erreur réseau. Vérifiez votre connexion internet.');
    } else if (error.response?.status === 401) {
      console.log('🔐 Token expiré, déconnexion...');
      await SecureStore.deleteItemAsync('token');
    } else if (error.response?.status === 503) {
      console.log('⏳ Service en cours de réveil (Render gratuit). Réessayez dans quelques secondes.');
    }
    return Promise.reject(error);
  }
);

export default api;