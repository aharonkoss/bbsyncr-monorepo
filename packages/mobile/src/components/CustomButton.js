import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { responsive } from '../utils/responsive';

export const CustomButton = ({ title, onPress, loading, variant = 'primary', ...props }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        props.disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0EA5E9',
    paddingVertical: responsive.spacing.md,
    borderRadius: responsive.borderRadius,
    alignItems: 'center',
    marginVertical: responsive.spacing.sm,
    height: responsive.buttonHeight,
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: '#fff',
    fontSize: responsive.fontSize.regular,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#0EA5E9',
  },
});
