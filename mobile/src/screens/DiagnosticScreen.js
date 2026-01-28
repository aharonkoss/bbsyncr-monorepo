import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

export const DiagnosticScreen = ({ navigation }) => {
  const [diagnostics, setDiagnostics] = useState({});
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const tokenValue = await storage.getToken();
      const refreshValue = await storage.getRefreshToken();
      const userValue = await storage.getUser();

      const diagInfo = {
        ExpoVersion: Constants.expoVersion,
        AppOwnership: Constants.appOwnership,
        Platform: Platform.OS,
        Standalone: Constants.appOwnership === 'standalone',
        ExpoGo: Constants.appOwnership === 'expo',
        Web: Platform.OS === 'web',
        DevMode: __DEV__,
        ReleaseChannel: Constants.manifest?.releaseChannel || 'development',
        HostUri: Constants.manifest?.hostUri || 'N/A',
      };

      setDiagnostics(diagInfo);
      setToken(tokenValue || 'N/A');
      setRefreshToken(refreshValue || 'N/A');
      setUserData(userValue || 'N/A');
    };

    loadData();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🧩 BBSYN App Diagnostic Screen</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Info</Text>
        {Object.entries(diagnostics).map(([key, value]) => (
          <Text key={key} style={styles.text}>
            {key}: {String(value)}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored Data</Text>
        <Text style={styles.text}>Access Token: {token}</Text>
        <Text style={styles.text}>Refresh Token: {refreshToken}</Text>
        <Text style={styles.text}>User Data: {JSON.stringify(userData, null, 2)}</Text>
      </View>

      <Button title="Clear All Data" color="#ef4444" onPress={() => storage.clearAll()} />

      <View style={{ height: 40 }} />
      <Button title="Back to App" color="#0EA5E9" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0EA5E9',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  text: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
});
