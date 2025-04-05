import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { clearAllNotifications } from '../utils/notificationManager';
import { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const auth = getAuth();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Create user profile if it doesn't exist
            const newUserProfile: UserProfile = {
              userId: user.uid,
              name: user.displayName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              userType: 'customer'
            };
            
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
          
          // Update last login time
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp()
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(userCredential.user, {
        displayName
      });
      
      // Create user profile in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        userId: userCredential.user.uid,
        name: displayName,
        email,
        phone,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        userType: 'customer'
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      // Clear notifications when logging out
      await clearAllNotifications();
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently logged in');
      }
      
      // Update Firestore user profile
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Update auth profile if display name is provided
      if (data.name) {
        await updateProfile(user, {
          displayName: data.name
        });
      }
      
      // Update email if provided (requires recent login)
      if (data.email && data.email !== user.email) {
        await updateEmail(user, data.email);
      }
      
      // Refresh user profile
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        const userData = updatedUserDoc.data() as UserProfile;
        setUserProfile(userData);
        return userData;
      }
      
      throw new Error('Failed to retrieve updated user profile');
    } catch (error) {
      throw error;
    }
  };

  // Update password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently logged in');
      }
      
      // Re-authenticate user (required for security-sensitive operations)
      await signInWithEmailAndPassword(auth, user.email || '', currentPassword);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    initializing,
    signUp,
    login,
    logout,
    updateUserProfile,
    changePassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};