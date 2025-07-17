import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	FlatList,
	Image,
	TextInput,
	Alert,
	SafeAreaView,
	KeyboardAvoidingView,
} from 'react-native';
import { useCart } from '../app/CartContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function CartDetails({ route, navigation }) {
	const { cart, getCartTotal, getCartItemCount, removeFromCart } = useCart();
	const { restaurantId, restaurantName } = route.params;
	const cartItems = cart[restaurantId]?.items || [];

	const [discountCode, setDiscountCode] = React.useState('');
	const [discountApplied, setDiscountApplied] = React.useState(false);
	const [discountError, setDiscountError] = React.useState('');

	const total = getCartTotal(restaurantId);
	const discountedTotal = discountApplied ? total * 0.9 : total; // 10% off for demo

	const handleApplyDiscount = () => {
		if (discountCode.trim().toUpperCase() === 'SAVE10') {
			setDiscountApplied(true);
			setDiscountError('');
		} else {
			setDiscountApplied(false);
			setDiscountError('Invalid or expired discount code.');
		}
	};

	const renderCartItem = ({ item }) => (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				padding: 12,
				backgroundColor: '#fff',
				marginBottom: 8,
				borderRadius: 8,
			}}
		>
			<Image
				source={
					item.imageUrl
						? { uri: item.imageUrl }
						: require('../../assets/placeholder.jpg')
				}
				style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
			/>
			<View style={{ flex: 1 }}>
				<Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0B3948' }}>
					{item.name}
				</Text>
				<Text style={{ color: '#666' }}>
					₦{item.price} x {item.quantity}
				</Text>
			</View>
			<View style={{ alignItems: 'flex-end', gap: 8 }}>
				<Pressable onPress={() => removeFromCart(restaurantId, item.id)}>
					<Text style={{ color: '#0B3948', marginTop: 6 }}>
						Remove from cart
					</Text>
				</Pressable>
				<Text style={{ fontWeight: 'bold', color: '#FF521B' }}>
					₦{(item.price * item.quantity).toLocaleString()}
				</Text>
			</View>
		</View>
	);

	const handleCheckout = () => {
		if (!cartItems || cartItems.length === 0) {
			Alert.alert(
				'Empty Cart',
				'Please add items to your cart before proceeding to checkout.'
			);
			return;
		}

		navigation.navigate('RestaurantConfirmation', {
			cartItems,
			totalAmount: discountedTotal, // pass the discounted total
			restaurantId,
			restaurantName,
			discountApplied, // pass this if you want to show a message
			discountAmount: total - discountedTotal, // pass the discount value if needed
		});
		console.log('RestaurantConfirmationScreen params:', route.params);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFF0EB' }}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<Pressable onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
					</Pressable>
					<Text style={styles.headerText}>My Cart - {restaurantName}</Text>
					<View style={{ width: 24 }} />
				</View>
				{/* Render FlatList here */}
				<FlatList
					data={cartItems}
					renderItem={renderCartItem}
					keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
					contentContainerStyle={{ padding: 16 }}
					ListEmptyComponent={
						<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
							Your cart is empty.
						</Text>
					}
				/>
				{/* Discount code section */}
				<KeyboardAvoidingView>
				<View style={{ padding: 16 }}>
					<Text style={{ fontSize: 15, marginBottom: 6 }}>Discount Code</Text>
					<View style={styles.discountSection}>
						<View>
							<TextInput
								style={styles.discountText}
								placeholder="Enter discount code"
								value={discountCode}
								onChangeText={setDiscountCode}
								autoCapitalize="characters"
							/>
						</View>
						{discountApplied && (
							<Text style={{ color: '#21A179', marginTop: 6 }}>
								Discount applied! 10% off.
							</Text>
						)}
						{discountError ? (
							<Text style={{ color: '#E14E1F', marginTop: 6 }}>
								{discountError}
							</Text>
						) : null}
						<Pressable style={styles.applyDiscount} onPress={handleApplyDiscount}>
							<Text style={styles.proceedCheckoutText}>Apply</Text>
						</Pressable>
					</View>
				</View>
				</KeyboardAvoidingView>
				{/* Total */}
				<View style={styles.orderTotal}>
					<Text style={styles.orderTotalText1}>Total:</Text>
					<Text style={styles.orderTotalText}>
						₦{discountedTotal.toLocaleString()}
					</Text>
				</View>
				<View style={styles.proceedCheckout}>
					<Pressable onPress={() => navigation.navigate('RestaurantMenuItem')}>
						<Text style={styles.proceedCheckoutText}>Continue Shopping</Text>
					</Pressable>
				</View>
				<View style={styles.proceedCheckout2}>
					<Pressable onPress={handleCheckout}>
						<Text style={styles.proceedCheckoutText}>Proceed to Checkout</Text>
					</Pressable>
				</View>
			</View>
			
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
		paddingBottom: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	orderTotal: {
		padding: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	proceedCheckout: {
		backgroundColor: '#00b2ca',
		borderRadius: 4,
		paddingVertical: 14,
		paddingHorizontal: 16,
		alignItems: 'center',
		margin: 16,
		fontSize: 16,
	},
	proceedCheckout2: {
		backgroundColor: '#21A179',
		borderRadius: 4,
		paddingVertical: 14,
		paddingHorizontal: 16,
		alignItems: 'center',
		marginHorizontal: 16,
		fontSize: 16,
	},
	proceedCheckoutText: {
		color: '#fff',
		fontSize: 16,
	},
	orderTotalText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	orderTotalText1: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#000',
	},
	discountText: {
		borderWidth: 1,
		borderColor: '#FF521B',
		borderRadius: 4,
		padding: 8,
		backgroundColor: '#fff',
		fontSize: 15,
	},
	discountSection: {
		flexDirection: 'column',
		gap: 4,
	},
	applyDiscount: {
		backgroundColor: '#FF521B',
		padding: 16,
		alignItems: 'center',
		borderRadius: 4,
		paddingVertical: 14,
		marginTop: 8,
	},
});
