import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Pressable,
	SafeAreaView,
	Platform,
	Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCart } from '../app/CartContext';
import { useTheme } from '../../utils/ThemeContext';

export default function OrderDetailsScreen({ navigation, route }) {
	const { orderId } = route.params;
	const [order, setOrder] = useState(null);
	const [agent, setAgent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [agentLoading, setAgentLoading] = useState(false);
	const { addToCart } = useCart();
	const { theme, mode, setMode } = useTheme();

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const orderDoc = await getDoc(doc(db, 'orders', orderId));
				if (orderDoc.exists()) {
					const orderData = { id: orderDoc.id, ...orderDoc.data() };
					setOrder(orderData);

					// If order is delivered and has a modifiedBy field, fetch agent details
					if (orderData.status === 'Delivered' && orderData.modifiedBy) {
						fetchAgentDetails(orderData.modifiedBy);
					}
				}
			} catch (error) {
				console.error('Error fetching order:', error);
			} finally {
				setLoading(false);
			}
		};

		const fetchAgentDetails = async (agentId) => {
			setAgentLoading(true);
			try {
				const agentDoc = await getDoc(doc(db, 'agents', agentId));
				if (agentDoc.exists()) {
					setAgent({ id: agentDoc.id, ...agentDoc.data() });
				}
			} catch (error) {
				console.error('Error fetching agent details:', error);
			} finally {
				setAgentLoading(false);
			}
		};

		fetchOrder();
	}, [orderId]);

	const getStatusColor = (status) => {
		switch (status) {
			case 'Pending':
				return '#FF9800';
			case 'Processing':
				return '#2196F3';
			case 'Delivered':
				return '#4CAF50';
			case 'Cancelled':
				return '#F44336';
			case 'On Transit':
				return '#1B9AAA';
			case 'Reported':
				return '#6A2E35';
			default:
				return '#757575';
		}
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

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	if (!order) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Order not found</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={[styles.header, { backgroundColor: theme.cards }]}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={[styles.headerText, { color: theme.primary }]}>
					Order Details
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView style={styles.content}>
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<View style={styles.orderHeader}>
						<Text style={[styles.orderId, { color: theme.text }]}>
							Order #{order.id.slice(-6)}
						</Text>
						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: getStatusColor(order.status) },
							]}
						>
							<Text style={styles.statusText}>
								{(order.status || 'Pending').charAt(0).toUpperCase() +
									(order.status || 'Pending').slice(1)}
							</Text>
						</View>
					</View>
					<Text style={[styles.dateText, { color: theme.text }]}>
						{formatDate(order.createdAt)}
					</Text>
				</View>

				{/* Delivery Agent Section */}
				{order.status === 'Delivered' && order.modifiedBy && (
					<View style={[styles.section, { backgroundColor: theme.cards }]}>
						<Text style={[styles.sectionTitle, { color: theme.text }]}>
							Delivery Agent
						</Text>
						{agentLoading ? (
							<ActivityIndicator size="small" color="#FF521B" />
						) : agent ? (
							<View style={styles.agentContainer}>
								{agent.profileImage ? (
									<Image
										source={{ uri: agent.profileImage }}
										style={styles.agentImage}
									/>
								) : (
									<View style={styles.agentPlaceholder}>
										<MaterialIcons name="person" size={32} color="#666" />
									</View>
								)}
								<View style={styles.agentInfo}>
									<Text style={[styles.agentName, { color: theme.text }]}>
										{agent.name || 'Delivery Agent'}
									</Text>
									{agent.phone && (
										<Text style={[styles.agentPhone, { color: theme.text }]}>
											{agent.phone}
										</Text>
									)}
									{agent.averageRating && (
										<View style={styles.agentRating}>
											<MaterialIcons name="star" size={16} color="#FFD700" />
											<Text style={[styles.ratingText, { color: theme.text }]}>
												{agent.averageRating.toFixed(1)}
											</Text>
											{agent.totalDeliveries && (
												<Text
													style={[styles.deliveryCount, { color: theme.text }]}
												>
													• {agent.totalDeliveries} deliveries
												</Text>
											)}
										</View>
									)}
								</View>
							</View>
						) : (
							<Text style={[styles.noAgentText, { color: theme.text }]}>
								Agent details not available
							</Text>
						)}
					</View>
				)}

				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, { color: theme.text }]}>
						Items
					</Text>
					{order.items.map((item, index) => (
						<View key={index} style={styles.itemRow}>
							<View style={styles.itemInfo}>
								<Text style={[styles.itemName, { color: theme.text }]}>
									{item.name}
								</Text>
								<Text style={[styles.itemQuantity, { color: theme.text }]}>
									Quantity: {item.quantity}
								</Text>
							</View>
							<Text style={[styles.itemPrice, { color: theme.primary }]}>
								₦
								{(
									parseFloat(item.price) * parseInt(item.quantity, 10)
								).toLocaleString()}
							</Text>
						</View>
					))}
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							marginTop: 8,
						}}
					>
						<Text style={[{ fontWeight: 'bold' }, { color: theme.secondary }]}>
							Discount
						</Text>
						<Text style={[{ fontWeight: 'bold' }, { color: theme.secondary }]}>
							{order.discountAmount && order.discountAmount > 0
								? `-₦${order.discountAmount.toLocaleString()}`
								: '₦0'}
						</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={[styles.totalLabel, { color: theme.text }]}>
							Total Amount
						</Text>
						<Text style={[styles.totalAmount, { color: theme.primary }]}>
							₦{(order.totalAmount || 0).toLocaleString()}
						</Text>
					</View>
				</View>
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, { color: theme.text }]}>
						Payment Information
					</Text>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>
							Method
						</Text>
						<Text style={[styles.infoValue, { color: theme.text }]}>
							{order.paymentMethod === 'cash_on_delivery'
								? 'Cash on Delivery'
								: (order.paymentMethod || 'card').charAt(0).toUpperCase() +
								  (order.paymentMethod || 'card').slice(1)}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>
							Status
						</Text>
						<Text style={[styles.infoValue, { color: theme.secondary }]}>
							{(order.paymentStatus || 'pending').charAt(0).toUpperCase() +
								(order.paymentStatus || 'pending').slice(1)}
						</Text>
					</View>
					{order.paymentReference && (
						<View style={styles.infoRow}>
							<Text style={[styles.infoLabel, { color: theme.text }]}>
								Reference
							</Text>
							<Text style={[styles.infoValue, { color: theme.text }]}>
								{order.paymentReference}
							</Text>
						</View>
					)}
				</View>
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, { color: theme.text }]}>
						Customer Information
					</Text>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>Name</Text>
						<Text style={[styles.infoValue, { color: theme.text }]}>
							{order.customerName}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>Phone</Text>
						<Text style={[styles.infoValue, { color: theme.text }]}>
							{order.customerPhone}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>Email</Text>
						<Text style={[styles.infoValue, { color: theme.text }]}>
							{order.customerEmail}
						</Text>
					</View>
				</View>

				<Pressable
					onPress={() =>
						navigation.navigate('Ratings', {
							orderId: order.id,
							// For restaurant orders
							restaurantId: order.restaurantId,
							restaurantName: order.restaurantName,
							// For store orders
							storeId: order.storeId,
							storeName: order.storeName,
							// Agent information
							agentId: order.modifiedBy,
							agentName: agent?.name || 'Delivery Agent',
							// Determine the type of order
							orderType: order.restaurantId ? 'restaurant' : 'store',
						})
					}
					style={styles.rateButton}
				>
					<Text style={styles.rateButtonText}>Rate Your Experience</Text>
				</Pressable>
				{order.status === 'Delivered' && (
					<Pressable
						style={[styles.cancelButton, { backgroundColor: theme.primary }]}
						onPress={async () => {
							// Repeat Order: Add all items back to cart
							if (!order || !order.items) return;
							if (order.restaurantId) {
								for (const item of order.items) {
									await addToCart(order.restaurantId, {
										id: item.id,
										name: item.name,
										price: item.price,
										quantity: item.quantity,
										imageUrl: item.imageUrl || null,
									});
								}
								navigation.navigate('CartDetails', {
									restaurantId: order.restaurantId,
									restaurantName: order.restaurantName || '',
								});
							} else if (order.storeId) {
								// For store orders, navigate to EMartCartDetails
								navigation.navigate('EMartCartDetails', {
									storeId: order.storeId,
									cartItems: order.items,
								});
							}
						}}
					>
						<Text style={styles.cancelButtonText}>Repeat Order</Text>
					</Pressable>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		...Platform.select({
			ios: {
				marginTop: 0,
			},
			android: {
				marginTop: 40,
			},
		}),
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		backgroundColor: 'white',
		borderRadius: 4,
		padding: 16,
		marginBottom: 16,
	},
	orderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	orderId: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	statusBadge: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	statusText: {
		color: 'white',
		fontSize: 14,
		fontWeight: 'bold',
	},
	dateText: {
		fontSize: 14,
		color: '#666',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 12,
	},
	// Agent section styles
	agentContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	agentImage: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	agentPlaceholder: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: '#F0F0F0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	agentInfo: {
		flex: 1,
	},
	agentName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	agentPhone: {
		fontSize: 14,
		marginBottom: 4,
	},
	agentRating: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	ratingText: {
		marginLeft: 4,
		fontSize: 14,
	},
	deliveryCount: {
		marginLeft: 8,
		fontSize: 14,
	},
	noAgentText: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	// Item styles
	itemRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 14,
		color: '#0B3948',
	},
	itemQuantity: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
	},
	itemPrice: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
	},
	totalLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	infoLabel: {
		fontSize: 14,
		color: '#666',
	},
	infoValue: {
		fontSize: 14,
		color: '#0B3948',
		fontWeight: '500',
	},
	cancelButton: {
		backgroundColor: '#F44336',
		borderRadius: 4,
		padding: 16,
		alignItems: 'center',
		marginBottom: 24,
	},
	rateButton: {
		backgroundColor: '#00b2ca',
		borderRadius: 4,
		padding: 16,
		alignItems: 'center',
		marginBottom: 10,
	},
	rateButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	cancelButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFF0EB',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFF0EB',
	},
	errorText: {
		fontSize: 16,
		color: '#F44336',
	},
});
