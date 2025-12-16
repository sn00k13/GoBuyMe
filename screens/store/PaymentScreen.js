import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
	SafeAreaView,
	Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Paystack } from 'react-native-paystack-webview';
import {
	doc,
	setDoc,
	serverTimestamp,
	addDoc,
	collection,
	getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { useStoreCart } from '../app/StoreCartContext';
import { useTheme } from '../../utils/ThemeContext';
import { calculateCommission } from '../../services/paymentOrchestrationAPI';
import { updateDoc } from 'firebase/firestore';
import logger from '../../utils/logger';
import { PAYSTACK_PUBLIC_KEY_LIVE } from '@env';

export default function PaymentScreen({ navigation, route }) {
	const {
		cartItems = [],
		totalAmount = 0,
		userData,
		storeId,
		deliveryFee,
		discountApplied,
		discountValue,
		store,
	} = route.params || {};
	const [processing, setProcessing] = useState(false);
	const [selectedMethod, setSelectedMethod] = useState('card'); // 'card' or 'bank'
	const auth = getAuth();
	const { clearCart } = useStoreCart();
	const { theme, mode, setMode } = useTheme();
	const paystackWebViewRef = useRef();

	// Redirect to cart if no items
	React.useEffect(() => {
		if (!cartItems || cartItems.length === 0) {
			Alert.alert(
				'Empty Cart',
				'Your cart is empty. Please add items before proceeding to payment.',
				[{ text: 'OK', onPress: () => navigation.navigate('EMartCartDetails') }]
			);
			return;
		}

		if (!userData?.name || !userData?.phone) {
			Alert.alert(
				'Missing Information',
				'Please complete your profile with name and phone number before proceeding.',
				[{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
			);
			return;
		}
	}, [cartItems, userData]);

	const generateReference = () => {
		const timestamp = new Date().getTime();
		const random = Math.floor(Math.random() * 1000000);
		return `ref-${timestamp}-${random}`;
	};

	const handlePaymentSuccess = async (response) => {
		try {
			setProcessing(true);

			let storeDistrict = '';
			try {
				const storeRef = doc(db, 'stores', storeId);
				const storeSnap = await getDoc(storeRef);
				if (storeSnap.exists()) {
					const storeData = storeSnap.data();
					storeDistrict = storeData.address?.district || '';
				}
			} catch (e) {
				logger.warn('Could not fetch store district:', e);
			}

			// Build order data, only include storeId if defined
			const orderData = {
				userId: auth.currentUser.uid,
				items: cartItems,
				totalAmount,
				status: 'Pending',
				deliveryFee,
				paymentStatus: selectedMethod === 'bank' ? 'pending' : 'paid',
				paymentReference: response.transactionRef.reference,
				paymentMethod: selectedMethod,
				customerName: userData.name,
				customerPhone: userData.phone,
				customerEmail: userData.email,
				deliveryAddress: userData.address,
				dropOffLocation: userData.address.district,
				pickUpLocation: storeDistrict,
				createdAt: serverTimestamp(),
				discountApplied,
				discountValue,
				...(storeId ? { storeId } : {}),
				isStoreOrder: true,
			};

			// Remove any undefined fields (extra safety)
			Object.keys(orderData).forEach(
				(key) => orderData[key] === undefined && delete orderData[key]
			);

			// Create order document
			const orderRef = doc(db, 'orders', response.transactionRef.reference);
			await setDoc(orderRef, orderData);

			// Call VPS API to calculate commission (for store orders - no vendor payout)
			if (storeId) {
				try {
					// Validate required fields before making API call
					const orderValue = Math.round((totalAmount || 0) * 100);
					const deliveryFeeKobo = Math.round((deliveryFee || 0) * 100);
					const orderIdValue = response.transactionRef.reference;

					if (!orderIdValue) {
						throw new Error('Order ID is missing');
					}

					// Validate all required fields are present
					if (!orderIdValue) {
						logger.error('Cannot calculate commission: Order ID is missing');
					} else if (orderValue <= 0) {
						logger.warn(
							'Order value is 0 or invalid, skipping commission calculation'
						);
					} else if (!storeId) {
						logger.error('Cannot calculate commission: Store ID is missing');
					} else {
						// Log the values being sent for debugging
						logger.log('Calculating commission for store order:', {
							orderId: orderIdValue,
							orderValue,
							deliveryFee: deliveryFeeKobo,
							storeId,
						});

						const commissionResult = await calculateCommission({
							orderId: orderIdValue,
							orderValue: orderValue, // in kobo
							deliveryFee: deliveryFeeKobo, // in kobo
							storeId: storeId, // This is a store order
							// Don't pass vendorId or restaurantId - API service will handle it
							agentId: null, // Will be set when agent is assigned
						});

						// Update order with transaction ledger ID
						if (commissionResult?.transactionLedgerId) {
							await updateDoc(orderRef, {
								transactionLedgerId: commissionResult.transactionLedgerId,
							});
						}

						logger.log(
							'Commission calculated successfully (store order):',
							commissionResult
						);
					}
				} catch (commissionError) {
					logger.error('Commission calculation failed:', commissionError);
					// Log detailed error information
					if (commissionError.message) {
						logger.error('Error message:', commissionError.message);
					}
					// Log error but don't block order creation
					// The order is already created, commission can be calculated later if needed
				}
			}

			// Create notification for the user
			await addDoc(collection(db, 'notifications'), {
				userId: auth.currentUser.uid,
				title: 'Order Processing',
				body: 'Order successfully placed. Kindly wait while we process your orders.',
				timestamp: serverTimestamp(),
			});

			// Clear cart only if we have a valid store identifier
			if (storeId) {
				clearCart(storeId);
			}

			// Navigate to success screen with appropriate message
			navigation.replace('OrderConfirmation', {
				orderId: response.transactionRef.reference,
				totalAmount,
				isPendingTransfer: selectedMethod === 'bank',
			});
		} catch (error) {
			logger.error('Error processing payment:', error);
			Alert.alert(
				'Error',
				'There was an error processing your payment. Please try again.'
			);
		} finally {
			setProcessing(false);
		}
	};

	if (processing) {
		return (
			<View
				style={[styles.loadingContainer, { backgroundColor: theme.background }]}
			>
				<ActivityIndicator size="large" color="#FF521B" />
				<Text style={[styles.loadingText, { color: theme.text }]}>
					Processing your payment...
				</Text>
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
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.primary }]}>
					Payment
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView style={styles.content}>
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, { color: theme.primary }]}>
						Order Summary
					</Text>
					{cartItems.map((item, index) => (
						<View key={index} style={styles.orderItem}>
							<Text style={[styles.itemName, { color: theme.text }]}>
								{item.name} x {item.quantity}
							</Text>
							<Text style={[styles.itemPrice, { color: theme.primary }]}>
								₦
								{(
									parseFloat(item.price) * parseInt(item.quantity)
								).toLocaleString()}
							</Text>
						</View>
					))}
					<View style={styles.orderItem}>
						<Text style={[styles.itemName2, { color: theme.text }]}>
							Delivery Fee:
						</Text>
						<Text style={[styles.itemPrice2, { color: theme.primary }]}>
							₦{deliveryFee?.toLocaleString() || '0'}
						</Text>
					</View>
					{discountApplied && discountValue > 0 && (
						<View style={styles.orderItem}>
							<Text style={[styles.itemName, { color: theme.text }]}>
								Discount:
							</Text>
							<Text style={[styles.itemPrice, { color: '#4CAF50' }]}>
								-₦{discountValue.toLocaleString()}
							</Text>
						</View>
					)}
					<View style={styles.totalRow}>
						<Text style={[styles.totalLabel, { color: theme.text }]}>
							Total Amount:
						</Text>
						<Text style={styles.totalAmount}>
							₦{totalAmount.toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, { color: theme.primary }]}>
						Payment Method
					</Text>
					<TouchableOpacity
						style={[
							styles.methodOption,
							selectedMethod === 'card' && styles.methodOptionSelected,
						]}
						onPress={() => setSelectedMethod('card')}
					>
						<MaterialIcons
							name="credit-card"
							size={24}
							color={selectedMethod === 'card' ? '#FF521B' : theme.accent}
						/>
						<View style={styles.methodTextContainer}>
							<Text
								style={[
									styles.methodTitle,
									selectedMethod === 'card' && styles.methodTitleSelected,
									{
										color: selectedMethod === 'card' ? '#FF521B' : theme.accent,
									},
								]}
							>
								Card Payment
							</Text>
							<Text
								style={[
									styles.methodDescription,
									{
										color: selectedMethod === 'card' ? '#FF521B' : theme.accent,
									},
								]}
							>
								Pay with your debit/credit card
							</Text>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.methodOption,
							selectedMethod === 'bank' && styles.methodOptionSelected,
						]}
						onPress={() => setSelectedMethod('bank')}
					>
						<MaterialIcons
							name="account-balance"
							size={24}
							color={selectedMethod === 'bank' ? '#FF521B' : theme.accent}
						/>
						<View style={styles.methodTextContainer}>
							<Text
								style={[
									styles.methodTitle,
									selectedMethod === 'bank' && styles.methodTitleSelected,
									{
										color: selectedMethod === 'bank' ? '#FF521B' : theme.accent,
									},
								]}
							>
								Bank Transfer
							</Text>
							<Text
								style={[
									styles.methodDescription,
									{
										color: selectedMethod === 'bank' ? '#FF521B' : theme.accent,
									},
								]}
							>
								Pay via bank transfer
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				<Paystack
					paystackKey={PAYSTACK_PUBLIC_KEY_LIVE}
					amount={totalAmount}
					billingEmail={userData.email}
					activityIndicatorColor="#FF521B"
					onCancel={(e) => {
						Alert.alert('Payment Cancelled', 'You have cancelled the payment.');
					}}
					onSuccess={handlePaymentSuccess}
					autoStart={false}
					ref={paystackWebViewRef}
					billingName={userData.name}
					billingMobile={userData.phone}
					currency="NGN"
					channels={selectedMethod === 'bank' ? ['bank_transfer'] : ['card']}
				/>

				<TouchableOpacity
					style={styles.payButton}
					onPress={() => paystackWebViewRef.current?.startTransaction()}
				>
					<Text style={styles.payButtonText}>
						Pay ₦{totalAmount.toLocaleString()} Now
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
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
				// iOS specific styles
			},
			android: {
				marginTop: 40,
				// Android specific styles
			},
		}),
	},
	headerTitle: {
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
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'semi-bold',
		color: '#FF521B',
		marginBottom: 16,
	},
	orderItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	itemName: {
		fontSize: 16,
		color: '#2A324B',
		flex: 1,
	},
	itemName2: {
		fontSize: 16,
		color: '#2A324B',
		flex: 1,
		fontWeight: '600',
	},
	itemPrice: {
		fontSize: 16,
		color: '#2A324B',
		fontWeight: '500',
	},
	itemPrice2: {
		fontSize: 16,
		color: '#2A324B',
		fontWeight: '600',
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	totalLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	methodOption: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		borderRadius: 4,
		marginBottom: 12,
	},
	methodOptionSelected: {
		borderColor: '#FF521B',
		backgroundColor: '#FFF0EB',
	},
	methodTextContainer: {
		marginLeft: 16,
	},
	methodTitle: {
		fontSize: 16,
		// fontWeight: 'bold',
		color: '#2A324B',
		marginBottom: 4,
	},
	methodTitleSelected: {
		color: '#FF521B',
	},
	methodDescription: {
		fontSize: 14,
		color: '#666',
	},
	payButton: {
		backgroundColor: '#FF521B',
		borderRadius: 4,
		padding: 16,
		alignItems: 'center',
		alignItems: 'center',
		marginTop: 24,
		marginBottom: 24,
	},
	payButtonText: {
		color: 'white',
		fontSize: 16,
		// fontWeight: 'bold',
	},
});
