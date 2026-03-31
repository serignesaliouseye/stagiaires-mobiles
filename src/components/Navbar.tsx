import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { clearStorage, getUser } from '../utils/storage';
import api from '../services/api';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  title = 'Coach Dashboard', 
  showBackButton = false,
  onBackPress 
}) => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      await clearStorage();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      await clearStorage();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    }
  };

  const getPhotoUrl = () => {
    if (!user?.photo || imageError) return null;
    
    if (user.photo.startsWith('http')) {
      return user.photo;
    }
    if (user.photo.startsWith('data:')) {
      return user.photo;
    }
    if (!user.photo.includes('/')) {
      return `http://192.168.1.12:8000/storage/photos/${user.photo}`;
    }
    if (user.photo.startsWith('photos/')) {
      return `http://192.168.1.12:8000/storage/${user.photo}`;
    }
    return `http://192.168.1.12:8000/storage/${user.photo}`;
  };

  const getInitials = () => {
    if (!user) return 'U';
    const prenom = user.prenom || '';
    const nom = user.nom || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const photoUrl = getPhotoUrl();
  const showImage = photoUrl && !imageError;

  // Composant Modal Profil
  const ProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showProfileModal}
      onRequestClose={() => setShowProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mon Profil</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photo et nom */}
            <View style={styles.profileHeader}>
              {showImage ? (
                <Image
                  style={styles.profileImageLarge}
                  source={{ uri: photoUrl }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.profileInitialsLarge}>
                  <Text style={styles.initialsTextLarge}>{getInitials()}</Text>
                </View>
              )}
              <Text style={styles.profileNameLarge}>
                {user?.prenom} {user?.nom}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.role === 'stagiaire' ? 'Stagiaire' : user?.role}
                </Text>
              </View>
            </View>

            {/* Informations */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              {user?.telephone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{user?.telephone}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Promotion</Text>
                <Text style={styles.infoValue}>{user?.promotion || 'Non défini'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Statut</Text>
                <View style={[
                  styles.statusBadge,
                  user?.est_actif ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    user?.est_actif ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {user?.est_actif ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                setShowProfileModal(false);
                setShowLogoutModal(true);
              }}
            >
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Composant Modal Déconnexion
  const LogoutModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLogoutModal}
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          {/* Header */}
          <View style={styles.confirmModalHeader}>
            <Text style={styles.confirmModalTitle}>Déconnexion</Text>
            <TouchableOpacity onPress={() => setShowLogoutModal(false)}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.confirmModalBody}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="log-out-outline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.confirmModalText}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.confirmModalFooter}>
            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.confirmCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmLogoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.confirmLogoutText}>Déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Partie gauche */}
          <View style={styles.leftSection}>
            {showBackButton ? (
              <TouchableOpacity 
                onPress={onBackPress || (() => navigation.goBack())}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
            ) : (
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoText}>P</Text>
                </View>
                <Text style={styles.logoTitle}>{title}</Text>
              </View>
            )}
          </View>

          {/* Partie droite - Profil utilisateur cliquable */}
          <TouchableOpacity 
            style={styles.rightSection}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.7}
          >
            {/* Notifications */}
            <View style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
              <View style={styles.notificationBadge} />
            </View>

            {/* Profil */}
            <View style={styles.profileContainer}>
              {showImage ? (
                <Image 
                  source={{ uri: photoUrl }} 
                  style={styles.profileImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.profileInitials}>
                  <Text style={styles.initialsText}>{getInitials()}</Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.prenom} {user?.nom}
                </Text>
                <View style={styles.logoutBadge}>
                  <Text style={styles.logoutText}>Déconnexion</Text>
                  <Ionicons name="log-out-outline" size={14} color="#EF4444" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <ProfileModal />
      <LogoutModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  logoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  logoutText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#EFF6FF',
  },
  profileInitialsLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#EFF6FF',
  },
  initialsTextLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4f46e5',
    textTransform: 'capitalize',
  },
  infoSection: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Modal confirmation
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    overflow: 'hidden',
  },
  confirmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  confirmModalBody: {
    alignItems: 'center',
    padding: 24,
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  confirmLogoutButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmLogoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default Navbar;