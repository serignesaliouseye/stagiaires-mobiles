import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permission refusée');
        return null;
      }

      // 🔥 Récupération du projectId
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('❌ projectId manquant dans app.json');
        return null;
      }

      // Token
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log('✅ Push token:', token);

      this.expoPushToken = token;

      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      return null;
    }
  }

  async sendTokenToBackend(token: string) {
    try {
      await api.post('/notifications/register-token', { token });
      console.log('✅ Token envoyé au backend');
    } catch (error) {
      console.error('❌ Erreur envoi token:', error);
    }
  }

  async showLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  }

  async schedulePointageReminder() {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(8, 0, 0);

    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📱 Pointage quotidien',
        body: "N'oubliez pas de pointer votre présence !",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
  }

  async scheduleEndOfDayReminder() {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(17, 0, 0);

    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏁 Fin de journée',
        body: "Pensez à pointer votre départ !",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
  }

  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();