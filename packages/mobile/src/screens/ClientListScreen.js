import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { api } from '../api/client';
import { storage } from '../utils/storage';

export const ClientListScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.getClients();
      console.log('✅ Clients fetched:', response.data);
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('❌ Error fetching clients:', error.message);
      Alert.alert('Error', 'Failed to load clients. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await storage.clearAll();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const RenderClient = ({ item }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientDetail}>Document: {item.document_type}</Text>
        <Text style={styles.clientName}>{item.customer_name}</Text>
        <Text style={styles.clientDetail}>{item.email}</Text>
        <Text style={styles.clientDetail}>{item.phone}</Text>
        <Text style={styles.clientDetail}>{item.address}</Text>
      </View>

      {item.signature_image ? (
        <>
          <Text style={styles.clientDetail}>Signature:</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedSignature(item.signature_image);
              setModalVisible(true);
            }}
          >
            <Image
              source={{ uri: item.signature_image }}
              style={styles.signatureThumb}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.noSignatureText}>No signature captured</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('ClientForm')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Client List</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Client List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <RenderClient item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchClients();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No clients found</Text>
            </View>
          )
        }
      />

      {/* Signature Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {selectedSignature ? (
              <Image
                source={{ uri: selectedSignature }}
                style={styles.fullSignature}
                resizeMode="contain"
              />
            ) : (
              <Text>No signature found</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    backgroundColor: '#0EA5E9',
    paddingTop: 50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  backButton: { 
    color: '#fff', 
    fontSize: 16 
  },
  logoutButton: { 
    color: '#fff', 
    fontSize: 16 
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clientInfo: {
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  noSignatureText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  signatureThumb: {
    width: 100,
    height: 60,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '90%',
  },
  fullSignature: {
    width: '100%',
    height: 300,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#0EA5E9',
    borderRadius: 6,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
