import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	TextInput,
	FlatList,
	Modal,
	Alert,
	ActivityIndicator,
	SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../utils/ThemeContext';

export default function ConfirmationScreen({ navigation, route }) {
	const [addresses, setAddresses] = useState([]);
	const [showAddressesModal, setShowAddressesModal] = useState(false);
	const [showAddAddressModal, setShowAddAddressModal] = useState(false);
	const [defaultAddress, setDefaultAddress] = useState(null);
	const districts = [
		'Akwakuma',
		'Aladinma',
		'Amakaohia',
		'Douglas',
		'Ikenegbu',
		'Irete',
		'MCC',
		'Nekede Old Road',
		'New Owerri',
		'Okigwe Road',
		'Orji',
		'Tetlow',
		'Wetheral',
		'West-End',
		'World Bank',
	];
	const [form, setForm] = useState({
		street: '',
		city: '',
		state: '',
		country: '',
		landmark: '',
		district: '',
		isDefault: false,
	});
	const [loading, setLoading] = useState(false);
	const [userData, setUserData] = useState(null);
	const { theme, mode, setMode } = useTheme();
	const auth = getAuth();

	// Get cart items and total from route params
	const cartItems = route.params?.cartItems || [];
	const totalAmount = route.params?.totalAmount || 0;
	const originalTotal = route.params?.originalTotal || 0;
	const discountApplied = route.params?.discountApplied;
	const discountValue = route.params?.discountValue || 0;
	const storeId = route.params?.storeId;

	useEffect(() => {
		// Check if we have cart items
		if (!cartItems || cartItems.length === 0) {
			Alert.alert(
				'Empty Cart',
				'Your cart is empty. Please add items before proceeding.',
				[
					{
						text: 'OK',
						onPress: () => navigation.navigate('EMartCartDetails'),
					},
				]
			);
			return;
		}

		// Fetch user data and addresses
		const fetchUserData = async () => {
			try {
				if (!auth.currentUser) {
					navigation.navigate('Login');
					return;
				}

				const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
				if (userDoc.exists()) {
					const data = userDoc.data();
					setUserData(data);

					// Convert addresses map to array and set default address
					if (data.addresses) {
						const addressArray = Object.keys(data.addresses).map((key) => ({
							...data.addresses[key],
							id: key,
						}));
						setAddresses(addressArray);
						const defaultAddr = addressArray.find((addr) => addr.isDefault);
						if (defaultAddr) {
							setDefaultAddress(defaultAddr);
						} else if (addressArray.length > 0) {
							setDefaultAddress(addressArray[0]);
						}
					}
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
				Alert.alert(
					'Error',
					'Could not fetch your information. Please try again.'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchUserData();
	}, [auth.currentUser, navigation]);

	const fetchAddresses = async () => {
		if (!auth.currentUser) return;
		const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
		if (userDoc.exists() && userDoc.data().addresses) {
			const addressesData = userDoc.data().addresses;
			const addressArray = Object.keys(addressesData).map((key) => ({
				...addressesData[key],
				id: key,
			}));
			setAddresses(addressArray);
		}
	};

	const Checkbox = ({ value, onValueChange, color, disabled }) => (
		<Pressable
			style={[
				{
					width: 20,
					height: 20,
					borderRadius: 4,
					borderWidth: 2,
					borderColor: disabled ? '#ccc' : color || '#FF521B',
					alignItems: 'center',
					justifyContent: 'center',
				},
			]}
			onPress={() => !disabled && onValueChange(!value)}
			disabled={disabled}
		>
			{value && (
				<MaterialIcons
					name="check"
					size={16}
					color={disabled ? '#ccc' : color || '#FF521B'}
				/>
			)}
		</Pressable>
	);

	const handleProceedToPayment = () => {
		if (!defaultAddress) {
			Alert.alert(
				'Missing Address',
				'Please add a delivery address before proceeding.'
			);
			return;
		}

		if (!userData?.name || !userData?.phone) {
			Alert.alert(
				'Missing Information',
				'Please complete your profile with name and phone number before proceeding.',
				[
					{
						text: 'OK',
						onPress: () => navigation.navigate('Profile'),
					},
				]
			);
			return;
		}

		navigation.navigate('PaymentScreen', {
			cartItems,
			userData: {
				...userData,
				address: defaultAddress,
			},
			totalAmount,
			storeId,
			discountApplied, // pass this if you want to show a message
			discountValue,
		});
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={[styles.header, { backgroundColor: theme.cards }]}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={[styles.locationText, { color: theme.primary }]}>
					Address and Billing
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<View
				style={[
					{
						backgroundColor: 'white',
						margin: 16,
						borderRadius: 4,
						padding: 16,
						elevation: 1,
					},
					{ backgroundColor: theme.cards },
				]}
			>
				<Text
					style={[
						{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
						{ color: theme.text },
					]}
				>
					Cart Items
				</Text>
				{Array.isArray(cartItems) && cartItems.length > 0 ? (
					<>
						{cartItems.map((item, idx) => (
							<View
								key={item.id || item.name + idx}
								style={[
									{
										flexDirection: 'row',
										justifyContent: 'space-between',
										marginBottom: 6,
									},
									{ color: theme.text },
								]}
							>
								<Text style={[{ fontSize: 15 }, { color: theme.text }]}>
									{item.name} x {item.quantity}
								</Text>
								<Text style={[{ fontSize: 15 }, { color: theme.primary }]}>
									₦
									{(
										parseFloat(item.price) * (parseInt(item.quantity, 10) || 0)
									).toLocaleString()}
								</Text>
							</View>
						))}
						{discountApplied && (
							<View style={styles.discountText}>
								<Text style={styles.discountText2}>Discount Applied:</Text>
								<Text style={styles.discountText2}>
									- ₦{discountValue.toLocaleString()}
								</Text>
							</View>
						)}
						<View
							style={{
								borderTopWidth: 1,
								borderTopColor: '#eee',
								marginTop: 8,
								paddingTop: 8,
								flexDirection: 'row',
								justifyContent: 'space-between',
							}}
						>
							<Text
								style={[
									{ fontWeight: 'bold', fontSize: 16 },
									{ color: theme.text },
								]}
							>
								Total:
							</Text>
							<Text
								style={[
									{ fontWeight: 'bold', fontSize: 16 },
									{ color: theme.text },
								]}
							>
								₦{totalAmount.toLocaleString()}
							</Text>
						</View>
					</>
				) : (
					<Text style={[{ color: theme.text }]}>Your cart is empty.</Text>
				)}
			</View>

			<View style={[styles.deliveryAddress, { backgroundColor: theme.cards }]}>
				<Text style={[styles.addressHeader, { color: theme.text }]}>
					Delivery Address
				</Text>
				{defaultAddress ? (
					<>
						<Text style={[styles.addressText, { color: theme.text }]}>
							{defaultAddress.street}
						</Text>
						<Text style={[styles.addressText, { color: theme.text }]}>
							{defaultAddress.city}, {defaultAddress.state},{' '}
							{defaultAddress.country}
						</Text>
						<Text style={[styles.addressText, { color: theme.text }]}>
							Landmark: {defaultAddress.landmark}
						</Text>
						<Text style={[styles.addressText, { color: theme.text }]}>
							District: {defaultAddress.district}
						</Text>
					</>
				) : (
					<Text style={[styles.addressText, { color: theme.text }]}>
						No default address set
					</Text>
				)}
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<Pressable
						onPress={() => {
							fetchAddresses();
							setShowAddressesModal(true);
						}}
						style={{ marginTop: 10 }}
					>
						<Text style={[{ color: theme.secondary }]}>My Addresses</Text>
					</Pressable>
					<Pressable
						onPress={() => setShowAddAddressModal(true)}
						style={{ marginTop: 10 }}
					>
						<Text style={[{ color: theme.primary }]}>
							Add New Delivery Address
						</Text>
					</Pressable>
				</View>
				<Modal visible={showAddressesModal} animationType="slide" transparent>
					<View style={styles.modalOverlay}>
						<View
							style={[styles.modalContent, { backgroundColor: theme.cards }]}
						>
							<Pressable
								onPress={() => setShowAddressesModal(false)}
								style={{
									position: 'absolute',
									top: 10,
									right: 10,
									zIndex: 10,
									padding: 4,
								}}
							>
								<MaterialIcons name="close" size={24} color={theme.text} />
							</Pressable>
							<Text
								style={[
									{
										fontWeight: 'bold',
										fontSize: 16,
										marginBottom: 8,
										textAlign: 'center',
									},
									{ color: theme.text },
								]}
							>
								My Addresses
							</Text>
							<FlatList
								data={addresses}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<Pressable
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											marginVertical: 4,
										}}
										onPress={() => {
											setDefaultAddress(item);
											setShowAddressesModal(false);
										}}
									>
										<Checkbox
											value={defaultAddress?.id === item.id}
											onValueChange={() => {
												setDefaultAddress(item);
												setShowAddressesModal(false);
											}}
											color="#FF521B"
										/>
										<Text style={[{ marginLeft: 8 }, { color: theme.text }]}>
											{item.street?.slice(0, 10) +
												(item.street?.length > 10 ? '...' : '')}
										</Text>
										{item.isDefault && (
											<Text style={[{ color: theme.secondary, marginLeft: 8 }]}>
												(Default)
											</Text>
										)}
									</Pressable>
								)}
								ListEmptyComponent={
									<Text style={[{ marginVertical: 8 }, { color: theme.text }]}>
										No addresses found.
									</Text>
								}
								style={{ maxHeight: 180, marginBottom: 12 }}
							/>
						</View>
					</View>
				</Modal>
				<Modal visible={showAddAddressModal} animationType="slide" transparent>
					<View style={styles.modalOverlay}>
						<View
							style={[styles.modalContent, { backgroundColor: theme.cards }]}
						>
							<Text
								style={[
									{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
									{ color: theme.text },
								]}
							>
								Add New Address
							</Text>
							{['street', 'city', 'state', 'country', 'landmark'].map(
								(field) => (
									<TextInput
										key={field}
										placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
										value={form[field]}
										onChangeText={(text) =>
											setForm((f) => ({ ...f, [field]: text }))
										}
										style={[styles.input, { borderColor: theme.accent }]}
									/>
								)
							)}
							<View style={styles.pickerContainer}>
								<Text style={[styles.pickerLabel, { color: theme.text }]}>
									District *
								</Text>
								<Picker
									selectedValue={form.district}
									onValueChange={(itemValue) =>
										setForm((f) => ({ ...f, district: itemValue }))
									}
									style={styles.picker}
									mode="dropdown"
								>
									<Picker.Item label="Select district" value="" />
									{districts.map((district) => (
										<Picker.Item
											key={district}
											label={district}
											value={district}
										/>
									))}
								</Picker>
							</View>
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									marginVertical: 8,
								}}
							>
								<Checkbox
									value={form.isDefault}
									onValueChange={(val) =>
										setForm((f) => ({ ...f, isDefault: val }))
									}
									color="#FF521B"
								/>
								<Text style={[{ marginLeft: 8 }, { color: theme.text }]}>
									Set as default address
								</Text>
							</View>
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
								}}
							>
								<Pressable
									style={[styles.modalButton, { backgroundColor: '#FF521B' }]}
									onPress={async () => {
										if (
											!form.street ||
											!form.city ||
											!form.state ||
											!form.country ||
											!form.district
										) {
											Alert.alert(
												'Missing Fields',
												'Please fill in all required fields.'
											);
											return;
										}
										const userDocRef = doc(db, 'users', auth.currentUser.uid);

										// Generate a unique id for the address
										const newId = Date.now().toString();
										const newAddress = {
											...form,
											isDefault: !!form.isDefault,
										};

										// Fetch current addresses map
										const userSnap = await getDoc(userDocRef);
										const data = userSnap.exists() ? userSnap.data() : {};
										let addressesMap = data.addresses || {};

										// If setting as default, unset previous default
										if (form.isDefault) {
											Object.keys(addressesMap).forEach((key) => {
												addressesMap[key].isDefault = false;
											});
										}

										addressesMap[newId] = newAddress;

										await updateDoc(userDocRef, {
											addresses: addressesMap,
										});

										await fetchAddresses();

										// Update local state
										const addressArray = Object.keys(addressesMap).map(
											(key) => ({
												...addressesMap[key],
												id: key,
											})
										);
										setAddresses(addressArray);

										// Always show the newly added address, regardless of isDefault
										setDefaultAddress({ ...newAddress, id: newId });

										setShowAddAddressModal(false);
										setForm({
											street: '',
											city: '',
											state: '',
											country: '',
											landmark: '',
											district: '',
											isDefault: false,
										});
									}}
								>
									<Text style={{ color: '#fff' }}>Save</Text>
								</Pressable>
								<Pressable
									style={[styles.modalButton, { backgroundColor: '#aaa' }]}
									onPress={() => setShowAddAddressModal(false)}
								>
									<Text style={{ color: '#fff' }}>Cancel</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
			</View>

			<Pressable
				style={[
					styles.proceedButton,
					(!defaultAddress || !cartItems.length) && styles.disabledButton,
				]}
				onPress={handleProceedToPayment}
				disabled={!defaultAddress || !cartItems.length}
			>
				<Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
					Proceed to Payment
				</Text>
			</Pressable>
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
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		marginTop: 40,
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	deliveryAddress: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		backgroundColor: 'white',
		margin: 16,
		borderRadius: 4,
		elevation: 1,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 2,
		gap: 10,
	},
	addressHeader: {
		fontWeight: 'bold',
		fontSize: 16,
	},
	addressText: {
		fontSize: 16,
	},
	discountText: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
		marginTop: 8,
	},
	discountText2: {
		fontStyle: 'italic',
		color: '#21A179',
		fontSize: 16,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 20,
		width: '90%',
		elevation: 4,
	},
	input: {
		borderWidth: 1,
		borderRadius: 4,
		padding: 8,
		marginBottom: 8,
		backgroundColor: '#fff',
	},
	modalButton: {
		flex: 1,
		alignItems: 'center',
		padding: 10,
		borderRadius: 4,
		marginHorizontal: 4,
	},
	proceedButton: {
		backgroundColor: '#FF521B',
		padding: 16,
		paddingVertical: 14,
		alignItems: 'center',
		marginHorizontal: 16,
		borderRadius: 4,
		position: 'absolute',
		bottom: 24,
		left: 0,
		right: 0,
	},
	disabledButton: {
		backgroundColor: '#E0E0E0',
	},
	pickerContainer: {
		marginTop: 8,
		marginBottom: 12,
	},
	pickerLabel: {
		fontSize: 14,
		color: '#555',
		marginBottom: 4,
	},
	picker: {
		borderWidth: 1,
		borderRadius: 4,
		padding: 8,
		backgroundColor: '#fff',
	},
});
