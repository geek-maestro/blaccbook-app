import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';

// Format call duration for display (MM:SS)
export const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Initialize a new call
export const initiateCall = async (callerId, recipientId) => {
  try {
    // Create call record
    const callRef = await addDoc(collection(firestore, 'calls'), {
      callerId,
      recipientId,
      status: 'ringing',
      startTime: serverTimestamp(),
      endTime: null,
      duration: 0,
      isVideoCall: false,
      isMissed: false
    });
    
    // Create notification for recipient
    await addDoc(collection(firestore, 'notifications'), {
      userId: recipientId,
      title: 'Incoming Call',
      message: 'You have an incoming call',
      type: 'call',
      callId: callRef.id,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Get caller info for push notification
    const callerDoc = await getDoc(doc(firestore, 'users', callerId));
    const callerName = callerDoc.exists() ? callerDoc.data().name || 'Unknown' : 'Unknown';
    
    // Get recipient's device tokens for push notification (handled by cloud function in a real app)
    // In a real implementation, this would trigger a cloud function to send a push notification
    
    return callRef.id;
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
};

// Accept an incoming call
export const acceptCall = async (callId) => {
  try {
    await updateDoc(doc(firestore, 'calls', callId), {
      status: 'active',
      isMissed: false,
      acceptedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error accepting call:', error);
    throw error;
  }
};

// End an active call
export const endCall = async (callId) => {
  try {
    // Get current call data to calculate duration
    const callDoc = await getDoc(doc(firestore, 'calls', callId));
    
    if (!callDoc.exists()) {
      throw new Error('Call not found');
    }
    
    const callData = callDoc.data();
    let duration = 0;
    
    // Calculate call duration if call was accepted
    if (callData.status === 'active' && callData.acceptedAt) {
      const now = new Date();
      const acceptedAt = callData.acceptedAt.toDate();
      duration = Math.floor((now - acceptedAt) / 1000); // Duration in seconds
    }
    
    // Update call record
    await updateDoc(doc(firestore, 'calls', callId), {
      status: 'ended',
      endTime: serverTimestamp(),
      duration,
      isMissed: callData.status === 'ringing' // Mark as missed if it was still ringing
    });
    
    // Create notification for call summary (optional)
    const otherPartyId = callData.callerId === callData.recipientId ? callData.recipientId : callData.callerId;
    
    await addDoc(collection(firestore, 'notifications'), {
      userId: otherPartyId,
      title: 'Call Ended',
      message: `Call duration: ${formatDuration(duration)}`,
      type: 'call_summary',
      callId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
};

// Listen for call status updates
export const listenForCallUpdates = (callId, callback) => {
  const callRef = doc(firestore, 'calls', callId);
  return onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening for call updates:', error);
    callback(null);
  });
};

// Get call history for a user
export const getCallHistory = async (userId) => {
  try {
    // Get calls where user is either caller or recipient
    const callsQuery = query(
      collection(firestore, 'calls'),
      where('participantIds', 'array-contains', userId),
      orderBy('startTime', 'desc')
    );
    
    const callsSnapshot = await getDocs(callsQuery);
    
    const callHistory = callsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return callHistory;
  } catch (error) {
    console.error('Error getting call history:', error);
    throw error;
  }
};

// Handle an incoming call notification
export const handleIncomingCallNotification = async (callId) => {
  try {
    const callDoc = await getDoc(doc(firestore, 'calls', callId));
    
    if (!callDoc.exists()) {
      throw new Error('Call not found');
    }
    
    const callData = callDoc.data();
    
    if (callData.status === 'ringing') {
      // Call is still ringing, we can show the incoming call screen
      return callData;
    } else {
      // Call was already handled (answered or declined)
      return null;
    }
  } catch (error) {
    console.error('Error handling incoming call notification:', error);
    throw error;
  }
};

// Decline an incoming call
export const declineCall = async (callId) => {
  try {
    await updateDoc(doc(firestore, 'calls', callId), {
      status: 'declined',
      endTime: serverTimestamp(),
      isMissed: false
    });
  } catch (error) {
    console.error('Error declining call:', error);
    throw error;
  }
};
