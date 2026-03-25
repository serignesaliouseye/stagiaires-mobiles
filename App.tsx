import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import LoginScreen from './src/components/auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';
import { StorageKeys } from './src/utils/storage';

// ✅ Configuration globale des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 🔹 Vérifie si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync(StorageKeys.TOKEN);
        setIsAuthenticated(!!token);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // 🔹 Setup notifications après vérification auth
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      cleanup = await setupNotifications();
    };

    if (isAuthenticated !== null) {
      setup();
    }

    // 🔹 Nettoyage des listeners pour éviter fuite mémoire
    return () => {
      if (cleanup) cleanup();
    };
  }, [isAuthenticated]);

  // 🔹 Fonction pour configurer notifications
  const setupNotifications = async (): Promise<(() => void) | undefined> => {
    try {
      const token = await notificationService.registerForPushNotificationsAsync();

      if (token) {
        console.log('✅ Token push enregistré:', token);
      }

      // 🔹 Programmer les rappels seulement si authentifié
      if (isAuthenticated) {
        await notificationService.schedulePointageReminder();
        await notificationService.scheduleEndOfDayReminder();
      }

      // 🔹 Écouter les notifications
      const subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification reçue:', notification);
        }
      );

      const responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('Réponse à la notification:', response);
        });

      // 🔹 Retourner la fonction de cleanup
      return () => {
        subscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('❌ Erreur setup notifications:', error);
    }
  };

  // 🔹 Affichage loading si auth non encore connue
  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // 🔹 Affichage de l'app
  return (
    <>
      <StatusBar style="auto" />
      {isAuthenticated ? (
        <AppNavigator />
      ) : (
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});