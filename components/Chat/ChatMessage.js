import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-elements';
import moment from 'moment';

const ChatMessage = ({ message, isCurrentUser, onImagePress }) => {
  const messageTime = message.timestamp
    ? moment(message.timestamp.toDate()).format('h:mm A')
    : '';
  
  const isImage = message.type === 'image';
  
  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        isImage && styles.imageBubble
      ]}>
        {isImage ? (
          <TouchableOpacity onPress={() => onImagePress(message.content)}>
            <Image
              source={{ uri: message.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        )}
      </View>
      <Text style={[
        styles.timeText,
        isCurrentUser ? styles.currentUserTimeText : styles.otherUserTimeText
      ]}>
        {messageTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    marginRight: 15,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    marginLeft: 15,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: '#000',
  },
  otherUserBubble: {
    backgroundColor: '#f0f0f0',
  },
  imageBubble: {
    padding: 2,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 10,
  },
  currentUserTimeText: {
    color: '#888',
    textAlign: 'right',
  },
  otherUserTimeText: {
    color: '#888',
    textAlign: 'left',
  },
});

export default ChatMessage;
