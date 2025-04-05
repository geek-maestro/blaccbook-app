import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-elements';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Path, Circle } from 'react-native-svg';

const LogoSvg = () => (
  <Svg width="200" height="200" viewBox="0 0 200 200">
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

export default function SplashScreen() {
  const router = useRouter();
  const { currentUser, initializing } = useAuth();

  useEffect(() => {
    // Wait for 2 seconds to show splash screen
    const timer = setTimeout(() => {
      if (!initializing) {
        if (currentUser) {
          router.replace('/main/home');
        } else {
          router.replace('/auth/login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser, initializing, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <LogoSvg />
        </View>
        <Text style={styles.appName}>BlaccBook</Text>
        <Text style={styles.tagline}>Find and book services easily</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
});