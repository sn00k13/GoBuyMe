import React, { useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	TextInput,
	Alert,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useStoreCart } from '../app/StoreCartContext';
import { useTheme } from '../../utils/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

function EMartCartDetails({ navigation, route }) {
	// Provide default storeId if not passed in route params
	const storeId = route?.params?.storeId || 'J3GO05mnhnoccDG9Bchc';
	const initialCartItems = route?.params?.cartItems || [];
	const { getCart, updateCart, removeFromCart, updateCartItemQuantity } =
		useStoreCart();
	// Remove local cartItemsState; always use context
	// const [cartItemsState, setCartItemsState] = React.useState(initialCartItems);
	const [discountCode, setDiscountCode] = React.useState('');
	const [discountMessage, setDiscountMessage] = React.useState('');
	const [discountError, setDiscountError] = React.useState('');
	const [appliedDiscountCode, setAppliedDiscountCode] = React.useState('');
	const { theme, mode, setMode } = useTheme();

	// Sync with global cart state when component mounts
	useEffect(() => {
		const globalCart = getCart(storeId);
		if (
			(!globalCart || globalCart.length === 0) &&
			initialCartItems.length > 0
		) {
			// If we have initial cart items but no global cart, update global cart
			updateCart(storeId, initialCartItems);
		}
	}, [storeId, initialCartItems]);

	const cartItems = getCart(storeId) || [];
	const total = cartItems.reduce(
		(sum, item) =>
			sum + parseFloat(item?.price || 0) * (parseInt(item?.quantity, 10) || 0),
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
		removeFromCart(storeId, index);
		const updatedCart = getCart(storeId) || [];
		if (updatedCart.length === 0) {
			Alert.alert('Cart Empty', 'Your cart is now empty. Continue shopping?', [
				{
					text: 'Yes',
					onPress: () => navigation.goBack(),
				},
				{
					text: 'No',
					style: 'cancel',
				},
			]);
		}
	};

	const handleCheckout = () => {
		if (!cartItems || cartItems.length === 0) {
			Alert.alert(
				'Empty Cart',
				'Please add items to your cart before proceeding to checkout.'
			);
			return;
		}

		// Make sure the global cart is updated before proceeding
		updateCart(storeId, cartItems);

		const discountApplied = appliedDiscountCode === 'EMART10';
		const discountValue = discountApplied ? total - getDiscountedTotal() : 0;

		navigation.navigate('Confirmation', {
			cartItems: cartItems,
			totalAmount: getDiscountedTotal(),
			originalTotal: total,
			discountApplied,
			discountValue,
			storeId,
		});
	};

	const renderCartItem = ({ item, index }) => (
		<View style={[styles.cartItem, { backgroundColor: theme.cards }]}>
			<Image
				source={
					item.imgUrl
						? { uri: item.imgUrl }
						: require('../../assets/placeholder.jpg')
				}
				style={styles.cartImage}
			/>
			<View style={styles.cartDetails}>
				<Text style={[styles.cartName, { color: theme.text }]}>
					{item.name}
				</Text>
				<Text style={[styles.cartSize, { color: theme.text }]}>
					{item.size}
				</Text>
				<Text style={[styles.cartPrice, { color: theme.primary }]}>
					₦{item.price} x {Number(item.quantity)}
				</Text>
			</View>
			<View style={styles.delete}>
				<Pressable onPress={() => handleRemoveFromCart(index)}>
					<Text style={[styles.deleteText, { color: theme.secondary }]}>
						Remove from cart
					</Text>
				</Pressable>
				<View
					style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
				>
					<Pressable
						onPress={() =>
							updateCartItemQuantity(
								storeId,
								item.id,
								Math.max(1, Number(item.quantity) - 1)
							)
						}
						style={{
							width: 28,
							height: 28,
							borderRadius: 16,
							backgroundColor: '#F0F0F0',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 8,
						}}
					>
						<Text
							style={{ fontSize: 18, color: '#FF521B', fontWeight: 'bold' }}
						>
							-
						</Text>
					</Pressable>
					<Text
						style={{ fontSize: 16, fontWeight: 'semi-bold', marginHorizontal: 8 }}
					>
						{Number(item.quantity)}
					</Text>
					<Pressable
						onPress={() =>
							updateCartItemQuantity(
								storeId,
								item.id,
								Number(item.quantity) + 1
							)
						}
						style={{
							width: 28,
							height: 28,
							borderRadius: 16,
							backgroundColor: '#F0F0F0',
							alignItems: 'center',
							justifyContent: 'center',
							marginLeft: 8,
						}}
					>
						<Text
							style={{ fontSize: 18, color: '#FF521B', fontWeight: 'bold' }}
						>
							+
						</Text>
					</Pressable>
				</View>
				<Text style={styles.cartItemTotal}>
					₦
					{(
						parseFloat(item?.price || 0) * (parseInt(item?.quantity, 10) || 0)
					).toLocaleString()}
				</Text>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={[styles.container, { backgroundColor: theme.background }]}>
				<View style={styles.header}>
					<Pressable onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back" size={24} color={theme.text} />
					</Pressable>
					<Text style={[styles.locationText, { color: theme.primary }]}>
						My Basket
					</Text>
					<View></View>
				</View>
				<FlatList
					data={cartItems}
					renderItem={renderCartItem}
					keyExtractor={(item) => item.id?.toString()}
					contentContainerStyle={{ paddingBottom: 24 }}
					ListEmptyComponent={
						<Text style={{ textAlign: 'center', color: '#aaa', marginTop: 24 }}>
							Your cart is empty.
						</Text>
					}
				/>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
					style={{ marginHorizontal: 16 }}
				>
					<View>
						<Text
							style={[{ fontSize: 15, marginBottom: 10, marginTop: 10 }, { color: theme.text }]}
						>
							Discount Code
						</Text>
						<TextInput
							style={[
								{
									borderRadius: 4,
									// borderWidth: 1,
									borderColor: '#F0F0F0',
									padding: 16,
									backgroundColor: '#fff',
									fontSize: 15,
									elevation: 1
								},
								{ borderColor: theme.accent },
							]}
							placeholder="Enter discount code."
							value={discountCode}
							onChangeText={setDiscountCode}
							autoCapitalize="characters"
						/>
						{discountMessage ? (
							<Text style={{ color: '#21A179', marginTop: 10 }}>
								{discountMessage}
							</Text>
						) : null}
						{discountError ? (
							<Text style={{ color: '#E14E1F', marginTop: 10 }}>
								{discountError}
							</Text>
						) : null}
						<Pressable
							style={{
								backgroundColor: '#FF521B',
								borderRadius: 4,
								paddingVertical: 16,
								alignItems: 'center',
								marginTop: 8,
							}}
							onPress={handleApplyDiscount}
						>
							<Text style={{ color: '#fff' }}>Apply</Text>
						</Pressable>
					</View>
				</KeyboardAvoidingView>
				<View style={styles.summary}>
					<Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
					<Text style={styles.totalValue}>
						₦
						{getDiscountedTotal().toLocaleString(undefined, {
							maximumFractionDigits: 2,
						})}
					</Text>
				</View>

				<Pressable
					style={styles.checkoutButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.checkoutText}>Continue Shopping</Text>
				</Pressable>
				<Pressable style={styles.checkoutButton2} onPress={handleCheckout}>
					<Text style={styles.checkoutText}>Proceed to Checkout</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	cartItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 12,
		marginHorizontal: 16,
		marginTop: 10,
		elevation: 1,
		paddingVertical: 16,
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
		marginTop: 10,
	},
	summary: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
		paddingHorizontal: 16,
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
		paddingVertical: 16,
		paddingHorizontal: 8,
		alignItems: 'center',
		marginTop: 12,
		marginHorizontal: 16,
	},
	checkoutButton2: {
		backgroundColor: '#21A179',
		borderRadius: 4,
		paddingVertical: 16,
		paddingHorizontal: 8,
		alignItems: 'center',
		marginTop: 12,
		marginHorizontal: 16,
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
