import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { api } from '../api/client';
import { responsive } from '../utils/responsive';

const resetPasswordSchema = Yup.object().shape({
  token: Yup.string().required('Reset token is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const ResetPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      await api.resetPassword({
        token: values.token,
        newPassword: values.newPassword,
      });
      Alert.alert('Success', 'Password reset successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to reset password');
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the token from your email and your new password
          </Text>
        </View>

        <Formik
          initialValues={{ token: '', newPassword: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleResetPassword}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <CustomInput
                label="Reset Token"
                placeholder="Enter reset token from email"
                value={values.token}
                onChangeText={handleChange('token')}
                onBlur={handleBlur('token')}
                error={touched.token && errors.token}
                autoCapitalize="none"
              />

              <CustomInput
                label="New Password"
                placeholder="Enter new password"
                value={values.newPassword}
                onChangeText={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                error={touched.newPassword && errors.newPassword}
                secureTextEntry
              />

              <CustomInput
                label="Confirm Password"
                placeholder="Confirm new password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={touched.confirmPassword && errors.confirmPassword}
                secureTextEntry
              />

              <CustomButton
                title="Reset Password"
                onPress={handleSubmit}
                loading={loading}
              />

              <CustomButton
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
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
    paddingHorizontal: responsive.spacing.md,
  },
  form: {
    width: '100%',
    maxWidth: responsive.containerWidth,
  },
});
