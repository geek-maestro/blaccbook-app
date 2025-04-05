import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/config';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!name) newErrors.name = 'Name is required';
    
    if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        name,
        phone: phoneNumber,
        email,
        createdAt: new Date().toISOString(),
        userType: 'customer' // Default role
      });
      
      Alert.alert('Success', 'Your account has been created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
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
            <Text h3 style={styles.headerText}>Create Account</Text>
            <Text style={styles.subHeaderText}>Sign up to get started</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Input
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              leftIcon={<Icon name="user" size={20} color="#888" />}
              containerStyle={styles.inputContainer}
              errorMessage={errors.name}
              disabled={loading}
            />
            
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
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon={<Icon name="envelope" size={20} color="#888" />}
              containerStyle={styles.inputContainer}
              errorMessage={errors.email}
              disabled={loading}
              autoCapitalize="none"
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
            
            <Input
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Icon name="lock" size={20} color="#888" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={20} color="#888" />
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
              errorMessage={errors.confirmPassword}
              disabled={loading}
            />
            
            <Button
              title="Register"
              onPress={handleRegister}
              buttonStyle={styles.registerButton}
              titleStyle={styles.registerButtonText}
              disabled={loading}
              loading={loading}
              loadingProps={{ color: '#fff' }}
            />
          </View>
          
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Login</Text>
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
    marginBottom: 30,
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  registerButtonText: {
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
  loginText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
