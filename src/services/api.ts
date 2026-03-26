import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 👇 METTEZ VOTRE IP ICI
const IP_ORDINATEUR = '192.168.1.6'; // Remplacez par votre IP
const API_URL = `http://${IP_ORDINATEUR}:8000/api`;

console.log('🌐 API_URL utilisée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
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
  async (error) => {  // ← AJOUTER "async" ICI
    if (error.code === 'ECONNREFUSED') {
      console.error('💥 Connexion refusée. Vérifiez que:');
      console.error('   1. Le backend est lancé: php artisan serve --host=0.0.0.0');
      console.error(`   2. L'IP est correcte: ${API_URL}`);
      console.error('   3. Le pare-feu autorise PHP');
      console.error('   4. Le téléphone et l\'ordinateur sont sur le même réseau WiFi');
    } else if (error.response?.status === 401) {
      console.log('🔐 Token expiré, déconnexion...');
      await SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(error);
  }
);

export default api;