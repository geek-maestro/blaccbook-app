import React from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { Text, Avatar, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDuration } from '../../utils/callManager';

const OutgoingCallScreen = ({
  recipientName,
  recipientImage,
  callState,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onToggleBluetooth
}) => {
  const { 
    isConnected, 
    isOnHold, 
    isMuted, 
    useSpeaker, 
    useBluetoothIfAvailable,
    callDuration 
  } = callState;
  
  return (
    <ImageBackground
      source={require('../../assets/call-background.png')}
      style={styles.backgroundImage}
      blurRadius={5}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.recipientInfoContainer}>
          <Avatar
            rounded
            size={120}
            source={recipientImage ? { uri: recipientImage } : require('../../assets/default-avatar.png')}
            containerStyle={styles.recipientAvatar}
          />
          <Text style={styles.recipientName}>{recipientName}</Text>
          
          {isConnected ? (
            <Text style={styles.callStatus}>
              {isOnHold ? 'On Hold' : `Call Time: ${formatDuration(callDuration)}`}
            </Text>
          ) : (
            <Text style={styles.callStatus}>Calling...</Text>
          )}
        </View>
        
        <View style={styles.callControlsContainer}>
          {isConnected && (
            <View style={styles.controlsRow}>
              <TouchableOpacity 
                style={[styles.controlButton, isMuted && styles.activeControlButton]}
                onPress={onToggleMute}
              >
                <Icon 
                  name={isMuted ? 'microphone-slash' : 'microphone'} 
                  type="font-awesome" 
                  size={25} 
                  color="#fff" 
                />
                <Text style={styles.controlText}>Mute</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, useSpeaker && styles.activeControlButton]}
                onPress={onToggleSpeaker}
              >
                <Icon 
                  name="volume-up" 
                  type="font-awesome" 
                  size={25} 
                  color="#fff" 
                />
                <Text style={styles.controlText}>Speaker</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, isOnHold && styles.activeControlButton]}
                onPress={onToggleHold}
              >
                <Icon 
                  name="pause" 
                  type="font-awesome" 
                  size={25} 
                  color="#fff" 
                />
                <Text style={styles.controlText}>Hold</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, useBluetoothIfAvailable && styles.activeControlButton]}
                onPress={onToggleBluetooth}
              >
                <Icon 
                  name="bluetooth-b" 
                  type="font-awesome" 
                  size={25} 
                  color="#fff" 
                />
                <Text style={styles.controlText}>Bluetooth</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.endCallButton}
            onPress={onEndCall}
          >
            <Icon 
              name="phone" 
              type="font-awesome" 
              size={30} 
              color="#fff"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 20,
  },
  recipientInfoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  recipientAvatar: {
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  recipientName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  callStatus: {
    fontSize: 16,
    color: '#f0f0f0',
  },
  callControlsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    opacity: 0.8,
  },
  activeControlButton: {
    opacity: 1,
  },
  controlText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OutgoingCallScreen;
