import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	FlatList,
	Image,
} from 'react-native';
import { useCart } from './CartContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function CartDetails({ route, navigation }) {
	const { cart, getCartTotal, getCartItemCount, removeFromCart } = useCart();
	const { restaurantId, restaurantName } = route.params;
	const cartItems = cart[restaurantId]?.items || [];

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
						: require('../assets/placeholder.jpg')
				}
				style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
			/>
			<View style={{ flex: 1 }}>
				<Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
				<Text style={{ color: '#666' }}>
					₦{item.price} x {item.quantity}
				</Text>
			</View>
			<View style={{ alignItems: 'flex-end', gap: 8 }}>
				<Pressable onPress={() => removeFromCart(restaurantId, item.id)}>
					<Text style={{ color: '#E14E1F', marginTop: 6 }}>
						Remove from cart
					</Text>
				</Pressable>
				<Text style={{ fontWeight: 'bold', color: '#FF521B' }}>
					₦{(item.price * item.quantity).toLocaleString()}
				</Text>
			</View>
		</View>
	);

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
});
