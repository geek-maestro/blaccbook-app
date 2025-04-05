import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import IncomingCallScreen from './IncomingCallScreen';
import OutgoingCallScreen from './OutgoingCallScreen';
import { useAuth } from '../../contexts/AuthContext';
import { initiateCall, endCall, acceptCall, listenForCallUpdates } from '../../utils/callManager';

const CallScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const { 
    recipientId, 
    recipientName, 
    recipientImage,
    isOutgoing = true,
    callId = null
  } = route.params || {};
  
  const [callState, setCallState] = useState({
    isConnected: false,
    isOnHold: false,
    isMuted: false,
    useSpeaker: true,
    useBluetoothIfAvailable: false,
    callDuration: 0
  });
  
  const [activeCallId, setActiveCallId] = useState(callId);
  
  // Start the call when component mounts
  useEffect(() => {
    let callTimerInterval;
    let callUpdateUnsubscribe;
    
    const setupCall = async () => {
      try {
        if (isOutgoing) {
          // Create a new outgoing call
          const newCallId = await initiateCall(currentUser.uid, recipientId);
          setActiveCallId(newCallId);
        }
        
        // Listen for call updates
        if (activeCallId) {
          callUpdateUnsubscribe = listenForCallUpdates(activeCallId, (callData) => {
            if (callData) {
              // If recipient accepted the call
              if (callData.status === 'active' && !callState.isConnected) {
                setCallState(prev => ({ ...prev, isConnected: true }));
                
                // Start the call timer
                callTimerInterval = setInterval(() => {
                  setCallState(prev => ({ 
                    ...prev, 
                    callDuration: prev.callDuration + 1 
                  }));
                }, 1000);
              }
              
              // If call is ended by either user
              if (callData.status === 'ended') {
                handleEndCall(false); // Don't update the database as it's already ended
              }
            }
          });
        }
      } catch (error) {
        console.error('Error setting up call:', error);
        navigation.goBack();
      }
    };
    
    if (currentUser && (recipientId || activeCallId)) {
      setupCall();
    }
    
    return () => {
      if (callTimerInterval) clearInterval(callTimerInterval);
      if (callUpdateUnsubscribe) callUpdateUnsubscribe();
      
      // Ensure call is ended if user navigates away
      if (activeCallId && callState.isConnected) {
        handleEndCall(true);
      }
    };
  }, [currentUser, recipientId, activeCallId, isOutgoing]);
  
  // Handle accepting an incoming call
  const handleAcceptCall = async () => {
    try {
      await acceptCall(activeCallId);
      setCallState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Error accepting call:', error);
      navigation.goBack();
    }
  };
  
  // Handle ending the call
  const handleEndCall = async (updateDatabase = true) => {
    try {
      if (updateDatabase && activeCallId) {
        await endCall(activeCallId);
      }
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error ending call:', error);
      navigation.goBack();
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };
  
  // Toggle speaker state
  const toggleSpeaker = () => {
    setCallState(prev => ({ ...prev, useSpeaker: !prev.useSpeaker }));
  };
  
  // Toggle call hold state
  const toggleHold = () => {
    setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
  };
  
  // Toggle Bluetooth
  const toggleBluetooth = () => {
    setCallState(prev => ({ ...prev, useBluetoothIfAvailable: !prev.useBluetoothIfAvailable }));
  };

  return (
    <View style={styles.container}>
      {isOutgoing ? (
        <OutgoingCallScreen
          recipientName={recipientName}
          recipientImage={recipientImage}
          callState={callState}
          onEndCall={() => handleEndCall(true)}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onToggleHold={toggleHold}
          onToggleBluetooth={toggleBluetooth}
        />
      ) : (
        <IncomingCallScreen
          callerName={recipientName}
          callerImage={recipientImage}
          callState={callState}
          onAcceptCall={handleAcceptCall}
          onRejectCall={() => handleEndCall(true)}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onToggleHold={toggleHold}
          onToggleBluetooth={toggleBluetooth}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default CallScreen;
