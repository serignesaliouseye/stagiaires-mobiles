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

interface Sanction {
  id: number;
  niveau: 'avertissement' | 'blame' | 'suspension' | 'exclusion';
  motif: string;
  description: string;
  date_sanction: string;
  date_fin_suspension: string | null;
  est_lue: boolean;
  coach_nom?: string;
}

const SanctionsScreen: React.FC = () => {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<string>('tous');

  const loadSanctions = async () => {
    try {
      const response = await api.get('/sanctions');
      const data = response.data?.data || response.data || [];
      setSanctions(data);
    } catch (error) {
      console.error('Erreur chargement sanctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSanctions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSanctions();
  };

  const getFilteredSanctions = () => {
    if (filter === 'tous') return sanctions;
    return sanctions.filter(s => s.niveau === filter);
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'avertissement': return '#F59E0B';
      case 'blame': return '#F97316';
      case 'suspension': return '#EF4444';
      case 'exclusion': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getNiveauLabel = (niveau: string) => {
    switch (niveau) {
      case 'avertissement': return '⚠️ Avertissement';
      case 'blame': return '📝 Blâme';
      case 'suspension': return '🔇 Suspension';
      case 'exclusion': return '❌ Exclusion';
      default: return niveau;
    }
  };

  const getNiveauIcon = (niveau: string) => {
    switch (niveau) {
      case 'avertissement': return 'alert-circle';
      case 'blame': return 'document-text';
      case 'suspension': return 'hourglass';
      case 'exclusion': return 'ban';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const markAsRead = async (sanctionId: number) => {
    try {
      await api.post(`/sanctions/${sanctionId}/read`);
      loadSanctions();
    } catch (error) {
      console.error('Erreur marquage comme lue:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des sanctions...</Text>
      </View>
    );
  }

  const filteredSanctions = getFilteredSanctions();

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes sanctions</Text>
        <Text style={styles.subtitle}>
          Historique des sanctions reçues
        </Text>
      </View>

      {/* Filtres */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {['tous', 'avertissement', 'blame', 'suspension', 'exclusion'].map((filterKey) => (
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
              {filterKey === 'tous' ? 'Tous' : getNiveauLabel(filterKey).split(' ')[1]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des sanctions */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      >
        {filteredSanctions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune sanction</Text>
            <Text style={styles.emptySubText}>
              Vous n'avez reçu aucune sanction pour le moment
            </Text>
          </View>
        ) : (
          filteredSanctions.map((sanction) => (
            <TouchableOpacity
              key={sanction.id}
              style={[
                styles.sanctionCard,
                !sanction.est_lue && styles.sanctionCardUnread
              ]}
              onPress={() => {
                setSelectedSanction(sanction);
                setModalVisible(true);
                if (!sanction.est_lue) {
                  markAsRead(sanction.id);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.niveauBadge, { backgroundColor: getNiveauColor(sanction.niveau) + '20' }]}>
                  <Ionicons name={getNiveauIcon(sanction.niveau)} size={20} color={getNiveauColor(sanction.niveau)} />
                  <Text style={[styles.niveauText, { color: getNiveauColor(sanction.niveau) }]}>
                    {getNiveauLabel(sanction.niveau)}
                  </Text>
                </View>
                {!sanction.est_lue && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>Nouveau</Text>
                  </View>
                )}
              </View>

              <Text style={styles.motifText}>{sanction.motif}</Text>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {sanction.description}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={14} color="#9CA3AF" />
                  <Text style={styles.dateText}>{formatDate(sanction.date_sanction)}</Text>
                </View>
                {sanction.coach_nom && (
                  <View style={styles.coachContainer}>
                    <Ionicons name="person" size={14} color="#9CA3AF" />
                    <Text style={styles.coachText}>Coach: {sanction.coach_nom}</Text>
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
              <Text style={styles.modalTitle}>Détails de la sanction</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSanction && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.modalNiveauBadge, { backgroundColor: getNiveauColor(selectedSanction.niveau) + '20' }]}>
                  <Ionicons name={getNiveauIcon(selectedSanction.niveau)} size={24} color={getNiveauColor(selectedSanction.niveau)} />
                  <Text style={[styles.modalNiveauText, { color: getNiveauColor(selectedSanction.niveau) }]}>
                    {getNiveauLabel(selectedSanction.niveau)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Motif</Text>
                  <Text style={styles.motifDetail}>{selectedSanction.motif}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionDetail}>{selectedSanction.description}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedSanction.date_sanction)}</Text>
                  </View>
                  {selectedSanction.coach_nom && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Coach</Text>
                      <Text style={styles.detailValue}>{selectedSanction.coach_nom}</Text>
                    </View>
                  )}
                </View>

                {selectedSanction.date_fin_suspension && (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.warningText}>
                      Suspension jusqu'au {formatDate(selectedSanction.date_fin_suspension)}
                    </Text>
                  </View>
                )}
              </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  sanctionCard: {
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
  sanctionCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  niveauBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  niveauText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  unreadBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  motifText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  coachContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachText: {
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
    maxHeight: '85%',
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
    maxHeight: '70%',
  },
  modalNiveauBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalNiveauText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  motifDetail: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  descriptionDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SanctionsScreen;