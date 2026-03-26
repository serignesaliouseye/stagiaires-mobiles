import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

interface Pointage {
  id: number;
  date: string;
  heure_arrivee: string | null;
  heure_sortie: string | null;
  statut: 'present' | 'retard' | 'absent' | 'justifie';
  note: string | null;
  duree?: string;
}

const HistoriqueScreen: React.FC = () => {
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('tous');
  const [selectedPointage, setSelectedPointage] = useState<Pointage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    retard: 0,
    absent: 0,
  });

  const loadHistorique = async () => {
    try {
      const response = await api.get('/pointages/historique', {
        params: { limit: 50 }
      });
      
      console.log('Réponse API historique:', response.data);
      
      // ✅ CORRECTION: Extraire le tableau des pointages du format paginé
      let pointagesData: Pointage[] = [];
      
      // Format attendu: { data: { data: [...] } }
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        pointagesData = response.data.data.data;
      }
      // Fallback: { data: [...] }
      else if (response.data?.data && Array.isArray(response.data.data)) {
        pointagesData = response.data.data;
      }
      // Fallback: tableau direct
      else if (Array.isArray(response.data)) {
        pointagesData = response.data;
      }
      
      console.log('Pointages chargés:', pointagesData.length);
      setPointages(pointagesData);
      
      // ✅ Utiliser les stats déjà calculées par le backend
      if (response.data?.stats) {
        setStats({
          total: response.data.stats.total || pointagesData.length,
          present: response.data.stats.present || 0,
          retard: response.data.stats.retard || 0,
          absent: response.data.stats.absent || 0,
        });
      } else {
        // Calcul local de secours
        const newStats = {
          total: pointagesData.length,
          present: pointagesData.filter((p: Pointage) => p.statut === 'present').length,
          retard: pointagesData.filter((p: Pointage) => p.statut === 'retard').length,
          absent: pointagesData.filter((p: Pointage) => p.statut === 'absent').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistorique();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistorique();
  };

  const getFilteredPointages = () => {
    if (!pointages || !Array.isArray(pointages)) return [];
    if (filter === 'tous') return pointages;
    return pointages.filter(p => p.statut === filter);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'present': return '#10B981';
      case 'retard': return '#F59E0B';
      case 'absent': return '#EF4444';
      case 'justifie': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'present': return 'Présent';
      case 'retard': return 'Retard';
      case 'absent': return 'Absent';
      case 'justifie': return 'Justifié';
      default: return statut;
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'present': return 'checkmark-circle';
      case 'retard': return 'time';
      case 'absent': return 'close-circle';
      case 'justifie': return 'document-text';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  const filteredPointages = getFilteredPointages();

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec statistiques */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon historique</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.present}</Text>
            <Text style={styles.statLabel}>Présents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.retard}</Text>
            <Text style={styles.statLabel}>Retards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absents</Text>
          </View>
        </View>
      </View>

      {/* Filtres */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {['tous', 'present', 'retard', 'absent', 'justifie'].map((filterKey) => (
          <TouchableOpacity
            key={filterKey}
            style={[
              styles.filterButton,
              filter === filterKey && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterKey)}
          >
            <Text style={[
              styles.filterText,
              filter === filterKey && styles.filterTextActive
            ]}>
              {filterKey === 'tous' ? 'Tous' : getStatusLabel(filterKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des pointages */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      >
        {filteredPointages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun pointage trouvé</Text>
            <Text style={styles.emptySubText}>
              Scannez un QR code pour enregistrer votre premier pointage
            </Text>
          </View>
        ) : (
          filteredPointages.map((pointage) => (
            <TouchableOpacity
              key={pointage.id}
              style={styles.pointageCard}
              onPress={() => {
                setSelectedPointage(pointage);
                setModalVisible(true);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                  <Text style={styles.dateText}>{formatDate(pointage.date)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pointage.statut) + '20' }]}>
                  <Ionicons name={getStatusIcon(pointage.statut)} size={16} color={getStatusColor(pointage.statut)} />
                  <Text style={[styles.statusText, { color: getStatusColor(pointage.statut) }]}>
                    {getStatusLabel(pointage.statut)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.timeContainer}>
                  <Ionicons name="log-in" size={20} color="#6B7280" />
                  <Text style={styles.timeLabel}>Arrivée</Text>
                  <Text style={styles.timeValue}>{formatTime(pointage.heure_arrivee)}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name="log-out" size={20} color="#6B7280" />
                  <Text style={styles.timeLabel}>Départ</Text>
                  <Text style={styles.timeValue}>{formatTime(pointage.heure_sortie)}</Text>
                </View>
                {pointage.duree && (
                  <View style={styles.dureeContainer}>
                    <Ionicons name="hourglass-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.dureeText}>Durée: {pointage.duree}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de détails */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails du pointage</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPointage && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPointage.date)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedPointage.statut) + '20' }]}>
                    <Ionicons name={getStatusIcon(selectedPointage.statut)} size={20} color={getStatusColor(selectedPointage.statut)} />
                    <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedPointage.statut) }]}>
                      {getStatusLabel(selectedPointage.statut)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure d'arrivée</Text>
                  <Text style={styles.detailValue}>{formatTime(selectedPointage.heure_arrivee)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure de départ</Text>
                  <Text style={styles.detailValue}>{formatTime(selectedPointage.heure_sortie)}</Text>
                </View>

                {selectedPointage.note && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Note du coach</Text>
                    <Text style={styles.detailValueNote}>{selectedPointage.note}</Text>
                  </View>
                )}

                {selectedPointage.statut === 'justifie' && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Ce pointage a été justifié et validé par votre coach.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#4f46e5',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  pointageCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  dureeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dureeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  detailValueNote: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoriqueScreen;