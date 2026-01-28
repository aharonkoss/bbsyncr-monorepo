import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import SignatureCanvas from 'react-native-signature-canvas';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { api } from '../api/client';
import { storage } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// ✅ NO signature_image validation - checkbox handles it
const clientSchema = Yup.object().shape({
  document_type: Yup.string().oneOf([
  'Buyer Broker Agreement',
  'Exclusive Buyer Broker Agreement',
], 'Please select a document type').required('Document type is required'),
  customerName: Yup.string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .required('Customer name is required'),
  address: Yup.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .required('Address is required'),
  phone: Yup.string()
    .matches(
      /^(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/,
      'Phone must be in format (XXX) XXX-XXXX or XXX-XXX-XXXX'
    )
    .required('Phone number is required'),
  email: Yup.string()
    .email('Invalid email address format')
    .required('Email address is required'),
});

export const ClientFormScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const signatureRef = useRef();

  const handleSubmit = async (values, { resetForm }) => {
    console.log('🚀 SUBMIT BUTTON PRESSED');
    console.log('📋 Form values:', values);
    
    if (!signatureConfirmed) {
      Alert.alert('Signature Required', 'Please check "I am done signing" to confirm your signature.');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Calling API...');
      const res = await api.createClient(values);
      console.log('✅ API Success:', res);

      Alert.alert('✅ Success', 'Client created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            setSignatureConfirmed(false);
            setHasDrawnSignature(false);
            signatureRef.current?.clearSignature();
            navigation.navigate('ClientList');
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error saving client:', error);
      console.error('❌ Error details:', error.response?.data);
      Alert.alert(
        '❌ Error',
        error.response?.data?.error || error.message || 'Failed to save client'
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
        </View>
        <View style={styles.topBarButtons}>
          <TouchableOpacity
            style={styles.listButton}
            onPress={() => navigation.navigate('ClientList')}
          >
            <Text style={styles.listButtonText}>View Clients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Client Information Form</Text>

        <Formik
          initialValues={{
            customerName: '',
            address: '',
            phone: '',
            email: '',
            signature_image: '',
            document_type: '',
          }}
          validationSchema={clientSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
            isValid,
            dirty,
          }) => {
            // Submit enabled when: all fields valid + checkbox checked
            const canSubmit = isValid && dirty && signatureConfirmed;

            console.log('🔍 Form validation state:', {
              isValid,
              dirty,
              signatureConfirmed,
              hasSignature: !!values.signature_image,
              errors,
            });

            return (
              <View style={styles.form}>
                {/* Document Type */}
                <Picker
                  selectedValue={values.document_type}
                  onValueChange={value => setFieldValue('document_type', value)}
                >
                  <Picker.Item label="Select Document Type" value="" />
                  <Picker.Item label="Buyer Broker Agreement" value="Buyer Broker Agreement" />
                  <Picker.Item label="Exclusive Buyer Broker Agreement" value="Exclusive Buyer Broker Agreement" />
                </Picker>
                {touched.document_type && errors.document_type && (
                  <Text>{errors.document_type}</Text>
                )}
                {/* Customer Name */}
                <CustomInput
                  label="Customer Name"
                  placeholder="Enter customer full name"
                  value={values.customerName}
                  onChangeText={handleChange('customerName')}
                  onBlur={handleBlur('customerName')}
                  error={touched.customerName && errors.customerName}
                  required
                />
                {/* Address */}
                <CustomInput
                  label="Address"
                  placeholder="Enter customer address"
                  value={values.address}
                  onChangeText={handleChange('address')}
                  onBlur={handleBlur('address')}
                  error={touched.address && errors.address}
                  multiline
                  numberOfLines={2}
                  required
                />

                {/* Phone */}
                <CustomInput
                  label="Phone Number"
                  placeholder="(XXX) XXX-XXXX"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  error={touched.phone && errors.phone}
                  keyboardType="phone-pad"
                  required
                />

                {/* Email */}
                <CustomInput
                  label="Email Address"
                  placeholder="customer@example.com"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                  <Text style={styles.signatureLabel}>Client Signature *</Text>
                  <Text style={styles.signatureHelper}>
                    Draw your signature below with your finger
                  </Text>

                  <View style={styles.signatureCanvasContainer}>
                    <SignatureCanvas
                      ref={signatureRef}
                      onOK={(signature) => {
                        console.log('✍️ Signature auto-captured');
                        setFieldValue('signature_image', signature);
                        setHasDrawnSignature(true);
                      }}
                      onBegin={() => {
                        console.log('🖊️ User started signing');
                        setScrollEnabled(false);
                        if (signatureConfirmed) {
                          setSignatureConfirmed(false);
                        }
                      }}
                      onEnd={() => {
                        console.log('🖊️ User stopped signing');
                        setScrollEnabled(true);
                        // Auto-capture after drawing
                        setTimeout(() => {
                          signatureRef.current?.readSignature();
                        }, 300);
                      }}
                      onClear={() => {
                        console.log('🗑️ Signature cleared');
                        setFieldValue('signature_image', '');
                        setSignatureConfirmed(false);
                        setHasDrawnSignature(false);
                      }}
                      autoClear={false}
                      descriptionText=""
                      webStyle={`
                        html, body { 
                          height: 100%; 
                          margin: 0; 
                          touch-action: none; 
                        }
                        .m-signature-pad { 
                          height: 200px; 
                          border: none;
                        }
                        .m-signature-pad--body {
                          border: 2px solid #ddd;
                          border-radius: 8px;
                        }
                        .m-signature-pad--footer {
                          display: none;
                        }
                      `}
                    />
                  </View>

                  {/* Clear Button */}
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      signatureRef.current?.clearSignature();
                      setFieldValue('signature_image', '');
                      setSignatureConfirmed(false);
                      setHasDrawnSignature(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.clearButtonText}>Clear Signature</Text>
                  </TouchableOpacity>

                  {/* ✅ Checkbox: I am done signing */}
                  {hasDrawnSignature && values.signature_image && (
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => {
                        setSignatureConfirmed(!signatureConfirmed);
                        console.log('✓ Signature confirmation toggled:', !signatureConfirmed);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          signatureConfirmed && styles.checkboxChecked,
                        ]}
                      >
                        {signatureConfirmed && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>I am done signing</Text>
                    </TouchableOpacity>
                  )}

                  {!signatureConfirmed && hasDrawnSignature && (
                    <Text style={styles.helperTextSignature}>
                      Please check the box above to confirm your signature
                    </Text>
                  )}
                </View>

                {/* Submit Button */}
                <View style={styles.submitButtonContainer}>
                  <CustomButton
                    title={loading ? 'Saving...' : 'Submit Client Information'}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!canSubmit || loading}
                  />
                </View>

                {/* Debug Info */}
                {__DEV__ && (
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                      Debug: isValid={isValid.toString()}, confirmed=
                      {signatureConfirmed.toString()}, canSubmit={canSubmit.toString()}
                    </Text>
                    {Object.keys(errors).length > 0 && (
                      <Text style={styles.debugText}>
                        Errors: {JSON.stringify(errors, null, 2)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        </Formik>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    backgroundColor: '#0EA5E9',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoSmall: { width: 100, height: 40 },
  topBarButtons: { flexDirection: 'row', gap: 10 },
  listButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  listButtonText: {
    color: '#0EA5E9',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  scrollContent: {
    padding: 20,
    paddingBottom: 150,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  form: { width: '100%' },
  signatureSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  signatureHelper: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  signatureCanvasContainer: {
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  helperTextSignature: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButtonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  debugText: {
    fontSize: 11,
    color: '#856404',
    fontFamily: 'monospace',
  },
});
