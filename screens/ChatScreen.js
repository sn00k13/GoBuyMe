// SupportScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: 'Hello! How can we help you today?', 
      sender: 'support', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      // Get or create user ID
      let storedUserId = await AsyncStorage.getItem('supportUserId');
      if (!storedUserId) {
        storedUserId = `user_${Date.now()}`;
        await AsyncStorage.setItem('supportUserId', storedUserId);
      }
      setUserId(storedUserId);

      // Connect to socket server
      const socketInstance = io('http://192.168.0.187:3001', {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to support server');
        setIsConnected(true);
        socketInstance.emit('registerUser', storedUserId);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from support server');
        setIsConnected(false);
      });

      socketInstance.on('supportMessage', (message) => {
        const formattedMessage = {
          ...message,
          time: new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, formattedMessage]);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    };

    initSocket();
  }, []);

  const handleSend = () => {
    if (newMessage.trim() === '' || !socket || !isConnected) return;
    
    const message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      time: new Date().toISOString()
    };
    
    socket.emit('userMessage', message);
    
    // Add to local state immediately
    setMessages(prev => [...prev, {
      ...message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.supportMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'user' && styles.userMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={styles.timeText}>{item.time}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
      <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
            </Pressable>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusIndicator,
            isConnected ? styles.connected : styles.disconnected
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {!isConnected && (
        <View style={styles.connectionMessage}>
          <ActivityIndicator size="small" color="#FF521B" />
          <Text style={styles.connectionText}>Connecting to support...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
          editable={isConnected}
        />
        <Pressable 
          style={styles.sendButton} 
          onPress={handleSend}
          disabled={!isConnected}
        >
          <MaterialIcons name="send" size={24} color={isConnected ? "#FF521B" : "#CCC"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F7',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDF4',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF521B',
  },
  backButton: {
    marginTop: 40,
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF521B',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 14,
    color: '#2A324B',
  },
  connectionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFF9F7',
  },
  connectionText: {
    marginLeft: 8,
    color: '#FF521B',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF521B',
    borderBottomRightRadius: 0,
  },
  supportMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDEDF4',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: '#2A324B',
  },
  userMessageText: {
    color: '#FFF',
  },
  timeText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEDF4',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EDEDF4',
    borderRadius: 25,
    fontSize: 16,
    color: '#2A324B',
  },
  sendButton: {
    marginLeft: 12,
    padding: 10,
  },
});

export default ChatScreen;