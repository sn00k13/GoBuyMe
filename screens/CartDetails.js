import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCart } from './CartContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function CartDetails({ route, navigation }) {
	const { restaurantId } = route.params || {};
	const { restaurantCarts } = useCart();
	const cart = restaurantCarts[restaurantId] || { total: 0, items: [] };

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.headerText}>My Cart</Text>
				<View style={{ width: 24 }} />
			</View>

			{cart.items.length > 0 ? (
				<>
					{cart.items.map((item, index) => (
						<View key={`${item.id}-${index}`} style={styles.itemCard}>
							<View style={styles.itemInfo}>
								<Text style={styles.itemName}>{item.name}</Text>
								<Text style={styles.itemPrice}>₦{(item.price || 0).toFixed(2)}</Text>
							</View>

							{item.extras && item.extras.length > 0 && (
								<View style={styles.extrasContainer}>
									<Text style={styles.extrasTitle}>Extras:</Text>
									{item.extras.map((extra, idx) => (
										<Text key={`${extra.id}-${idx}`} style={styles.extraItem}>
											- {extra.name}: ₦{(extra.price || 0).toFixed(2)}
										</Text>
									))}
								</View>
							)}

							{item.proteins && item.proteins.length > 0 && (
								<View style={styles.extrasContainer}>
									<Text style={styles.extrasTitle}>Proteins:</Text>
									{item.proteins.map((protein, idx) => (
										<Text key={`${protein.id}-${idx}`} style={styles.extraItem}>
											- {protein.name}: ₦{(protein.price || 0).toFixed(2)}
										</Text>
									))}
								</View>
							)}
						</View>
					))}

					<View style={styles.totalContainer}>
						<Text style={styles.totalLabel}>Total:</Text>
						<Text style={styles.totalAmount}>₦{(cart.total || 0).toFixed(2)}</Text>
					</View>

					<Pressable
						style={styles.checkoutButton}
						onPress={() => navigation.navigate('Address')}
					>
						<Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
					</Pressable>
				</>
			) : (
				<View style={styles.emptyContainer}>
					<MaterialIcons name="shopping-cart" size={64} color="#ccc" />
					<Text style={styles.emptyText}>Your cart is empty</Text>
					<Pressable
						style={styles.continueButton}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.continueButtonText}>Continue Shopping</Text>
					</Pressable>
				</View>
			)}
		</View>
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
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
		marginTop: 40,
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	itemCard: {
		backgroundColor: 'white',
		margin: 16,
		marginBottom: 0,
		padding: 16,
		borderRadius: 8,
		elevation: 2,
	},
	itemInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	itemName: {
		fontSize: 16,
		fontWeight: '500',
		color: '#2A324B',
		flex: 1,
	},
	itemPrice: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF521B',
		marginLeft: 16,
	},
	extrasContainer: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	extrasTitle: {
		fontSize: 14,
		fontWeight: '500',
		color: '#2A324B',
		marginBottom: 4,
	},
	extraItem: {
		fontSize: 14,
		color: '#666',
		marginLeft: 8,
	},
	totalContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'white',
		margin: 16,
		padding: 16,
		borderRadius: 8,
		elevation: 2,
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	checkoutButton: {
		backgroundColor: '#FF521B',
		margin: 16,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	checkoutButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
	},
	emptyText: {
		fontSize: 18,
		color: '#666',
		marginTop: 16,
		marginBottom: 32,
	},
	continueButton: {
		backgroundColor: '#FF521B',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	continueButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
	},
});
