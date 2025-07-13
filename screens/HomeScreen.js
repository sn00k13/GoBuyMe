import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	StyleSheet,
	Image,
	Linking,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

export default function HomeScreen({ navigation }) {
	const [defaultAddress, setDefaultAddress] = useState(null);

	useEffect(() => {
		const fetchDefaultAddress = async () => {
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
					const addresses = userData.addresses || {};

					// Find the default address
					const defaultAddressEntry = Object.entries(addresses).find(
						([, address]) => address.isDefault
					);

					if (defaultAddressEntry) {
						const [id, address] = defaultAddressEntry;
						setDefaultAddress({ id, ...address });
					}
				} else {
					console.error('User document does not exist');
				}
			} catch (error) {
				console.error('Error fetching default address:', error);
			}
		};

		fetchDefaultAddress();
	}, []);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.toggleDrawer()}>
					<MaterialIcons name="menu" size={28} color="#0B3948" />
				</Pressable>
				<Text style={styles.logoText}>GoBuyMe</Text>
				<Pressable onPress={() => Linking.openURL('tel:08037674195')}>
					<FontAwesome name="phone" size={24} color="#0B3948" />
				</Pressable>
			</View>

			{/* Image and Address Container */}
			<View style={styles.imageAddressContainer}>
				{/* Image Content */}
				<View style={styles.imageContainer}>
					<Image
						source={require('../assets/burger-deal.jpg')}
						style={styles.image}
						resizeMode="cover"
					/>
				</View>

				{/* Address Section */}
				<Pressable
					onPress={() => navigation.navigate('Address')}
					style={styles.addressContainer}
				>
					<View style={styles.addressContent}>
						<FontAwesome6 name="location-dot" size={24} color="red" />
						<View style={styles.addressTextContainer}>
							{defaultAddress ? (
								<>
									<Text style={styles.addressText}>
										{defaultAddress.street.length > 30
											? defaultAddress.street.slice(0, 30) + '...'
											: defaultAddress.street}
									</Text>
									
								</>
							) : (
								<Text style={styles.addressText}>No default address set</Text>
							)}
						</View>
					</View>
					<FontAwesome name="angle-right" size={24} color="black" />
				</Pressable>

				{/* New Order Button */}
				<Pressable
					style={styles.newOrderButton}
					onPress={() => navigation.navigate('VendorList')}
				>
					<Text style={styles.buttonText}>New Order</Text>
				</Pressable>
			</View>

			{/* Other Menu Options */}
			<Pressable
				style={styles.menuContainer}
				onPress={() => navigation.navigate('Chat')}
			>
				<View style={styles.menuContent}>
					<Entypo name="chat" size={24} color="#0B3948" />
					<Text>Chat with us</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color="#0B3948" />
			</Pressable>
			<Pressable
				style={styles.menuContainer}
				onPress={() => navigation.navigate('Cart')}
			>
				<View style={styles.menuContent}>
					<FontAwesome name="shopping-basket" size={24} color="#0B3948" />
					<Text>My Basket</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color="#0B3948" />
			</Pressable>
			<Pressable
				style={styles.menuContainer}
				onPress={() => navigation.navigate('Favorites')}
			>
				<View style={styles.menuContent}>
					<AntDesign name="like1" size={24} color="#0B3948" />
					<Text>My Favorites</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color="#0B3948" />
			</Pressable>
			<Pressable
				style={styles.menuContainer}
				onPress={() => navigation.navigate('Orders')}
			>
				<View style={styles.menuContent}>
					<Feather name="list" size={24} color="#0B3948" />
					<Text>My Order History</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color="#0B3948" />
			</Pressable>
			<View style={{ padding: 5 }}></View>
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
	logoText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	imageAddressContainer: {
		flex: 1,
	},
	imageContainer: {
		height: 300, // Fixed height for image
		width: '100%',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	addressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#FFF',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		borderColor: '#F0F0F0',
	},
	addressContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
		flex: 1,
	},
	addressTextContainer: {
		flex: 1,
	},
	addressText: {
		fontSize: 16,
		color: '#58A4B0',
	},
	newOrderButton: {
		backgroundColor: '#FF521B',
		padding: 16,
		margin: 'auto',
		width: '80%',
		borderRadius: 4,
		alignItems: 'center',
	},
	buttonText: {
		color: 'white',
		// fontWeight: 'bold',
	},
	menuContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#FFF',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		borderColor: '#F0F0F0',
	},
	menuContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
		flex: 1,
	},
});
