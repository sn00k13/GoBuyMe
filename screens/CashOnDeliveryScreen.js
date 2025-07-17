import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Alert,
	ScrollView,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

export default function CashOnDeliveryScreen({ navigation, route }) {
	const { cartItems, userData, totalAmount } = route.params;
	const auth = getAuth();
	const user = auth.currentUser;

	const handleConfirmOrder = async () => {
		try {
			// Create order in Firestore
			const orderRef = await addDoc(collection(db, 'orders'), {
				userId: user.uid,
				items: cartItems,
				totalAmount,
				paymentStatus: 'pending',
				paymentMethod: 'cash_on_delivery',
				customerName: userData.name,
				customerPhone: userData.phone,
				customerEmail: user.email,
				status: 'pending',
				createdAt: serverTimestamp(),
			});

			navigation.navigate('OrderConfirmation', {
				orderId: orderRef.id,
				amount: totalAmount,
			});
		} catch (error) {
			console.error('Error creating order:', error);
			Alert.alert(
				'Error',
				'There was an error creating your order. Please try again.'
			);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.headerText}>Cash on Delivery</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView style={styles.content}>
				<View style={styles.infoCard}>
					<MaterialIcons name="info" size={24} color="#FF521B" />
					<Text style={styles.infoText}>
						Please note that you will need to pay ₦
						{totalAmount?.toLocaleString()} in cash when your order is
						delivered.
					</Text>
				</View>

				<View style={styles.detailsCard}>
					<Text style={styles.detailsTitle}>Order Summary</Text>
					{cartItems.map((item, index) => (
						<View key={index} style={styles.itemRow}>
							<Text style={styles.itemName}>
								{item.name} x {item.quantity}
							</Text>
							<Text style={styles.itemPrice}>
								₦
								{(
									parseFloat(item.price) * parseInt(item.quantity, 10)
								).toLocaleString()}
							</Text>
						</View>
					))}
					<View style={styles.totalRow}>
						<Text style={styles.totalText}>Total Amount:</Text>
						<Text style={styles.totalAmount}>
							₦{totalAmount?.toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={styles.deliveryCard}>
					<Text style={styles.detailsTitle}>Delivery Information</Text>
					<Text style={styles.deliveryText}>Name: {userData.name}</Text>
					<Text style={styles.deliveryText}>Phone: {userData.phone}</Text>
					<Text style={styles.deliveryText}>Email: {user.email}</Text>
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<Pressable style={styles.confirmButton} onPress={handleConfirmOrder}>
					<Text style={styles.confirmButtonText}>Confirm Order</Text>
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
	content: {
		flex: 1,
		padding: 16,
	},
	infoCard: {
		backgroundColor: '#FFE5E5',
		borderRadius: 8,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	infoText: {
		flex: 1,
		marginLeft: 12,
		color: '#FF521B',
		fontSize: 14,
	},
	detailsCard: {
		backgroundColor: 'white',
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
	},
	detailsTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 12,
	},
	itemRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	itemName: {
		fontSize: 14,
		color: '#0B3948',
	},
	itemPrice: {
		fontSize: 14,
		color: '#0B3948',
		fontWeight: 'bold',
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
	},
	totalText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	totalAmount: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	deliveryCard: {
		backgroundColor: 'white',
		borderRadius: 8,
		padding: 16,
	},
	deliveryText: {
		fontSize: 14,
		color: '#0B3948',
		marginBottom: 8,
	},
	footer: {
		padding: 16,
		backgroundColor: 'white',
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
	},
	confirmButton: {
		backgroundColor: '#21A179',
		borderRadius: 8,
		paddingVertical: 12,
	},
	confirmButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
});
