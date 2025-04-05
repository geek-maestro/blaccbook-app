import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Input, Button, Avatar, Divider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileScreen = () => {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [currentUser]);

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile(userData);
        setName(userData.name || '');
        setPhoneNumber(userData.phone || '');
        setProfileImage(userData.profileImage || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        name,
        phone: phoneNumber,
        // Only update the image if it's changed
        ...(profileImage !== profile.profileImage && { profileImage }),
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to change your profile image');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const storageRef = ref(storage, `profiles/${currentUser.uid}-${Date.now()}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      setProfileImage(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = () => {
    // Navigate to change password screen
    Alert.alert('Coming Soon', 'This feature will be available soon!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by the auth context
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text h3 style={styles.title}>My Profile</Text>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="edit" size={20} color="#000" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileImageContainer}>
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <TouchableOpacity 
              disabled={!isEditing} 
              onPress={handlePickImage}
              style={[styles.avatarContainer, isEditing && styles.avatarEditMode]}
            >
              <Avatar
                size={120}
                rounded
                source={profileImage ? { uri: profileImage } : require('../../assets/default-avatar.svg')}
                containerStyle={styles.avatar}
              />
              {isEditing && (
                <View style={styles.editIconContainer}>
                  <Icon name="camera" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.nameText}>{profile?.name}</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            disabled={!isEditing || updatingProfile}
            leftIcon={<Icon name="user" size={20} color="#888" />}
            containerStyle={styles.inputContainer}
          />
          
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            disabled={!isEditing || updatingProfile}
            leftIcon={<Icon name="phone" size={20} color="#888" />}
            containerStyle={styles.inputContainer}
          />
          
          <Input
            label="Email"
            value={currentUser?.email}
            disabled={true}
            leftIcon={<Icon name="envelope" size={20} color="#888" />}
            containerStyle={styles.inputContainer}
          />

          {isEditing ? (
            <View style={styles.actionButtonsContainer}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsEditing(false);
                  setName(profile?.name || '');
                  setPhoneNumber(profile?.phone || '');
                  setProfileImage(profile?.profileImage || null);
                }}
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelButtonText}
                containerStyle={styles.actionButtonContainer}
                disabled={updatingProfile}
              />
              <Button
                title="Save Changes"
                onPress={handleUpdateProfile}
                buttonStyle={styles.saveButton}
                titleStyle={styles.saveButtonText}
                containerStyle={styles.actionButtonContainer}
                loading={updatingProfile}
                disabled={updatingProfile}
              />
            </View>
          ) : (
            <>
              <Button
                title="Change Password"
                onPress={handleChangePassword}
                buttonStyle={styles.passwordButton}
                titleStyle={styles.passwordButtonText}
                icon={<Icon name="lock" size={16} color="#000" style={{ marginRight: 10 }} />}
              />
              
              <Divider style={styles.divider} />
              
              <Button
                title="Logout"
                onPress={handleLogout}
                buttonStyle={styles.logoutButton}
                titleStyle={styles.logoutButtonText}
                icon={<Icon name="sign-out" size={16} color="#fff" style={{ marginRight: 10 }} />}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarEditMode: {
    opacity: 0.8,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  passwordButtonText: {
    color: '#000',
    fontSize: 16,
  },
  divider: {
    marginVertical: 25,
    backgroundColor: '#e0e0e0',
    height: 1,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 15,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
