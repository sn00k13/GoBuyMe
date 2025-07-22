import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	TextInput,
	Alert,
	SafeAreaView,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../utils/ThemeContext';

export default function MyAddressesScreen({ navigation }) {
	const [addresses, setAddresses] = useState({});
	const [selectedAddress, setSelectedAddress] = useState(null);
	const [isAddingNew, setIsAddingNew] = useState(false);
	const { theme, mode, setMode } = useTheme();
	const [newAddress, setNewAddress] = useState({
		street: '',
		city: '',
		zipCode: '',
		state: '',
		country: '',
		landmark: '',
		district: '',
		isDefault: false,
	});
	const [editingAddressId, setEditingAddressId] = useState(null);

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

	useEffect(() => {
		const fetchAddresses = async () => {
			try {
				const auth = getAuth();
				const user = auth.currentUser;

				if (!user) {
					console.error('User is not authenticated');
					return;
				}

				const userId = user.uid;
				const userDoc = await getDoc(doc(db, 'users', userId));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					setAddresses(userData.addresses || {});
					const defaultAddress = Object.entries(userData.addresses || {}).find(
						([, address]) => address.isDefault
					);
					if (defaultAddress) {
						setSelectedAddress({ id: defaultAddress[0], ...defaultAddress[1] });
					}
				} else {
					console.error('User document does not exist');
				}
			} catch (error) {
				console.error('Error fetching addresses:', error);
			}
		};

		fetchAddresses();
	}, []);

	// Handle address selection
	const handleSelectAddress = async (id) => {
		const updatedAddresses = { ...addresses };
		Object.keys(updatedAddresses).forEach((key) => {
			updatedAddresses[key].isDefault = key === id;
		});
		setAddresses(updatedAddresses);
		setSelectedAddress({ id, ...updatedAddresses[id] });

		// Update Firestore
		const auth = getAuth();
		const user = auth.currentUser;
		if (user) {
			try {
				await updateDoc(doc(db, 'users', user.uid), {
					addresses: updatedAddresses,
				});
				Alert.alert('Success', 'Default address updated successfully!');
			} catch (error) {
				console.error('Error updating default address:', error);
			}
		}
	};

	// Handle adding a new address
	const handleAddNewAddress = async () => {
		if (
			!newAddress.street ||
			!newAddress.city ||
			!newAddress.zipCode ||
			!newAddress.state ||
			!newAddress.country ||
			!newAddress.district
		) {
			Alert.alert('Error', 'Please fill in all required fields.');
			return;
		}

		const auth = getAuth();
		const user = auth.currentUser;
		if (user) {
			const updatedAddresses = { ...addresses };

			if (editingAddressId) {
				// Update the existing address
				updatedAddresses[editingAddressId] = newAddress;
			} else {
				// Add a new address
				const newAddressId = `address${
					Object.keys(updatedAddresses).length + 1
				}`;

				// If the new address is set as default, unset all other defaults
				if (newAddress.isDefault) {
					Object.keys(updatedAddresses).forEach((key) => {
						updatedAddresses[key].isDefault = false;
					});
				}

				updatedAddresses[newAddressId] = newAddress;
			}

			try {
				await updateDoc(doc(db, 'users', user.uid), {
					addresses: updatedAddresses,
				});
				setAddresses(updatedAddresses);
				setNewAddress({
					street: '',
					city: '',
					zipCode: '',
					state: '',
					country: '',
					landmark: '',
					district: '',
					isDefault: false,
				});
				setIsAddingNew(false);
				setEditingAddressId(null); // Reset editing state
				Alert.alert(
					'Success',
					editingAddressId
						? 'Address updated successfully!'
						: 'New address added successfully!'
				);
			} catch (error) {
				console.error('Error saving address:', error);
			}
		}
	};

	const handleEditAddress = (id, address) => {
		setNewAddress({ ...address });
		setIsAddingNew(true); // Show the form
		setEditingAddressId(id); // Track the address being edited
	};

	const handleDeleteAddress = async (id) => {
		const updatedAddresses = { ...addresses };
		delete updatedAddresses[id];
		setAddresses(updatedAddresses);

		// Update Firestore
		const auth = getAuth();
		const user = auth.currentUser;
		if (user) {
			try {
				await updateDoc(doc(db, 'users', user.uid), {
					addresses: updatedAddresses,
				});
				Alert.alert('Success', 'Address deleted successfully!');
			} catch (error) {
				console.error('Error deleting address:', error);
			}
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{ backgroundColor: theme.cards, borderBottomColor: theme.border },
				]}
			>
				<Pressable
					style={styles.backButton}
					onPress={() => navigation.toggleDrawer()}
				>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={[styles.locationText, { color: theme.primary }]}>
					Choose a delivery location
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<Text
				style={[
					{
						fontStyle: 'italic',
						paddingVertical: 8,
						paddingHorizontal: 16,
						marginBottom: 0,
					},
					{ color: theme.text },
				]}
			>
				Select a default address for your orders. You can add or edit addresses
				as needed.
			</Text>
			<ScrollView>
				{Object.entries(addresses).map(([id, address]) => (
					<Pressable
						key={id}
						style={[styles.addressContainer, { backgroundColor: theme.cards }]}
						onPress={() => handleSelectAddress(id)}
					>
						<View style={styles.checkbox}>
							{address.isDefault && <View style={styles.checkboxChecked} />}
						</View>
						<View style={{ flex: 1, padding: 8 }}>
							<Text style={[styles.addressText, { color: theme.text }]}>
								{address.street}
							</Text>
							<Text style={[styles.addressText, { color: theme.text }]}>
								{address.city}, {address.state}, {address.zipCode}
							</Text>
							<Text style={[styles.addressText, { color: theme.text }]}>
								{address.country}
							</Text>
							{address.landmark && (
								<Text style={[styles.addressText, { color: theme.text }]}>
									{address.landmark}
								</Text>
							)}
							{address.district && (
								<Text style={[styles.addressText, { color: theme.text }]}>
									{address.district}
								</Text>
							)}
						</View>
						{/* Edit Button */}
						<Pressable
							style={styles.editButton}
							onPress={() => handleEditAddress(id, address)}
						>
							<Text style={styles.editButtonText}>Edit</Text>
						</Pressable>
						{/* Delete Button */}
						<Pressable
							style={styles.deleteButton}
							onPress={() => handleDeleteAddress(id)}
						>
							<Text style={styles.deleteButtonText}>Delete</Text>
						</Pressable>
					</Pressable>
				))}
			</ScrollView>

			<ScrollView>
				{isAddingNew ? (
					<View style={styles.newAddressForm}>
						<TextInput
							style={styles.input}
							placeholder="Street"
							value={newAddress.street}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, street: text })
							}
						/>
						<TextInput
							style={styles.input}
							placeholder="City"
							value={newAddress.city}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, city: text })
							}
						/>
						<TextInput
							style={styles.input}
							placeholder="State"
							value={newAddress.state}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, state: text })
							}
						/>
						<TextInput
							style={styles.input}
							placeholder="Zip Code"
							value={newAddress.zipCode}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, zipCode: text })
							}
						/>
						<TextInput
							style={styles.input}
							placeholder="Country"
							value={newAddress.country}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, country: text })
							}
						/>
						<TextInput
							style={styles.input}
							placeholder="Landmark (Optional)"
							value={newAddress.landmark}
							onChangeText={(text) =>
								setNewAddress({ ...newAddress, landmark: text })
							}
						/>
						<View style={styles.pickerContainer}>
							<Text style={styles.pickerLabel}>District *</Text>
							<Picker
								selectedValue={newAddress.district}
								onValueChange={(itemValue) =>
									setNewAddress({ ...newAddress, district: itemValue })
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
						<Pressable
							style={styles.checkboxContainer}
							onPress={() =>
								setNewAddress({
									...newAddress,
									isDefault: !newAddress.isDefault,
								})
							}
						>
							<View style={styles.checkbox}>
								{newAddress.isDefault && (
									<View style={styles.checkboxChecked} />
								)}
							</View>
							<Text style={styles.checkboxLabel}>Set as default address</Text>
						</Pressable>
						<Pressable style={styles.addButton} onPress={handleAddNewAddress}>
							<Text style={styles.addButtonText}>Add Address</Text>
						</Pressable>
						{/* Cancel Button */}
						<Pressable
							style={styles.cancelButton}
							onPress={() => setIsAddingNew(false)}
						>
							<Text style={styles.cancelButtonText}>Cancel</Text>
						</Pressable>
					</View>
				) : (
					<Pressable
						style={styles.addButton}
						onPress={() => setIsAddingNew(true)}
					>
						<Text style={styles.addButtonText}>Add New Address</Text>
					</Pressable>
				)}
			</ScrollView>
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
		marginTop: 40,
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	addressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 8,
		marginHorizontal: 16,
		backgroundColor: '#FFF',
		borderRadius: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		paddingVertical: 16,
		paddingHorizontal: 16,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: '#FF521B',
		borderRadius: 4,
		marginRight: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: {
		width: 16,
		height: 16,
		backgroundColor: '#FF521B',
	},
	addressText: {
		fontSize: 16,
		color: '#2A324B',
	},
	newAddressForm: {
		paddingTop: 16,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#dcdba8',
	},
	input: {
		borderWidth: 1,
		borderColor: '#FF521B',
		borderRadius: 4,
		padding: 8,
		marginVertical: 8,
		marginHorizontal: 16,
	},
	pickerContainer: {
		marginHorizontal: 16,
		marginVertical: 8,
	},
	pickerLabel: {
		fontSize: 14,
		color: '#0B3948',
		marginBottom: 4,
	},
	picker: {
		borderWidth: 1,
		borderColor: '#FF521B',
		borderRadius: 4,
		padding: 8,
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 16,
		marginVertical: 8,
	},
	addButton: {
		backgroundColor: '#FF521B',
		padding: 16,
		borderRadius: 4,
		alignItems: 'center',
		marginVertical: 16,
		marginHorizontal: 16,
	},
	addButtonText: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	cancelButton: {
		backgroundColor: '#FF521B',
		padding: 16,
		borderRadius: 4,
		alignItems: 'center',
		marginBottom: 20,
		marginHorizontal: 16,
	},
	cancelButtonText: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	editButton: {
		padding: 8,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	editButtonText: {
		color: '#0B3948',
		fontSize: 14,
		fontWeight: 'bold',
	},
	deleteButton: {
		padding: 8,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	deleteButtonText: {
		color: '#FF521B',
		fontSize: 14,
		fontWeight: 'bold',
	},
});
