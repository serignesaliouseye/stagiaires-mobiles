import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Stats, Pointage } from '../../types';
import { getUser } from '../../utils/storage';

const DashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastPointage, setLastPointage] = useState<Pointage | null>(null);
  const [user, setUser] = useState<any>(null);

  const loadData = async () => {
    try {
      const [statsRes, pointagesRes, userData] = await Promise.all([
        api.get('/pointages/stats'),
        api.get('/pointages/historique?limit=1'),
        getUser(),
      ]);

      setStats(statsRes.data);
      setLastPointage(pointagesRes.data.data[0] || null);
      setUser(userData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'present': return { bg: '#DCFCE7', text: '#166534' };
      case 'retard': return { bg: '#FEF9C3', text: '#854D0E' };
      case 'absent': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'justifie': return { bg: '#DBEAFE', text: '#1E40AF' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user?.prenom} 👋
          </Text>
          <Text style={styles.promotion}>{user?.promotion}</Text>
        </View>

        {/* Dernier pointage */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dernier pointage</Text>
          {lastPointage ? (
            <View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date:</Text>
                <Text style={styles.rowValue}>
                  {new Date(lastPointage.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Arrivée:</Text>
                <Text style={styles.rowValue}>
                  {lastPointage.heure_arrivee || 'Non pointé'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Départ:</Text>
                <Text style={styles.rowValue}>
                  {lastPointage.heure_sortie || 'Non pointé'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Statut:</Text>
                <View style={[
                  styles.badge,
                  { backgroundColor: getStatusStyle(lastPointage.statut).bg }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: getStatusStyle(lastPointage.statut).text }
                  ]}>
                    {lastPointage.statut.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Aucun pointage aujourd'hui
            </Text>
          )}
        </View>

        {/* Statistiques du mois */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques du mois</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#16A34A' }]}>
                {stats?.mois_actuel?.present || 0}
              </Text>
              <Text style={styles.statLabel}>Présents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>
                {stats?.mois_actuel?.retard || 0}
              </Text>
              <Text style={styles.statLabel}>Retards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                {stats?.mois_actuel?.absent || 0}
              </Text>
              <Text style={styles.statLabel}>Absents</Text>
            </View>
          </View>

          <View style={styles.presenceRow}>
            <Text style={styles.rowLabel}>Taux de présence:</Text>
            <Text style={styles.presenceValue}>
              {stats?.pourcentage_presence || 0}%
            </Text>
          </View>
        </View>

        {/* Info scanner */}
        <View style={styles.scanInfo}>
          <Text style={styles.scanText}>
            Scannez le QR code pour pointer
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  promotion: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  rowValue: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  presenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  presenceValue: {
    fontWeight: 'bold',
    color: '#4F46E5',
    fontSize: 16,
  },
  scanInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scanText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default DashboardScreen;