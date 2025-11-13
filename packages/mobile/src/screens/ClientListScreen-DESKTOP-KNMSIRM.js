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
  ActivityIndicator,
} from 'react-native';
import { baseUrl, api } from '../api/client';
import { storage } from '../utils/storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { encode } from 'base64-arraybuffer';
export const ClientListScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
  const handleSignaturePress = async (clientId) => {
    try {
    const API_BASE_URL = baseUrl;
    console.log(`⬇️ Base Url for API: ${API_BASE_URL}`);
      setPdfLoading(true);
      const pdfUrl = `${API_BASE_URL}/clients/${clientId}/pdf`;
      console.log('Trying to download PDF from:', pdfUrl);

      // Get the token
      const token = await storage.getToken();
      if (!token) throw new Error('No bearer token found');

      // Fetch the PDF
      const response = await fetch(pdfUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      console.log('Response status:', response.status);
      if (!response.ok) throw new Error('PDF download failed (bad response)');

      // Convert to base64
      const arrayBuffer = await response.arrayBuffer();
      console.log('ArrayBuffer size (bytes):', arrayBuffer.byteLength);

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Downloaded PDF is empty');
      }

      const base64 = encode(arrayBuffer);
      console.log('Base64 string length:', base64.length);

      // Save the file
      const localUri = FileSystem.cacheDirectory + `client_${clientId}_agreement.pdf`;
      await FileSystem.writeAsStringAsync(localUri, base64, { encoding: 'base64' });
      console.log('PDF saved successfully to:', localUri);

      // Share/Open the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert('Success', 'PDF downloaded but sharing is not available on this device');
      }

    } catch (error) {
      console.log('PDF download error:', error);
      Alert.alert('Error', 'Failed to load PDF');
    } finally {
      setPdfLoading(false);
    }
  };



  const RenderClient = ({ item }) => (
   <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => handleSignaturePress(item.id)}
            activeOpacity={0.7}
   >
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
      <Text>Signature:</Text>
        <Image
          source={{ uri: item.signature_image }}
          style={styles.signatureThumb}
          resizeMode="contain"
        />
    </>
  ) : (
    <Text style={styles.noSignatureText}>No signature captured</Text>
  )}
    </View>
</TouchableOpacity>
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
      {/* PDF Modal */}
      <Modal
  visible={pdfModalVisible}
  animationType="slide"
  onRequestClose={() => setPdfModalVisible(false)}
>
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Pressable onPress={() => setPdfModalVisible(false)}>
        <Text style={{ fontSize: 16, color: '#007AFF' }}>Close</Text>
      </Pressable>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Agreement PDF</Text>
      <View style={{ width: 50 }} />
    </View>
    
    {pdfLoading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    ) : (
      <WebView
        source={{ uri: pdfUri }}
        originWhitelist={['*']}
        allowFileAccess={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
          Alert.alert('Error', 'Failed to load PDF in viewer');
        }}
      />
    )}
  </View>
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
    pdfActionButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 6,
    padding: 12,
    margin: 4,
  },
  pdfActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
