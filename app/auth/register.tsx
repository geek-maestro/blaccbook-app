import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Svg, Rect, Path, Circle } from 'react-native-svg';

const LogoSmallSvg = () => (
  <Svg width="80" height="80" viewBox="0 0 200 200">
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

const RegisterScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    // Form validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, name, phone);
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.push('/auth/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <LogoSmallSvg />
          <Text style={styles.appName}>BlaccBook</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Create Account</Text>
          <Text style={styles.subHeaderText}>Register to get started</Text>
          
          <Input
            placeholder="Full Name"
            leftIcon={{ type: 'font-awesome', name: 'user', color: '#666' }}
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
          />
          
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
            placeholder="Phone Number"
            leftIcon={{ type: 'font-awesome', name: 'phone', color: '#666' }}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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
          
          <Input
            placeholder="Confirm Password"
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#666' }}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
          />
          
          <View style={styles.buttonContainer}>
            {loading ? (
              <View style={[styles.registerButton, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLinkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginTop: 20,
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
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
    marginBottom: 10,
  },
  input: {
    paddingLeft: 10,
  },
  registerButton: {
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
    marginTop: 10,
    marginBottom: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  loginText: {
    color: '#666',
  },
  loginLinkText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;