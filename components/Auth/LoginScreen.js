import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // In a real app, you would format the phone number correctly for Firebase auth
      // Firebase phone auth usually requires a country code
      const formattedPhone = `+1${phoneNumber}`; // Example for US numbers
      
      // Note: Firebase doesn't directly support phone+password login
      // This would need to use a custom authentication approach
      await login(formattedPhone, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text h3 style={styles.headerText}>Welcome Back</Text>
            <Text style={styles.subHeaderText}>Login to your account</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Input
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              leftIcon={<Icon name="phone" size={20} color="#888" />}
              containerStyle={styles.inputContainer}
              errorMessage={errors.phoneNumber}
              disabled={loading}
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Icon name="lock" size={20} color="#888" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#888" />
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
              errorMessage={errors.password}
              disabled={loading}
            />
            
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <Button
              title="Login"
              onPress={handleLogin}
              buttonStyle={styles.loginButton}
              titleStyle={styles.loginButtonText}
              disabled={loading}
              loading={loading}
              loadingProps={{ color: '#fff' }}
            />
          </View>
          
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signupText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
