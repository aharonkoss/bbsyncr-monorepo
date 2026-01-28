import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { api } from '../api/client';
import { responsive } from '../utils/responsive';

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

export const ForgotPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (values) => {
    setLoading(true);
    try {
      await api.forgotPassword(values);
      Alert.alert(
        'Email Sent',
        'If an account exists with this email, you will receive a password reset token.',
        [{ text: 'OK', onPress: () => navigation.navigate('ResetPassword') }]
      );
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a reset token
          </Text>
        </View>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleForgotPassword}
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

              <CustomButton
                title="Send Reset Token"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    width: responsive.logo.width * 0.75,
    height: responsive.logo.height * 0.75,
    marginBottom: responsive.spacing.md,
  },
  title: {
    fontSize: responsive.fontSize.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: responsive.spacing.sm,
  },
  subtitle: {
    fontSize: responsive.fontSize.small,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: responsive.containerWidth,
  },
});
