import React, { useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Easing,
	SafeAreaView,
	Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export default function OrderConfirmation({ navigation, route }) {
	const {
		orderId = '',
		totalAmount = 0,
		isPendingTransfer = false,
	} = route.params || {};
	const checkmarkScale = new Animated.Value(0);
	const checkmarkOpacity = new Animated.Value(0);
	const { theme, mode, setMode } = useTheme();

	useEffect(() => {
		// Animate the checkmark
		Animated.parallel([
			Animated.timing(checkmarkScale, {
				toValue: 1,
				duration: 500,
				easing: Easing.elastic(1),
				useNativeDriver: true,
			}),
			Animated.timing(checkmarkOpacity, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const handleViewOrder = () => {
		navigation.navigate('OrderDetails', { orderId });
	};

	const handleContinueShopping = () => {
		navigation.reset({
			index: 0,
			routes: [{ name: 'VendorList' }],
		});
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFF0EB' }}>
			<View style={[styles.content, { borderColor: theme.border }]}>
				<View style={styles.checkmarkContainer}>
					<Animated.View
						style={[
							styles.checkmarkCircle,
							{
								transform: [{ scale: checkmarkScale }],
								opacity: checkmarkOpacity,
								backgroundColor: isPendingTransfer ? '#FF9800' : '#4CAF50',
							},
						]}
					>
						<MaterialIcons
							name={isPendingTransfer ? 'access-time' : 'check'}
							size={48}
							color="white"
						/>
					</Animated.View>
				</View>

				<Text style={[styles.title, { color: theme.text }]}>
					{isPendingTransfer ? 'Transfer Initiated!' : 'Order Confirmed!'}
				</Text>
				<Text style={[styles.message, { color: theme.text }]}>
					{isPendingTransfer
						? 'Please complete the bank transfer using the provided account details. Your order will be processed once payment is confirmed.'
						: 'Thank you for your purchase. Your order has been successfully placed.'}
				</Text>

				<View style={[styles.orderInfo, { backgroundColor: theme.cards }]}>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>
							Order ID
						</Text>
						<Text style={[styles.infoValue, { color: theme.primary }]}>
							#{(orderId || '').slice(-6)}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={[styles.infoLabel, { color: theme.text }]}>
							Amount {isPendingTransfer ? 'to Pay' : 'Paid'}
						</Text>
						<Text style={[styles.infoValue, { color: theme.primary }]}>
							₦{(totalAmount || 0).toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={styles.divider} />

				<Text style={[styles.statusMessage, { color: theme.text }]}>
					{isPendingTransfer
						? 'You will receive an email confirmation once your payment is confirmed. This usually takes 5-15 minutes.'
						: 'You will receive an email confirmation shortly with your order details.'}
				</Text>
			</View>

			<View
				style={[
					styles.footer,
					{ backgroundColor: theme.cards, borderTopColor: theme.border },
				]}
			>
				<TouchableOpacity
					style={[styles.button, styles.primaryButton]}
					onPress={handleViewOrder}
				>
					<Text style={styles.primaryButtonText}>View Order</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.secondaryButton]}
					onPress={handleContinueShopping}
				>
					<Text style={styles.secondaryButtonText}>Continue Shopping</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.bottomPad}></View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		padding: 24,
		paddingTop: 60,
	},
	checkmarkContainer: {
		marginBottom: 24,
	},
	checkmarkCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#4CAF50',
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 16,
	},
	bottomPad: {
		...Platform.select({
			ios: {
				paddingBottom: 0,
				// iOS specific styles
			  },
			android: {
				paddingBottom: 40,
				// Android specific styles
			  },
		  }),
	},
	message: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 32,
	},
	orderInfo: {
		backgroundColor: 'white',
		borderRadius: 4,
		padding: 16,
		width: '100%',
		marginBottom: 24,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	infoLabel: {
		fontSize: 14,
		color: '#666',
	},
	infoValue: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#0B3948',
	},
	divider: {
		height: 1,
		backgroundColor: '#E0E0E0',
		width: '100%',
		marginBottom: 24,
	},
	statusMessage: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginBottom: 32,
	},
	footer: {
		padding: 16,
		backgroundColor: 'white',
	},
	button: {
		padding: 16,
		borderRadius: 4,
		alignItems: 'center',
		marginBottom: 12,
	},
	primaryButton: {
		backgroundColor: '#FF521B',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	primaryButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	secondaryButtonText: {
		color: '#FF521B',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
