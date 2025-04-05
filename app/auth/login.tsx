import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Svg, Rect, Path, Circle } from 'react-native-svg';

const LogoSmallSvg = () => (
  <Svg width="100" height="100" viewBox="0 0 200 200">
    <Rect width="200" height="200" rx="40" fill="black"/>
    <Path d="M45 55H70C76.0751 55 81 59.9249 81 66V94C81 100.075 76.0751 105 70 105H45C38.9249 105 34 100.075 34 94V66C34 59.9249 38.9249 55 45 55Z" fill="white"/>
    <Path d="M45 125H70C76.0751 125 81 129.925 81 136V164C81 170.075 76.0751 175 70 175H45C38.9249 175 34 170.075 34 164V136C34 129.925 38.9249 125 45 125Z" fill="white"/>
    <Path d="M130 55H155C161.075 55 166 59.9249 166 66V94C166 100.075 161.075 105 155 105H130C123.925 105 119 100.075 119 94V66C119 59.9249 123.925 55 130 55Z" fill="white"/>
    <Path d="M130 125H155C161.075 125 166 129.925 166 136V164C166 170.075 161.075 175 155 175H130C123.925 175 119 170.075 119 164V136C119 129.925 123.925 125 130 125Z" fill="white"/>
    <Path d="M76 57L124 57" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M76 143L124 143" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <Circle cx="100" cy="100" r="8" fill="white"/>
  </Svg>
);

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Router will automatically redirect to home page via useEffect in index.tsx
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen or show modal
    Alert.alert('Reset Password', 'Please enter your email', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        onPress: (email) => {
          // Implement password reset
          Alert.alert('Password Reset', 'If your email exists in our system, you will receive reset instructions shortly.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <LogoSmallSvg />
        <Text style={styles.appName}>BlaccBook</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.headerText}>Welcome Back</Text>
        <Text style={styles.subHeaderText}>Login to continue</Text>
        
        <Input
          placeholder="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#666' }}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
        />
        
        <Input
          placeholder="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock', color: '#666' }}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
        />
        
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonContainer}>
          {loading ? (
            <View style={[styles.loginButton, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color="white" />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLinkText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },
  formContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    paddingLeft: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
  },
  registerLinkText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default LoginScreen;