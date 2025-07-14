import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTheme } from '../../utils/ThemeContext';
import ColorText from '../../assets/components/colorText';

export default function NotificationsScreen({ navigation }) {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const { theme, mode, setMode } = useTheme();

	useEffect(() => {
		const fetchNotifications = async () => {
			const auth = getAuth();
			const user = auth.currentUser;

			if (user) {
				try {
					const notificationsRef = collection(db, 'notifications');
					const q = query(notificationsRef, where('userId', '==', user.uid));
					const querySnapshot = await getDocs(q);

					const fetchedNotifications = [];
					querySnapshot.forEach((doc) => {
						const data = doc.data();
						fetchedNotifications.push({
							id: doc.id,
							...data,
							timestamp: data.timestamp.toDate(), // Convert Firestore Timestamp to JavaScript Date
						});
					});

					setNotifications(fetchedNotifications);
				} catch (error) {
					console.error('Error fetching notifications:', error);
				} finally {
					setLoading(false);
				}
			}
		};

		fetchNotifications();
	}, []);

	const renderNotification = ({ item }) => {
		const formattedDate = item.timestamp.toLocaleString(); // Format the date

		return (
			<View style={styles.notificationCard}>
				<Text style={styles.notificationTitle}>{item.title}</Text>
				<Text style={styles.notificationBody}>{item.body}</Text>
				<Text style={styles.notificationDate}>{formattedDate}</Text>
			</View>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<Pressable
				style={styles.backButton}
				onPress={() => navigation.navigate('Home')}
			>
				<Text style={styles.backButtonText}>← Back</Text>
			</Pressable>
			<ColorText
				style={styles.title}
				color={mode === 'dark' ? 'textDark' : 'textLight'}
			>
				Notifications
			</ColorText>

			{loading ? (
				<Text style={styles.loadingText}>Loading...</Text>
			) : notifications.length === 0 ? (
				<Text style={styles.emptyText}>No notifications available.</Text>
			) : (
				<FlatList
					data={notifications}
					renderItem={renderNotification}
					keyExtractor={(item) => item.id}
				/>
			)}
			<Pressable onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}>
				<ColorText color="accent">Toggle Theme</ColorText>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		// backgroundColor will be set inline using theme.background
	},
	backButton: {
		marginTop: 20,
		marginBottom: 16,
	},
	backButtonText: {
		fontSize: 16,
		color: '#FF521B',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
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
});
