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
import { responsive } from '../utils/responsive';

const registerSchema = Yup.object().shape({
  realtorName: Yup.string()
    .required('Full name is required'),

  realtorCompany: Yup.string()
    .required('Company name is required'),

  email: Yup.string()
    .email('Enter a valid email address (e.g., name@example.com)')
    .required('Email address is required'),

  realtorPhone: Yup.string()
    .matches(
      /^(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/,
      'Phone number must match (XXX) XXX-XXXX or XXX-XXX-XXXX'
    )
    .required('Phone number is required'),

  password: Yup.string()
    .min(10, 'Password must be at least 10 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character')
    .required('Password is required'),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});


export const RegisterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await api.register(values);
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
    console.log('Register error details:', JSON.stringify(error, null, 2)); // ✅ add this line

      if (error.response) {
        console.log('Error Response:', error.response.data); // backend response
        console.log('Status:', error.response.status); // HTTP status
        console.log('Headers:', error.response.headers);
      } else if (error.request) {
        console.log('Error Request:', error.request); // network issue
      } else {
        console.log('Error Message:', error.message);
      }

      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'An unknown error occurred. Check console log for details.'
      );
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>Enter your realtor information</Text>
          </View>

          <Formik
            initialValues={{
              realtorName: '',
              realtorCompany: '',
              realtorPhone: '',
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                <CustomInput
                  label="Realtor Name"
                  placeholder="Enter your full name"
                  value={values.realtorName}
                  onChangeText={handleChange('realtorName')}
                  onBlur={handleBlur('realtorName')}
                  error={touched.realtorName && errors.realtorName}
                />

                <CustomInput
                  label="Company Name"
                  placeholder="Enter company name"
                  value={values.realtorCompany}
                  onChangeText={handleChange('realtorCompany')}
                  onBlur={handleBlur('realtorCompany')}
                  error={touched.realtorCompany && errors.realtorCompany}
                />

                <CustomInput
                    label="Phone Number"
                    placeholder="Enter phone number"
                    value={values.realtorPhone}
                    onChangeText={handleChange('realtorPhone')}
                    onBlur={handleBlur('realtorPhone')}
                    error={touched.realtorPhone && errors.realtorPhone}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.helperText}>Format: (555) 555-5555 or 555-555-5555</Text>

                <CustomInput
                  label="Email Address"
                  placeholder="Enter email address"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Password"
                  placeholder="Enter password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password}
                  secureTextEntry
                />
                <Text style={styles.helperText}>
                  Min 10 characters, must include an uppercase letter, lowercase, number, and special character.
                </Text>

                <CustomInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={touched.confirmPassword && errors.confirmPassword}
                  secureTextEntry
                />

                <CustomButton
                  title="Register"
                  onPress={handleSubmit}
                  loading={loading}
                />

                <CustomButton
                  title="Back to Login"
                  onPress={() => navigation.goBack()}
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
    paddingVertical: responsive.spacing.lg,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: responsive.maxContainerWidth,
    paddingHorizontal: responsive.spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: responsive.spacing.lg,
  },
  logo: {
    width: responsive.logo.width * 0.75,
    height: responsive.logo.height * 0.75,
    marginBottom: responsive.spacing.md,
  },
  title: {
    fontSize: responsive.fontSize.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: responsive.spacing.xs,
  },
  subtitle: {
    fontSize: responsive.fontSize.small,
    color: '#64748b',
  },
  form: {
    width: '100%',
    maxWidth: responsive.containerWidth,
  },
  helperText: {
  fontSize: 12,
  color: '#64748b',
  marginBottom: 10,
},
});
