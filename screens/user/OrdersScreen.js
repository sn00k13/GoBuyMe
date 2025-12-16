import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	RefreshControl,
	ActivityIndicator,
	SafeAreaView,
	Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTheme } from '../../utils/ThemeContext';

export default function OrdersScreen({ navigation }) {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const { theme, mode, setMode } = useTheme();
	const auth = getAuth();

	const fetchOrders = async () => {
		try {
			const ordersRef = collection(db, 'orders');
			const q = query(
				ordersRef,
				where('userId', '==', auth.currentUser.uid),
				orderBy('createdAt', 'desc')
			);
			const querySnapshot = await getDocs(q);
			const ordersData = [];
			querySnapshot.forEach((doc) => {
				ordersData.push({ id: doc.id, ...doc.data() });
			});
			setOrders(ordersData);
		} catch (error) {
			console.error('Error fetching orders:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const onRefresh = () => {
		setRefreshing(true);
		fetchOrders();
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'Pending':
				return '#FF9800';
			case 'Processing':
				return '#2196F3';
			case 'Delivered':
				return '#4CAF50';
			case 'Cancelled':
				return '#FF0000';
			case 'On Transit':
				return '#1B9AAA';
			case 'Reported':
				return '#6A2E35';
			default:
				return '#757575';
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'Pending':
				return 'hourglass-empty'; // Simple clock icon
			case 'Processing':
				return 'local-shipping'; // Truck icon
			case 'Delivered':
				return 'check-circle'; // Checkmark in circle
			case 'Cancelled':
				return 'cancel'; // X icon
			case 'On Transit':
				return 'local-shipping'; // Same as processing
			case 'Reported':
				return 'report'; // Report icon
			default:
				return 'help-outline'; // Help icon with outline
		}
	};

	const renderOrderStatus = (status) => {
		// Log the status to see what we're working with
		console.log('Status:', status);

		// Simple mapping of status to known working icons
		const iconMap = {
			Pending: 'schedule',
			Processing: 'local-shipping',
			Delivered: 'check-circle',
			Cancelled: 'cancel',
			'On Transit': 'local-shipping',
			Reported: 'report',
		};

		const iconName = iconMap[status] || 'help-outline';
		return (
			<MaterialIcons
				name={iconName}
				size={16}
				color="white"
				style={styles.statusIcon}
			/>
		);
	};

	const formatDate = (timestamp) => {
		if (!timestamp) return '';
		const date = timestamp.toDate();
		return date.toLocaleDateString('en-NG', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const renderOrder = ({ item }) => (
		<Pressable
			style={styles.orderCard}
			onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
		>
			<View style={styles.orderHeader}>
				<Text style={[styles.orderId, { color: theme.text }]}>
					Order #{item.id.slice(-6)}
				</Text>
				<View
					style={[
						styles.statusBadge,
						{ backgroundColor: getStatusColor(item.status) },
					]}
				>
					{renderOrderStatus(item.status)}
					<Text style={styles.statusText}>
						{(item.status || 'pending').charAt(0).toUpperCase() +
							(item.status || 'pending').slice(1)}
					</Text>
				</View>
			</View>

			<View style={styles.orderInfo}>
				<Text style={[styles.dateText, { color: theme.text }]}>
					{formatDate(item.createdAt)}
				</Text>
				<Text style={[styles.amountText, { color: theme.primary }]}>
					₦{item.totalAmount?.toLocaleString()}
				</Text>
			</View>

			<View style={styles.itemsList}>
				{item.items.map((orderItem, index) => (
					<Text
						key={index}
						style={[styles.itemText, { color: theme.text }]}
						numberOfLines={1}
					>
						{orderItem.quantity}x {orderItem.name}
					</Text>
				))}
			</View>

			<View style={styles.paymentInfo}>
				<Text style={[styles.paymentMethod, { color: theme.text }]}>
					{item.paymentMethod === 'cash_on_delivery'
						? 'Cash on Delivery'
						: (item.paymentMethod || 'card').charAt(0).toUpperCase() +
						  (item.paymentMethod || 'card').slice(1)}
				</Text>
				<Text style={[styles.paymentStatus, { color: theme.secondary }]}>
					{(item.paymentStatus || 'pending').charAt(0).toUpperCase() +
						(item.paymentStatus || 'pending').slice(1)}
				</Text>
			</View>
		</Pressable>
	);

	if (loading) {
		return (
			<View
				style={[styles.loadingContainer, { backgroundColor: theme.background }]}
			>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View
				style={[
					styles.header,
					{ backgroundColor: theme.cards, borderBottomColor: theme.accent },
				]}
			>
				<Pressable onPress={() => navigation.navigate('HomeMain')}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={[styles.headerText, { color: theme.primary }]}>
					My Orders
				</Text>
				<View></View>
			</View>

			<FlatList
				data={orders}
				renderItem={renderOrder}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<MaterialIcons name="shopping-bag" size={64} color="#ccc" />
						<Text style={styles.emptyText}>No orders yet</Text>
					</View>
				}
			/>
			<View style={{ padding: 30 }}></View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	header: {
		backgroundColor: 'white',
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		...Platform.select({
			ios: {
				marginTop: 0,
				// iOS specific styles
			  },
			android: {
				marginTop: 40,
				// Android specific styles
			  },
		  }),
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFF0EB',
	},
	listContainer: {
		padding: 16,
	},
	orderCard: {
		backgroundColor: '#EAE0D5',
		borderRadius: 4,
		padding: 16,
		marginBottom: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	orderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	orderId: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	statusIcon: {
		marginRight: 4,
	},
	statusText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold',
	},
	orderInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	dateText: {
		fontSize: 14,
		color: '#666',
	},
	amountText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	itemsList: {
		marginBottom: 12,
	},
	itemText: {
		fontSize: 14,
		color: '#0B3948',
		marginBottom: 4,
	},
	paymentInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
	},
	paymentMethod: {
		fontSize: 14,
		color: '#666',
	},
	paymentStatus: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
	},
	emptyText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666',
	},
});
