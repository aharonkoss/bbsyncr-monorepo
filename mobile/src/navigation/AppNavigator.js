import React, { useState } from 'react';
import { View } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { ClientFormScreen } from '../screens/ClientFormScreen';
import { ClientListScreen } from '../screens/ClientListScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';

export const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigation = {
    navigate: (screen) => {
      setCurrentScreen(screen);
    },
    replace: (screen) => {
      setCurrentScreen(screen);
    },
    goBack: () => {
      setCurrentScreen('Login');
    }
  };

  const renderScreen = () => {
    switch(currentScreen) {
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'ResetPassword':
        return <ResetPasswordScreen navigation={navigation} />;
      case 'ClientForm':
        return <ClientFormScreen navigation={navigation} />;
      case 'ClientList':
        return <ClientListScreen navigation={navigation} />;
      case 'Diagnostic':
        <Stack.Screen name="Diagnostics" component={DiagnosticScreen} />
      default:
        return <LoginScreen navigation={navigation} />;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
};
