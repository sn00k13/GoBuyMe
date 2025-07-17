import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	Pressable,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../app/CartContext';
import { useFocusEffect } from '@react-navigation/native';

export default function RestaurantMenuItemScreen({ route, navigation }) {
	const { menuItem, restaurantId, restaurantName } = route.params;
	const [quantity, setQuantity] = useState(1);
	const { cart, addToCart, getCartTotal, getCartItemCount } = useCart();
	const [cartTotal, setCartTotal] = useState(0);
	const [cartItemCount, setCartItemCount] = useState(0);

	useFocusEffect(
		React.useCallback(() => {
			setCartTotal(getCartTotal(restaurantId));
			setCartItemCount(getCartItemCount(restaurantId));
		}, [cart, restaurantId])
	);

	const handleAddToCart = () => {
		const meal = {
			id: menuItem.id,
			name: menuItem.name,
			price: parseFloat(menuItem.price),
			quantity: quantity,
			imageUrl: menuItem.imageUrl || null,
		};
		addToCart(restaurantId, meal);
		// No need to manually update cart count/total here
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.headerText}>{menuItem.name}</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView style={styles.scrollView}>
				{/* Item Image */}
				<Image
					source={
						menuItem.imageUrl
							? { uri: menuItem.imageUrl }
							: require('../../assets/placeholder.jpg')
					}
					style={styles.itemImage}
				/>

				{/* Item Details */}
				<View style={styles.detailsContainer}>
					<Text style={styles.itemName}>{menuItem.name}</Text>
					<Text style={styles.itemDescription}>{menuItem.description}</Text>
					<Text style={styles.itemPrice}>₦{menuItem.price}</Text>

					{/* Quantity Selector */}
					<View style={styles.quantityContainer}>
						<Text style={styles.quantityLabel}>Quantity</Text>
						<View style={styles.quantityControls}>
							<Pressable
								style={styles.quantityButton}
								onPress={() => quantity > 1 && setQuantity(quantity - 1)}
							>
								<MaterialIcons name="remove" size={24} color="#FF521B" />
							</Pressable>
							<Text style={styles.quantityText}>{quantity}</Text>
							<Pressable
								style={styles.quantityButton}
								onPress={() => setQuantity(quantity + 1)}
							>
								<MaterialIcons name="add" size={24} color="#FF521B" />
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Cart FAB */}
			<Pressable
				style={styles.cartButtonFab}
				onPress={() =>
					navigation.navigate('Cart', { restaurantId, restaurantName })
				}
			>
				<MaterialIcons name="shopping-cart" size={28} color="#fff" />
				{cartItemCount > 0 && (
					<View style={styles.cartCounter}>
						<Text style={styles.cartCounterText}>{cartItemCount}</Text>
					</View>
				)}
			</Pressable>

			{/* Bottom Action Bar */}
			<View style={styles.bottomBar}>
				<View style={styles.totalContainer}>
					<Text style={styles.totalLabel}>Total</Text>
					<Text style={styles.totalAmount}>
						₦{(menuItem.price * quantity).toFixed(2)}
					</Text>
				</View>
				<Pressable style={styles.addButton} onPress={handleAddToCart}>
					<Text style={styles.addButtonText}>Add to Cart</Text>
				</Pressable>
			</View>
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
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#fff',
		elevation: 2,
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	scrollView: {
		flex: 1,
	},
	itemImage: {
		width: '100%',
		height: 200,
		resizeMode: 'contain',
		backgroundColor: '#FFF0EB',
	},
	detailsContainer: {
		padding: 16,
		backgroundColor: 'white',
		flex: 1,
	},
	itemName: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 8,
	},
	itemDescription: {
		fontSize: 15,
		color: '#666',
		marginBottom: 16,
	},
	itemPrice: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
	},
	quantityContainer: {
		// marginBottom: 24,
	},
	quantityLabel: {
		fontSize: 16,
		color: '#0B3948',
		marginBottom: 8,
	},
	quantityControls: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quantityButton: {
		width: 30,
		height: 30,
		borderRadius: 20,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	quantityText: {
		fontSize: 18,
		fontWeight: 'bold',
		marginHorizontal: 16,
		color: '#0B3948',
	},
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#fff',
		elevation: 4,
	},
	totalContainer: {
		flex: 1,
	},
	totalLabel: {
		fontSize: 14,
		color: '#666',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	addButton: {
		backgroundColor: '#FF521B',
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 4,
		marginLeft: 16,
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
	},
	cartButtonFab: {
		position: 'absolute',
		bottom: 100, // Positioned above the bottom bar
		right: 24,
		backgroundColor: '#FF521B',
		borderRadius: 32,
		width: 56,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	cartCounter: {
		position: 'absolute',
		top: 6,
		right: 6,
		backgroundColor: '#fff',
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	cartCounterText: {
		color: '#FF521B',
		fontWeight: 'bold',
		fontSize: 13,
	},
});
