import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	StyleSheet,
	Image,
	Linking,
	SafeAreaView,
	FlatList,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { useTheme } from '../../utils/ThemeContext';

const images = [
	require('../../assets/burger-deal.jpg'),
	require('../../assets/slider1.jpg'),
	require('../../assets/slider2.jpg'),
	require('../../assets/slider3.jpg'),
	require('../../assets/slider4.jpg'),
];

import { useRef } from 'react';

export default function HomeScreen({ navigation }) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef(null);

	useEffect(() => {
		const interval = setInterval(() => {
			let nextIndex = (currentIndex + 1) % images.length;
			sliderRef.current?.scrollToIndex({ index: nextIndex, animated: true });
			setCurrentIndex(nextIndex);
		}, 3000);
		return () => clearInterval(interval);
	}, [currentIndex]);
	const [defaultAddress, setDefaultAddress] = useState(null);
	const { theme, mode, setMode } = useTheme();

	useEffect(() => {
		const auth = getAuth();
		const user = auth.currentUser;

		if (!user) {
			navigation.replace('Login');
			return;
		}

		const fetchDefaultAddress = async () => {
			try {
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
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
			>
				<Pressable onPress={() => navigation.toggleDrawer()}>
					<MaterialIcons name="menu" size={28} color={theme.text} />
				</Pressable>
				<Text style={styles.logoText}>GoBuyMe</Text>
				<Pressable onPress={() => Linking.openURL('tel:08037674195')}>
					<FontAwesome name="phone" size={24} color={theme.text} />
				</Pressable>
			</View>

			{/* Image and Address Container */}
			<View style={styles.imageAddressContainer}>
				{/* Image Content */}
				<View style={styles.imageContainer}>
					<FlatList
						data={images}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						ref={sliderRef}
						onMomentumScrollEnd={e => {
							const index = Math.round(
								e.nativeEvent.contentOffset.x /
								e.nativeEvent.layoutMeasurement.width
							);
							setCurrentIndex(index);
						}}
						renderItem={({ item }) => (
							<Image
								source={item}
								style={{ width: 410, height: 340 }}
								resizeMode="cover"
							/>
						)}
						keyExtractor={(_, idx) => idx.toString()}
					/>
					<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
						{images.map((_, idx) => (
							<View
								key={idx}
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									marginHorizontal: 4,
									backgroundColor: idx === currentIndex ? '#FF521B' : '#eee',
								}}
							/>
						))}
					</View>
				</View>

				{/* Address Section */}
				<Pressable
					onPress={() => navigation.navigate('Address')}
					style={[
						styles.addressContainer,
						{
							backgroundColor: theme.cards,
							borderBottomColor: theme.borderBottom,
						},
					]}
				>
					<View style={styles.addressContent}>
						<FontAwesome6 name="location-dot" size={24} color="red" />
						<View style={styles.addressTextContainer}>
							{defaultAddress ? (
								<>
									<Text
										style={[styles.addressText, { color: theme.secondary }]}
									>
										{defaultAddress.street.length > 30
											? defaultAddress.street.slice(0, 30) + '...'
											: defaultAddress.street}
									</Text>
								</>
							) : (
								<Text style={[styles.addressText, { color: theme.text }]}>
									No default address set
								</Text>
							)}
						</View>
					</View>
					<FontAwesome name="angle-right" size={24} color={theme.text} />
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
				style={[
					styles.menuContainer,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
				onPress={() => navigation.navigate('Chat')}
			>
				<View style={styles.menuContent}>
					<Entypo name="chat" size={24} color={theme.text} />
					<Text style={[{ color: theme.text }]}>Chat with us</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color={theme.text} />
			</Pressable>
			<Pressable
				style={[
					styles.menuContainer,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
				onPress={() => navigation.navigate('EMartCartDetails')}
			>
				<View style={styles.menuContent}>
					<FontAwesome name="shopping-basket" size={24} color={theme.text} />
					<Text style={[{ color: theme.text }]}>My Basket</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color={theme.text} />
			</Pressable>
			<Pressable
				style={[
					styles.menuContainer,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
				onPress={() => navigation.navigate('Favorites')}
			>
				<View style={styles.menuContent}>
					<AntDesign name="like1" size={24} color={theme.text} />
					<Text style={[{ color: theme.text }]}>My Favorites</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color={theme.text} />
			</Pressable>
			<Pressable
				style={[
					styles.menuContainer,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
				onPress={() => navigation.navigate('Orders')}
			>
				<View style={styles.menuContent}>
					<Feather name="list" size={24} color={theme.text} />
					<Text style={[{ color: theme.text }]}>My Order History</Text>
				</View>
				<FontAwesome name="angle-right" size={24} color={theme.text} />
			</Pressable>
			<View style={{ padding: 5 }}></View>
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
		marginTop: 40
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
		height: 350, // Fixed height for image
		width: '100%',
		paddingBottom: 10
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
		borderBottomWidth: 1,
	},
	menuContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
		flex: 1,
	},
});
