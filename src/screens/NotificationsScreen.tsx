import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

interface Notification {
  id: string;
  type: string;
  data: {
    sanction_id?: number;
    motif?: string;
    niveau?: string;
    message?: string;
    description?: string;
    type?: string;
  };
  read_at: string | null;
  created_at: string;
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      console.log('Réponse API notifications:', response.data);
      
      // ✅ Gérer les différents formats de réponse
      let notificationsData: Notification[] = [];
      
      // Format 1: { data: [...] }
      if (response.data?.data && Array.isArray(response.data.data)) {
        notificationsData = response.data.data;
      }
      // Format 2: { notifications: [...] }
      else if (response.data?.notifications && Array.isArray(response.data.notifications)) {
        notificationsData = response.data.notifications;
      }
      // Format 3: { data: { notifications: [...] } }
      else if (response.data?.data?.notifications && Array.isArray(response.data.data.notifications)) {
        notificationsData = response.data.data.notifications;
      }
      // Format 4: tableau direct
      else if (Array.isArray(response.data)) {
        notificationsData = response.data;
      }
      // Format 5: { success: true, data: [...] }
      else if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        notificationsData = response.data.data;
      }
      else {
        console.warn('Format de réponse inattendu:', response.data);
        notificationsData = [];
      }
      
      console.log('Notifications chargées:', notificationsData.length);
      setNotifications(notificationsData);
      
      const unread = notificationsData.filter((n: Notification) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      loadNotifications();
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur marquage tout comme lu:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/notifications/${notificationId}`);
              loadNotifications();
            } catch (error) {
              console.error('Erreur suppression:', error);
            }
          },
        },
      ]
    );
  };

  const deleteAllNotifications = async () => {
    Alert.alert(
      'Supprimer tout',
      'Voulez-vous vraiment supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer tout',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/notifications/all');
              loadNotifications();
            } catch (error) {
              console.error('Erreur suppression tout:', error);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationIcon = (type: string, data: any) => {
    if (data?.sanction_id || type === 'sanction') {
      return 'alert-circle';
    }
    if (data?.type === 'pointage_corrige') {
      return 'create';
    }
    if (data?.type === 'rappel') {
      return 'time';
    }
    return 'notifications';
  };

  const getNotificationColor = (type: string, data: any) => {
    if (data?.sanction_id || type === 'sanction') return '#EF4444';
    if (data?.type === 'pointage_corrige') return '#10B981';
    if (data?.type === 'rappel') return '#F59E0B';
    return '#4f46e5';
  };

  const getNotificationTitle = (notification: Notification) => {
    const { data, type } = notification;
    
    if (data?.sanction_id || type === 'sanction') {
      return `Sanction: ${data?.niveau || 'Avertissement'}`;
    }
    if (data?.type === 'pointage_corrige') {
      return 'Pointage corrigé';
    }
    if (data?.type === 'rappel') {
      return 'Rappel';
    }
    return 'Notification';
  };

  const getNotificationBody = (notification: Notification) => {
    const { data } = notification;
    
    if (data?.motif) {
      return data.motif;
    }
    if (data?.message) {
      return data.message;
    }
    if (data?.description) {
      return data.description;
    }
    return 'Vous avez une nouvelle notification';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read_at && styles.notificationUnread,
      ]}
      onPress={() => markAsRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type, item.data) + '20' }]}>
        <Ionicons
          name={getNotificationIcon(item.type, item.data)}
          size={24}
          color={getNotificationColor(item.type, item.data)}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.notificationTitle}>
            {getNotificationTitle(item)}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        
        <Text style={styles.notificationBody} numberOfLines={2}>
          {getNotificationBody(item)}
        </Text>
        
        {!item.read_at && (
          <View style={styles.unreadDot} />
        )}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {notifications.length > 0 && (
            <>
              <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
                <Ionicons name="checkmark-done" size={22} color="#4f46e5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteAllNotifications} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubText}>
              Vous serez notifié lorsqu'il y aura des nouvelles informations
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationUnread: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notificationBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default NotificationsScreen;