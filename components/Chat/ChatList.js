import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput 
} from 'react-native';
import { Text, Avatar, Icon, Divider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import moment from 'moment';

const ChatList = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [chatList, setChatList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatList, setFilteredChatList] = useState([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Query conversations where the current user is a participant
    const conversationsQuery = query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      try {
        const conversationsData = [];
        
        for (const docSnapshot of snapshot.docs) {
          const conversationData = docSnapshot.data();
          const conversationId = docSnapshot.id;
          
          // Find the other participant's ID
          const otherParticipantId = conversationData.participants.find(
            id => id !== currentUser.uid
          );
          
          // Get the other participant's details
          if (otherParticipantId) {
            const otherUserDoc = await getDoc(doc(firestore, 'users', otherParticipantId));
            
            if (otherUserDoc.exists()) {
              const otherUserData = otherUserDoc.data();
              
              conversationsData.push({
                id: conversationId,
                otherUserId: otherParticipantId,
                otherUserName: otherUserData.name || 'Unknown User',
                otherUserImage: otherUserData.profileImage || null,
                lastMessage: conversationData.lastMessage || '',
                lastMessageTimestamp: conversationData.lastMessageTimestamp || null,
                unreadCount: conversationData.unreadCount?.[currentUser.uid] || 0,
              });
            }
          }
        }
        
        setChatList(conversationsData);
        setFilteredChatList(conversationsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat list:', error);
        Alert.alert('Error', 'Failed to load conversations');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in chat list listener:', error);
      Alert.alert('Error', 'Failed to load conversations');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChatList(chatList);
    } else {
      const filtered = chatList.filter(chat => 
        chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChatList(filtered);
    }
  }, [searchQuery, chatList]);
  
  const handleChatPress = (chat) => {
    navigation.navigate('Chat', {
      conversationId: chat.id,
      recipientId: chat.otherUserId,
      recipientName: chat.otherUserName,
      recipientImage: chat.otherUserImage
    });
  };
  
  const renderChatItem = ({ item }) => {
    const timeAgo = item.lastMessageTimestamp 
      ? moment(item.lastMessageTimestamp.toDate()).fromNow() 
      : '';
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <Avatar
          rounded
          size={50}
          source={item.otherUserImage ? { uri: item.otherUserImage } : require('../../assets/default-avatar.svg')}
          containerStyle={styles.avatarContainer}
        />
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{item.otherUserName}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          
          <View style={styles.messagePreviewContainer}>
            <Text 
              style={[styles.messagePreview, item.unreadCount > 0 && styles.unreadMessage]} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text h4 style={styles.title}>Messages</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" type="font-awesome" size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : filteredChatList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="comments" type="font-awesome" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Your conversations with service providers will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChatList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 15,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: '#888',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 24,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  divider: {
    marginLeft: 80, // Aligned with the end of the avatar
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default ChatList;
