import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	Pressable,
	SafeAreaView,
	RefreshControl,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useTheme } from '../../utils/ThemeContext';
import ColorText from '../../assets/components/colorText';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen({ navigation }) {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [sortNewestFirst, setSortNewestFirst] = useState(true);
	const { theme, mode, setMode } = useTheme();

	// Function to fetch notifications
	const fetchNotifications = () => {
		const auth = getAuth();
		const user = auth.currentUser;

		if (!user) {
			console.log('No user found, skipping notification fetch');
			setLoading(false);
			return null;
		}

		console.log('Setting up notification listener for user:', user.uid);

		// Create a real-time listener for notifications
		const notificationsRef = collection(db, 'notifications');
		const q = query(
			notificationsRef, 
			where('userId', '==', user.uid)
			// orderBy('createdAt', 'desc') // Temporarily removed to debug field issues
		);

		const unsubscribe = onSnapshot(q, (querySnapshot) => {
			console.log('Fetched notifications count:', querySnapshot.size);
			const fetchedNotifications = [];
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				console.log('Notification data:', { id: doc.id, ...data });
				
				let timestamp = null;
				if (data.timestamp && data.timestamp.toDate) {
					timestamp = data.timestamp.toDate();
				} else if (data.createdAt && data.createdAt.toDate) {
					timestamp = data.createdAt.toDate();
				}

				fetchedNotifications.push({
					id: doc.id,
					...data,
					timestamp, // could be null if neither field exists
				});
			});

			// Sort notifications based on current sort preference
			const sortedNotifications = fetchedNotifications.sort((a, b) => {
				if (!a.timestamp || !b.timestamp) return 0;
				return sortNewestFirst 
					? b.timestamp.getTime() - a.timestamp.getTime()
					: a.timestamp.getTime() - b.timestamp.getTime();
			});

			console.log('Final notifications:', sortedNotifications.length);
			setNotifications(sortedNotifications);
			setLoading(false);
		}, (error) => {
			console.error('Error listening to notifications:', error);
			setLoading(false);
		});

		return unsubscribe;
	};

	// Manual refresh function
	const refreshNotifications = () => {
		console.log('Manual refresh triggered');
		setLoading(true);
		setNotifications([]);
		const unsubscribe = fetchNotifications();
		return unsubscribe;
	};

	// Use focus effect to refresh on every mount/focus
	useFocusEffect(
		React.useCallback(() => {
			console.log('NotificationsScreen focused - setting up listener');
			setLoading(true);
			setNotifications([]); // Clear existing notifications
			
			const unsubscribe = fetchNotifications();
			
			// Cleanup function to unsubscribe when screen loses focus
			return () => {
				console.log('NotificationsScreen unfocused - cleaning up listener');
				if (unsubscribe) {
					unsubscribe();
				}
			};
		}, [sortNewestFirst])
	);

	const toggleSort = () => {
		setSortNewestFirst(!sortNewestFirst);
	};

	const renderNotification = ({ item }) => {
		const formattedDate = item.timestamp ? item.timestamp.toLocaleString() : '';

		return (
			<View style={styles.notificationCard}>
				<Text style={styles.notificationTitle}>{item.title}</Text>
				<Text style={styles.notificationBody}>{item.body}</Text>
				<Text style={styles.notificationDate}>{formattedDate}</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View
				style={[
					styles.header,
					{ backgroundColor: theme.cards, borderBottomColor: theme.border },
				]}
			>
			<Pressable
				style={styles.backButton}
				onPress={() => navigation.toggleDrawer()}
			>
				<Text style={styles.backButtonText}>← Back</Text>
			</Pressable>
			
			<View style={styles.headerRow}>
				<Pressable style={styles.sortButton} onPress={toggleSort}>
					<Text style={styles.sortButtonText}>
						{sortNewestFirst ? '↑ Newest' : '↓ Oldest'}
					</Text>
				</Pressable>
				<Pressable style={styles.refreshButton} onPress={refreshNotifications}>
					<Text style={styles.refreshButtonText}>🔄</Text>
				</Pressable>
			</View>
			</View>
				<View style={styles.notificationTitle1}>
				<ColorText
					style={styles.title}
					color={mode === 'dark' ? 'textDark' : 'textLight'}
				>
					Notifications
				</ColorText>
				</View>
			{loading ? (
				<Text style={styles.loadingText}>Loading...</Text>
			) : notifications.length === 0 ? (
				<Text style={styles.emptyText}>No notifications available.</Text>
			) : (
				<FlatList
					data={notifications}
					renderItem={renderNotification}
					keyExtractor={(item) => item.id}
					refreshControl={
						<RefreshControl
							refreshing={loading}
							onRefresh={refreshNotifications}
							tintColor={theme.text}
						/>
					}
				/>
			)}
			<Pressable onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}>
				<ColorText color="accent">Toggle Theme</ColorText>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// paddingVertical: 16
		// backgroundColor will be set inline using theme.background
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
	},
	backButton: {
		// marginBottom: 16,
	},
	backButtonText: {
		fontSize: 16,
		color: '#FF521B',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		// marginBottom: 16,
	},
	loadingText: {
		fontSize: 16,
		color: '#888',
		textAlign: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#888',
		textAlign: 'center',
	},
	notificationCard: {
		backgroundColor: '#FFF',
		padding: 16,
		borderRadius: 8,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	notificationTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 8,
	},
	notificationBody: {
		fontSize: 16,
		color: '#0B3948',
		marginBottom: 8,
	},
	notificationDate: {
		fontSize: 14,
		color: '#888',
		textAlign: 'right',
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sortButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: '#E0E0E0',
		borderRadius: 8,
	},
	sortButtonText: {
		fontSize: 14,
		color: '#0B3948',
	},
	refreshButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: '#E0E0E0',
		borderRadius: 8,
	},
	refreshButtonText: {
		fontSize: 18,
		color: '#0B3948',
	},
	notificationTitle1: {
		padding: 16
	}
});
