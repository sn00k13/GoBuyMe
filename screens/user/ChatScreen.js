import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	SafeAreaView,
	Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	getFirestore,
	collection,
	query,
	orderBy,
	onSnapshot,
	addDoc,
	serverTimestamp,
	doc,
	setDoc,
	getDoc,
	updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getAuth } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';

const ChatScreen = ({ navigation }) => {
	const flatListRef = useRef(null);
	const [isConnected, setIsConnected] = useState(true);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');
	const [chatId, setChatId] = useState(null);
	const [supportIsTyping, setSupportIsTyping] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const typingTimeoutRef = useRef(null);

	// Get or create a unique chat ID for the user
	const getOrCreateChatId = async (isNewSession = false) => {
		try {
			// Get the authenticated user's ID
			const auth = getAuth();
			const currentUser = auth.currentUser;
			if (!currentUser) {
				console.error('No authenticated user found');
				return null;
			}

			// Create a unique storage key for this user's chat ID
			const storageKey = `userChatId_${currentUser.uid}`;

			let chatId;
			if (isNewSession) {
				// For new sessions, create a new chat ID with timestamp
				chatId = `chat_${currentUser.uid}_${Date.now()}`;
				await AsyncStorage.setItem(storageKey, chatId);
			} else {
				// For existing sessions, get or create a chat ID
				chatId = await AsyncStorage.getItem(storageKey);
				if (!chatId) {
					chatId = `chat_${currentUser.uid}_${Date.now()}`;
					await AsyncStorage.setItem(storageKey, chatId);
				}
			}

			setChatId(chatId);
			return chatId;
		} catch (error) {
			console.error('Error managing chat session:', error);
			return null;
		}
	};

	// Helper function to create welcome message
	const getWelcomeMessage = () => ({
		id: 'welcome-1',
		text: 'Hello! How can we help you today?',
		sender: 'support',
		time: new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		}),
	});

	// Typing indicator functions
	const startTyping = useCallback(async () => {
		if (!chatId) return;
		
		try {
			const chatDocRef = doc(db, 'supportChats', chatId);
			await updateDoc(chatDocRef, {
				userIsTyping: true,
				updated: serverTimestamp()
			});
		} catch (error) {
			console.error("Error setting typing indicator:", error);
		}
	}, [chatId]);

	const stopTyping = useCallback(async () => {
		if (!chatId) return;
		
		try {
			const chatDocRef = doc(db, 'supportChats', chatId);
			await updateDoc(chatDocRef, {
				userIsTyping: false,
				updated: serverTimestamp()
			});
		} catch (error) {
			console.error("Error removing typing indicator:", error);
		}
	}, [chatId]);

	const handleInputChange = (text) => {
		setNewMessage(text);
		
		// Start typing indicator if not already active
		if (!isTyping) {
			setIsTyping(true);
			startTyping();
		}
		
		// Reset the typing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
		
		// Set timeout to stop typing indicator after 2 seconds of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			setIsTyping(false);
			stopTyping();
		}, 2000);
	};

	// Initialize chat
	useEffect(() => {
		// 1. Network connection monitoring
		const netUnsubscribe = NetInfo.addEventListener((state) => {
			setIsConnected(state.isConnected);
		});

		// 2. Load chat history from Firestore
		const loadChat = async () => {
			try {
				// Get or create chat ID for the current user
				const currentChatId = await getOrCreateChatId();
				if (!currentChatId) {
					console.error('Failed to get or create chat ID');
					return;
				}

				const chatDocRef = doc(db, 'supportChats', currentChatId);
				const messagesRef = collection(db, 'supportChats', currentChatId, 'messages');

				// Check if chat exists and is active
				const chatDoc = await getDoc(chatDocRef);
				const chatData = chatDoc.data();
				const isNewChat = !chatDoc.exists() || chatData?.status === 'ended';

				if (isNewChat) {
					// For new chats, show welcome message in UI
					setMessages([getWelcomeMessage()]);
					
					// Create the chat document
					await setDoc(chatDocRef, {
						participants: [auth.currentUser.uid, 'support_team'],
						status: 'active',
						userIsTyping: false,
						supportIsTyping: false,
						created: serverTimestamp(),
						updated: serverTimestamp(),
					});
					return;
				}

				// Set up listener for support typing status
				const chatUnsubscribe = onSnapshot(chatDocRef, (doc) => {
					if (doc.exists()) {
						const data = doc.data();
						setSupportIsTyping(data.supportIsTyping || false);
					}
				});

				// For existing chats, load the messages
				const q = query(messagesRef, orderBy('timestamp', 'asc'));
				const messagesUnsubscribe = onSnapshot(q, (snapshot) => {
					const firebaseMessages = snapshot.docs.map((doc) => {
						const data = doc.data();
						const timestamp = data.timestamp
							? data.timestamp.toDate()
							: new Date();
						return {
							id: doc.id,
							text: data.text || '',
							sender: data.sender || 'support',
							time: timestamp.toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							}),
						};
					});

					if (firebaseMessages.length > 0) {
						setMessages(firebaseMessages);
					}
				});

				return () => {
					chatUnsubscribe();
					messagesUnsubscribe();
				};
			} catch (error) {
				console.error('Error loading chat history:', error);
			}
		};
		loadChat();

		// Cleanup function
		return () => {
			netUnsubscribe();
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			if (isTyping) {
				stopTyping();
			}
		};
	}, []);

	const handleSend = async () => {
		if (!newMessage.trim() || !isConnected || !chatId) return;

		try {
			// Clear typing indicator
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			setIsTyping(false);
			await stopTyping();

			// Get user data from auth and AsyncStorage
			const auth = getAuth();
			const currentUser = auth.currentUser;
			const [userName, userEmail] = await Promise.all([
				AsyncStorage.getItem('userName'),
				AsyncStorage.getItem('userEmail'),
			]);

			const userData = {
				userId: currentUser.uid,
				name: userName || currentUser.displayName || 'User',
				email: userEmail || currentUser.email || 'No email provided',
			};

			const chatRef = doc(db, 'supportChats', chatId);
			const messagesRef = collection(db, 'supportChats', chatId, 'messages');

			// Update the chat document with user info
			await updateDoc(chatRef, {
				userInfo: userData,
				updated: serverTimestamp(),
			});

			// Create the user's message
			const message = {
				...userData,
				text: newMessage.trim(),
				sender: 'user',
				timestamp: serverTimestamp(),
				read: false,
			};

			// Clear input immediately for better UX
			setNewMessage('');

			// Add user's message to Firestore
			await addDoc(messagesRef, message);

			// Update local state with user's message
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					...message,
					time: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
				},
			]);
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert('Error', 'Failed to send message. Please try again.');
			setNewMessage(newMessage); // Restore the message if sending failed
		}
	};

	const clearChatHistory = async () => {
		try {
			if (chatId) {
				const chatRef = doc(db, 'supportChats', chatId);
				const messagesRef = collection(db, 'supportChats', chatId, 'messages');

				// Add system message about session end
				await addDoc(messagesRef, {
					text: 'Session has been ended by user',
					sender: 'system',
					timestamp: serverTimestamp(),
					read: false,
					isSystemMessage: true,
				});

				// Mark the current chat as ended
				await updateDoc(chatRef, {
					status: 'ended',
					endedAt: serverTimestamp(),
					updated: serverTimestamp(),
					userIsTyping: false,
					supportIsTyping: false,
				});

				// Clear the chat ID from storage
				await AsyncStorage.removeItem(`userChatId_${auth.currentUser.uid}`);
			}

			// Clear local state and show welcome message
			setMessages([getWelcomeMessage()]);
			setChatId(null);

			Alert.alert('Session Ended', 'Your chat session has ended. For any other issues, please contact us.');
		} catch (error) {
			console.error('Error managing chat session:', error);
			Alert.alert('Error', 'Failed to end chat session. Please try again.');
		}
	};

	const renderMessage = ({ item }) => (
		<View
			style={[
				styles.messageContainer,
				item.sender === 'user' ? styles.userMessage : styles.supportMessage,
			]}
		>
			<Text
				style={[
					styles.messageText,
					item.sender === 'user' && styles.userMessageText,
				]}
			>
				{item.text}
			</Text>
			<Text style={styles.timeText}>{item.time}</Text>
		</View>
	);

	const renderTypingIndicator = () => {
		if (!supportIsTyping) return null;
		
		return (
			<View style={[styles.messageContainer, styles.supportMessage]}>
				<View style={styles.typingContainer}>
					<View style={styles.typingDot} />
					<View style={[styles.typingDot, { marginHorizontal: 4 }]} />
					<View style={styles.typingDot} />
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={[styles.container]}
				keyboardVerticalOffset={90}
			>
				<View style={styles.header}>
					<Pressable
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<MaterialIcons name="arrow-back" size={24} color="#333" />
					</Pressable>
					<Text style={styles.headerTitle}>Customer Support</Text>
					<View style={styles.connectionStatus}>
						<View
							style={[
								styles.statusIndicator,
								isConnected ? styles.connected : styles.disconnected,
							]}
						/>
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

				{/* --- CLOSE SUPPORT BUTTON --- */}
				<Pressable
					style={{
						alignSelf: 'flex-end',
						margin: 12,
						backgroundColor: '#F44336',
						paddingHorizontal: 16,
						paddingVertical: 8,
						borderRadius: 20,
					}}
					onPress={clearChatHistory}
				>
					<Text style={{ color: 'white', fontWeight: 'bold' }}>
						End Session
					</Text>
				</Pressable>

				<FlatList
					ref={flatListRef}
					data={messages}
					renderItem={renderMessage}
					ListFooterComponent={renderTypingIndicator}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.messagesContainer}
					onContentSizeChange={() =>
						flatListRef.current?.scrollToEnd({ animated: true })
					}
				/>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.input}
						value={newMessage}
						onChangeText={handleInputChange}
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
						<MaterialIcons
							name="send"
							size={24}
							color={isConnected ? '#FF521B' : '#CCC'}
						/>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
			<View style={styles.bottomPad}></View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		padding: 16,
		backgroundColor: '#FFF',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		...Platform.select({
			ios: {
				marginTop: 0,
			},
			android: {
				marginTop: 40,
			},
		}),
	},
	bottomPad: {
		...Platform.select({
			ios: {
				paddingBottom: 0,
			},
			android: {
				paddingBottom: 40,
			},
		}),
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
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
	typingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 24,
	},
	typingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#666',
		opacity: 0.7,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
	},
	input: {
		flex: 1,
		minHeight: 50,
		maxHeight: 100,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#cdcdd0ff',
		borderRadius: 25,
		fontSize: 16,
		color: '#2A324B',
		alignItems: 'center',
	},
	sendButton: {
		marginLeft: 12,
		padding: 10,
	},
});

export default ChatScreen;