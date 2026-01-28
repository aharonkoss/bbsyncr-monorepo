import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { api } from '../api/client';
import { storage } from '../utils/storage';
import { responsive, isDesktop } from '../utils/responsive';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

const handleLogin = async (values, { setSubmitting }) => {
  try {
    const response = await api.login(values);
    const { token, refreshToken, user } = response.data;

    await storage.saveToken(token);
    await storage.saveRefreshToken(refreshToken);
    await storage.saveUser(user); // ✅ Save user object (includes ID)

    console.log('✅ User logged in:', user);
    navigation.replace('ClientForm');
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('Login Failed', error.response?.data?.error || 'An error occurred');
  } finally {
    setSubmitting(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Real Estate Document Management</Text>
          </View>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                <CustomInput
                  label="Email"
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password}
                  secureTextEntry
                />

                <CustomButton
                  title="Login"
                  onPress={handleSubmit}
                  loading={loading}
                />

                <CustomButton
                  title="Create New Profile"
                  onPress={() => navigation.navigate('Register')}
                  variant="secondary"
                />

                <CustomButton
                  title="Forgot Password?"
                  onPress={() => navigation.navigate('ForgotPassword')}
                  variant="secondary"
                />
                <CustomButton
                    title="Debug Mode"
                    onPress={() => navigation.navigate('Diagnostics')}
                    variant="secondary"
                  />
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsive.spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: responsive.maxContainerWidth,
    paddingHorizontal: responsive.spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.spacing.xl,
  },
  logo: {
    width: responsive.logo.width,
    height: responsive.logo.height,
    marginBottom: responsive.spacing.lg,
  },
  subtitle: {
    fontSize: responsive.fontSize.small,
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
    maxWidth: responsive.containerWidth,
  },
});
