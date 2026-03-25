import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';

const SaisieManuelleScreen: React.FC = ({ navigation }: any) => {
  const [code, setCode] = useState('');
  const [justificatif, setJustificatif] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [justificatifLoading, setJustificatifLoading] = useState(false);

  const handlePickDocument = async () => {
    setJustificatifLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setJustificatif(result.assets[0]);
        console.log('Document sélectionné:', result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    } finally {
      setJustificatifLoading(false);
    }
  };

  const handleRemoveDocument = () => {
    setJustificatif(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le code QR');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('qr_token', code.trim());
      
      if (justificatif) {
        formData.append('justificatif', {
          uri: justificatif.uri,
          type: justificatif.mimeType || 'application/octet-stream',
          name: justificatif.name || 'justificatif.jpg',
        } as any);
      }

      const response = await api.post('/pointages/scanner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const message = response.data?.message || 'Pointage enregistré avec succès';
      const type = response.data?.type || 'arrivee';

      Alert.alert(
        '✅ Succès !',
        `${message}\n\nType: ${type === 'arrivee' ? 'Arrivée' : 'Départ'}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur saisie:', error);
      
      const errorMessage = error.response?.data?.message || 'Code invalide ou expiré';
      
      Alert.alert(
        '❌ Erreur',
        errorMessage,
        [
          {
            text: 'Réessayer',
            style: 'cancel',
          },
          {
            text: 'Scanner à nouveau',
            onPress: () => navigation.navigate('ScanMain'),
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!justificatif) return 'document-outline';
    
    const name = justificatif.name?.toLowerCase() || '';
    if (name.endsWith('.pdf')) return 'document-text';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return 'image';
    return 'document-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#4b5563" />
            </TouchableOpacity>
            <Text style={styles.title}>Saisie manuelle</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Instructions */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#4f46e5" />
            <Text style={styles.infoText}>
              Si vous ne parvenez pas à scanner le QR code, vous pouvez saisir manuellement le code affiché par votre coach.
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <Text style={styles.label}>Code QR</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le code QR affiché"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.label}>Justificatif (optionnel)</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickDocument}
              disabled={justificatifLoading || loading}
            >
              {justificatifLoading ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <>
                  <Ionicons name={getFileIcon()} size={24} color="#4f46e5" />
                  <Text style={styles.uploadText}>
                    {justificatif ? justificatif.name : 'Choisir un fichier (PDF, image)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {justificatif && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveDocument}
                disabled={loading}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.removeText}>Supprimer le justificatif</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Valider le pointage</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Aide */}
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Où trouver le code QR ?</Text>
            <View style={styles.helpItem}>
              <Ionicons name="laptop-outline" size={16} color="#6b7280" />
              <Text style={styles.helpText}>
                Sur l'ordinateur de votre coach, dans l'espace "Mes Stagiaires"
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="phone-portrait-outline" size={16} color="#6b7280" />
              <Text style={styles.helpText}>
                Le code est également disponible dans le tableau de bord du coach
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.helpText}>
                Le code change chaque jour à minuit
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4f46e5',
    marginLeft: 12,
    lineHeight: 20,
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    marginLeft: 8,
    color: '#4f46e5',
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  removeText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 6,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpBox: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
});

export default SaisieManuelleScreen;