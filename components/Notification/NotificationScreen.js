import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl
} from 'react-native';
import { Text, Icon, Divider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import moment from 'moment';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (!currentUser) return;
    
    const notificationsQuery = query(
      collection(firestore, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date object if it exists
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      
      setNotifications(notificationsData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error in notifications listener:', error);
      Alert.alert('Error', 'Failed to load notifications');
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  const onRefresh = () => {
    setRefreshing(true);
  };
  
  const markAsRead = async (notification) => {
    if (notification.read) return;
    
    try {
      const notificationRef = doc(firestore, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleNotificationPress = (notification) => {
    // Mark as read
    markAsRead(notification);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'booking':
      case 'booking_confirmed':
      case 'booking_cancelled':
        navigation.navigate('BookingDetail', { bookingId: notification.bookingId });
        break;
      case 'chat':
        navigation.navigate('Chat', { 
          conversationId: notification.conversationId,
          recipientId: notification.senderId,
          recipientName: notification.senderName,
          recipientImage: notification.senderImage
        });
        break;
      case 'call':
        navigation.navigate('CallHistory');
        break;
      default:
        // Just mark as read for system notifications
        break;
    }
  };
  
  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };
  
  const confirmDeleteNotification = (notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(notification.id)
        }
      ]
    );
  };
  
  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const batch = writeBatch(firestore);
              
              notifications.forEach(notification => {
                const notificationRef = doc(firestore, 'notifications', notification.id);
                batch.delete(notificationRef);
              });
              
              await batch.commit();
              setLoading(false);
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const renderNotificationItem = ({ item }) => {
    const timeAgo = moment(item.createdAt).fromNow();
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => confirmDeleteNotification(item)}
      >
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{timeAgo}</Text>
        </View>
        
        {!item.read && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return (
          <Icon
            name="calendar"
            type="font-awesome"
            size={24}
            color="#007aff"
            containerStyle={styles.iconContainer}
          />
        );
      case 'chat':
        return (
          <Icon
            name="comment"
            type="font-awesome"
            size={24}
            color="#4cd964"
            containerStyle={styles.iconContainer}
          />
        );
      case 'call':
        return (
          <Icon
            name="phone"
            type="font-awesome"
            size={24}
            color="#5856d6"
            containerStyle={styles.iconContainer}
          />
        );
      default:
        return (
          <Icon
            name="bell"
            type="font-awesome"
            size={24}
            color="#ff9500"
            containerStyle={styles.iconContainer}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text h4 style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllNotifications}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="bell-slash"
            type="font-awesome"
            size={60}
            color="#ccc"
          />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You don't have any notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    color: '#007aff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff',
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007aff',
    alignSelf: 'center',
    marginLeft: 10,
  },
  divider: {
    marginLeft: 70,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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

export default NotificationScreen;
