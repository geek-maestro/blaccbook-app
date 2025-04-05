import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }
  
  return token;
};

// Save user's push notification token to Firestore
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;
  
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update user document with the token
      await setDoc(userRef, { 
        pushTokens: { 
          [token]: true 
        } 
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

// Send a local notification
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

// Handle received notifications
export const useNotificationHandler = (navigation) => {
  const { currentUser } = useAuth();
  
  React.useEffect(() => {
    // Handle notification that caused app to open from quit state
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response.notification.request.content.data, navigation);
      }
    });
    
    // Handle notification response when app is in foreground or background
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response.notification.request.content.data, navigation);
    });
    
    // Register push token when user is logged in
    if (currentUser) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushToken(currentUser.uid, token);
        }
      });
    }
    
    return () => subscription.remove();
  }, [currentUser, navigation]);
};

// Handle notification interaction
const handleNotificationResponse = (data, navigation) => {
  try {
    if (!data || !navigation) return;
    
    console.log('Notification data:', data);
    
    // Navigate based on notification type
    if (data.type === 'booking') {
      navigation.navigate('BookingDetail', { bookingId: data.bookingId });
    } else if (data.type === 'chat') {
      navigation.navigate('Chat', { 
        conversationId: data.conversationId,
        recipientId: data.senderId,
        recipientName: data.senderName,
        recipientImage: data.senderImage
      });
    } else if (data.type === 'call') {
      navigation.navigate('Call', { 
        callId: data.callId,
        recipientId: data.callerId,
        recipientName: data.callerName,
        recipientImage: data.callerImage,
        isOutgoing: false
      });
    } else if (data.type === 'service') {
      navigation.navigate('ServiceDetail', { serviceId: data.serviceId });
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
  }
};

// Set badge count
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};
