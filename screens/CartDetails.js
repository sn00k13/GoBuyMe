import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCart } from './CartContext';

export default function CartDetails({ route, navigation }) {
	const { restaurantId, cartTotal } = route.params;
	const { restaurantCarts } = useCart();
	const cart = restaurantCarts[restaurantId] || { total: 0, items: [] };

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Your Cart</Text>
			{cart.items.map((item) => (
				<View key={item.id} style={styles.item}>
					<Text style={styles.itemName}>{item.name}</Text>
					<Text style={styles.itemPrice}>₦{item.price.toFixed(2)}</Text>
					{item.extras && item.extras.length > 0 && (
						<View style={styles.extrasContainer}>
							<Text style={styles.extrasTitle}>Extras:</Text>
							{item.extras.map((extra) => (
								<Text key={extra.id} style={styles.extraItem}>
									- {extra.name}: ₦{extra.price.toFixed(2)}
								</Text>
							))}
						</View>
					)}
				</View>
			))}
			<Pressable
				style={styles.checkoutButton}
				onPress={() => navigation.navigate('Address')}
			>
				<Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
			</Pressable>
			<Text style={styles.total}>Total: ₦{cartTotal.toFixed(2)}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFF9F7',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 20,
	},
	item: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#EDEDF4',
	},
	itemName: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	itemPrice: {
		fontSize: 16,
		color: '#2A324B',
	},
	extrasContainer: {
		marginTop: 8,
	},
	extrasTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	extraItem: {
		fontSize: 14,
		color: '#2A324B',
	},
	checkoutButton: {
		padding: 10,
		backgroundColor: '#FF521B',
		borderRadius: 5,
		marginTop: 20,
	},
	checkoutButtonText: {
		color: '#fff',
		textAlign: 'center',
		fontSize: 16,
	},
	total: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
		marginTop: 20,
	},
});
