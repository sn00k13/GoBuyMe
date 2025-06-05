import React, { useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	TextInput,
} from 'react-native';
import { useStoreCart } from './StoreCartContext';

function EMartCartDetails({ navigation, route }) {
	const { storeId, cartItems: initialCartItems } = route.params;
	const { getCart, setCart, removeFromCart } = useStoreCart();
	const [cartItemsState, setCartItemsState] = React.useState(initialCartItems);
	const [discountCode, setDiscountCode] = React.useState('');
	const [discountMessage, setDiscountMessage] = React.useState('');
	const [discountError, setDiscountError] = React.useState('');
	const [appliedDiscountCode, setAppliedDiscountCode] = React.useState('');

	// Sync with global cart state when component mounts
	useEffect(() => {
		const globalCart = getCart(storeId);
		if (globalCart.length > 0) {
			setCartItemsState(globalCart);
		}
	}, [storeId]);

	const total = cartItemsState.reduce(
		(sum, item) =>
			sum + parseFloat(item.price) * (parseInt(item.quantity, 10) || 0),
		0
	);

	// Calculates 10% discount if discount code is applied
	const getDiscountedTotal = () => {
		if (appliedDiscountCode === 'EMART10') {
			return total * 0.9;
		}
		return total;
	};

	const handleApplyDiscount = () => {
		const code = discountCode.trim().toUpperCase();
		if (code === 'EMART10') {
			setDiscountMessage('10% discount applied!');
			setDiscountError('');
			setAppliedDiscountCode(code);
		} else if (code.length > 0) {
			setDiscountMessage('');
			setDiscountError('Invalid or expired coupon code.');
			setAppliedDiscountCode('');
		} else {
			setDiscountMessage('');
			setDiscountError('');
			setAppliedDiscountCode('');
		}
	};

	const handleRemoveFromCart = (index) => {
		// Update local state
		const newCartItems = cartItemsState.filter((_, i) => i !== index);
		setCartItemsState(newCartItems);
		
		// Update global state
		removeFromCart(storeId, index);
	};

	const renderCartItem = ({ item, index }) => (
		<View style={styles.cartItem}>
			<Image
				source={
					item.imgUrl
						? { uri: item.imgUrl }
						: require('../assets/placeholder.jpg')
				}
				style={styles.cartImage}
			/>
			<View style={styles.cartDetails}>
				<Text style={styles.cartName}>{item.name}</Text>
				<Text style={styles.cartSize}>{item.size}</Text>
				<Text style={styles.cartPrice}>
					₦{item.price} x {item.quantity}
				</Text>
			</View>
			<View style={styles.delete}>
				<Pressable onPress={() => handleRemoveFromCart(index)}>
					<Text style={styles.deleteText}>Remove from cart</Text>
				</Pressable>
				<Text style={styles.cartItemTotal}>
					₦
					{(
						parseFloat(item.price) * (parseInt(item.quantity, 10) || 0)
					).toLocaleString()}
				</Text>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.header}>My Basket</Text>
			<FlatList
				data={cartItemsState}
				renderItem={renderCartItem}
				keyExtractor={(item, idx) => item.name + idx}
				contentContainerStyle={{ paddingBottom: 24 }}
				ListEmptyComponent={
					<Text style={{ textAlign: 'center', color: '#aaa', marginTop: 24 }}>
						Your cart is empty.
					</Text>
				}
			/>
			<View style={{ marginVertical: 16 }}>
				<Text style={{ fontSize: 15, marginBottom: 6 }}>Discount Code</Text>
				<TextInput
					style={{
						borderWidth: 1,
						borderColor: '#FF521B',
						borderRadius: 4,
						padding: 8,
						backgroundColor: '#fff',
						fontSize: 15,
					}}
					placeholder="Enter discount code."
					value={discountCode}
					onChangeText={setDiscountCode}
					autoCapitalize="characters"
				/>
				{discountMessage ? (
					<Text style={{ color: '#21A179', marginTop: 6 }}>
						{discountMessage}
					</Text>
				) : null}
				{discountError ? (
					<Text style={{ color: '#E14E1F', marginTop: 6 }}>
						{discountError}
					</Text>
				) : null}
				<Pressable
					style={{
						backgroundColor: '#FF521B',
						borderRadius: 4,
						paddingVertical: 8,
						alignItems: 'center',
						marginTop: 8,
					}}
					onPress={handleApplyDiscount}
				>
					<Text style={{ color: '#fff' }}>Apply</Text>
				</Pressable>
			</View>
			<View style={styles.summary}>
				<Text style={styles.totalLabel}>Total:</Text>
				<Text style={styles.totalValue}>
					₦
					{getDiscountedTotal().toLocaleString(undefined, {
						maximumFractionDigits: 2,
					})}
				</Text>
			</View>
			<View>
				<Pressable
					style={styles.checkoutButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.checkoutText}>Continue Shopping</Text>
				</Pressable>
				<Pressable
					style={styles.checkoutButton2}
					onPress={() => navigation.navigate('Confirmation', { cartItems: cartItemsState })}
				>
					<Text style={styles.checkoutText}>Proceed to Checkout</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
		padding: 16,
	},
	header: {
		fontSize: 18,
		// fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
		textAlign: 'center',
		marginTop: 40,
	},
	cartItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 12,
		marginBottom: 10,
		elevation: 1,
	},
	cartImage: {
		width: 54,
		height: 54,
		borderRadius: 4,
		marginRight: 12,
		backgroundColor: '#F0F0F0',
	},
	cartDetails: {
		flex: 1,
	},
	cartName: {
		fontSize: 15,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	cartSize: {
		fontSize: 13,
		color: '#888',
		marginVertical: 2,
	},
	cartPrice: {
		fontSize: 13,
		color: '#FF521B',
	},
	cartItemTotal: {
		fontSize: 15,
		fontWeight: 'bold',
		color: '#FF521B',
		marginLeft: 10,
	},
	summary: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderColor: '#eee',
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	totalValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	checkoutButton: {
		backgroundColor: '#00b2ca',
		borderRadius: 4,
		paddingVertical: 8,
		paddingHorizontal: 8,
		alignItems: 'center',
		marginTop: 12,
	},
	checkoutButton2: {
		backgroundColor: '#21A179',
		borderRadius: 4,
		paddingVertical: 8,
		paddingHorizontal: 8,
		alignItems: 'center',
		marginTop: 12,
	},
	checkoutText: {
		color: '#fff',
		fontSize: 16,
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	delete: {
		height: 60,
		flexDirection: 'column',
		justifyContent: 'space-between',
		// backgroundColor: 'grey',
		alignItems: 'flex-end',
	},
	deleteText: {
		fontSize: 12,
	},
});

export default EMartCartDetails;
