import React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { responsive } from '../utils/responsive';

export const CustomInput = ({ label, error, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: responsive.spacing.md,
  },
  label: {
    fontSize: responsive.fontSize.regular,
    fontWeight: '600',
    marginBottom: responsive.spacing.xs,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: responsive.borderRadius,
    padding: responsive.spacing.md,
    fontSize: responsive.fontSize.regular,
    backgroundColor: '#fff',
    height: responsive.inputHeight,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: responsive.fontSize.small,
    marginTop: responsive.spacing.xs,
  },
});
