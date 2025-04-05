import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Modal,
  Image
} from 'react-native';
import { Text, Avatar, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessage from './ChatMessage';
import * as ImagePicker from 'expo-image-picker';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../firebase/config';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    conversationId, 
    recipientId, 
    recipientName, 
    recipientImage 
  } = route.params || {};
  
  const { currentUser } = useAuth();
  const flatListRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatId, setChatId] = useState(conversationId || null);
  const [recipient, setRecipient] = useState({
    id: recipientId,
    name: recipientName || 'User',
    image: recipientImage || null
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // Get or create conversation
  useEffect(() => {
    const getOrCreateConversation = async () => {
      try {
        // If we already have the conversation ID
        if (chatId) {
          return chatId;
        }
        
        // Check if a conversation already exists between these users
        const conversationsQuery = query(
          collection(firestore, 'conversations'),
          where('participants', 'array-contains', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(conversationsQuery);
        
        // Find conversations that contain both users
        let existingConversationId = null;
        querySnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          if (data.participants.includes(recipientId)) {
            existingConversationId = docSnapshot.id;
          }
        });
        
        if (existingConversationId) {
          setChatId(existingConversationId);
          return existingConversationId;
        }
        
        // Create a new conversation if one doesn't exist
        const newConversationRef = doc(collection(firestore, 'conversations'));
        await setDoc(newConversationRef, {
          participants: [currentUser.uid, recipientId],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [recipientId]: 0
          }
        });
        
        setChatId(newConversationRef.id);
        return newConversationRef.id;
      } catch (error) {
        console.error('Error getting/creating conversation:', error);
        Alert.alert('Error', 'Failed to initialize chat');
      }
    };
    
    if (currentUser && recipientId) {
      getOrCreateConversation();
    }
  }, [currentUser, recipientId, chatId]);
  
  // Load messages
  useEffect(() => {
    if (!chatId) return;
    
    const messagesQuery = query(
      collection(firestore, `conversations/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(messagesData);
      setLoading(false);
      
      // Mark messages as read
      markMessagesAsRead();
    }, (error) => {
      console.error('Error in messages listener:', error);
      Alert.alert('Error', 'Failed to load messages');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [chatId]);
  
  // Mark messages as read when the chat is opened
  const markMessagesAsRead = async () => {
    if (!chatId || !currentUser) return;
    
    try {
      const conversationRef = doc(firestore, 'conversations', chatId);
      
      await updateDoc(conversationRef, {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  // Send text message
  const sendMessage = async () => {
    if (!messageText.trim() || !chatId) return;
    
    try {
      setSending(true);
      
      // Add message to the conversation
      const messageData = {
        senderId: currentUser.uid,
        content: messageText.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
        read: false
      };
      
      await addDoc(collection(firestore, `conversations/${chatId}/messages`), messageData);
      
      // Update conversation with last message info
      const conversationRef = doc(firestore, 'conversations', chatId);
      await updateDoc(conversationRef, {
        lastMessage: messageText.trim(),
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1)
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  // Handle image picking
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to send images');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      sendImageMessage(result.assets[0].uri);
    }
  };
  
  // Send image message
  const sendImageMessage = async (imageUri) => {
    if (!chatId) return;
    
    try {
      setImageUploading(true);
      
      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add message to the conversation
      const messageData = {
        senderId: currentUser.uid,
        content: downloadURL,
        type: 'image',
        timestamp: serverTimestamp(),
        read: false
      };
      
      await addDoc(collection(firestore, `conversations/${chatId}/messages`), messageData);
      
      // Update conversation with last message info
      const conversationRef = doc(firestore, 'conversations', chatId);
      await updateDoc(conversationRef, {
        lastMessage: '📷 Image',
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1)
      });
    } catch (error) {
      console.error('Error sending image message:', error);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setImageUploading(false);
    }
  };
  
  // Handle image preview
  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };
  
  // Clear chat confirmation
  const confirmClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChat }
      ]
    );
  };
  
  // Clear chat functionality
  const clearChat = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      
      // Get all messages
      const messagesQuery = query(
        collection(firestore, `conversations/${chatId}/messages`)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      // Delete each message
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Update conversation
      const conversationRef = doc(firestore, 'conversations', chatId);
      await updateDoc(conversationRef, {
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${currentUser.uid}`]: 0,
        [`unreadCount.${recipientId}`]: 0
      });
      
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
      Alert.alert('Error', 'Failed to clear chat');
    } finally {
      setLoading(false);
    }
  };
  
  // Call the recipient
  const callRecipient = () => {
    navigation.navigate('Call', {
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientImage: recipient.image,
      isOutgoing: true
    });
  };
  
  // Render a message
  const renderMessage = ({ item }) => (
    <ChatMessage
      message={item}
      isCurrentUser={item.senderId === currentUser?.uid}
      onImagePress={handleImagePress}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" type="font-awesome" size={20} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={() => navigation.navigate('ServiceDetail', { providerId: recipient.id })}
        >
          <Avatar
            rounded
            size={40}
            source={recipient.image ? { uri: recipient.image } : require('../../assets/default-avatar.png')}
            containerStyle={styles.avatarContainer}
          />
          <Text style={styles.userName}>{recipient.name}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={callRecipient}
          >
            <Icon name="phone" type="font-awesome" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={confirmClearChat}
          >
            <Icon name="trash" type="font-awesome" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        {imageUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={pickImage}
            disabled={sending || imageUploading}
          >
            <Icon name="image" type="font-awesome" size={20} color="#000" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!sending && !imageUploading}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="paper-plane" type="font-awesome" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Icon name="times-circle" type="font-awesome" size={30} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 10,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginHorizontal: 15,
  },
  uploadingText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 120,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
});

export default ChatScreen;
