// screens/user/FavoritesScreen.js
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	SafeAreaView,
	Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import {
	doc,
	getDoc,
	collection,
	getDocs,
	query,
	where,
} from 'firebase/firestore';
import { useTheme } from '../../utils/ThemeContext';

export default function FavoritesScreen({ navigation }) {
	const [favoriteVendors, setFavoriteVendors] = useState([]);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();

	useEffect(() => {
		const fetchFavorites = async () => {
			const user = getAuth().currentUser;
			if (!user) return;
			const favDoc = await getDoc(
				doc(db, 'users', user.uid, 'favorites', 'vendors')
			);
			const vendorIds = favDoc.exists() ? favDoc.data().ids || [] : [];
			if (vendorIds.length === 0) {
				setFavoriteVendors([]);
				setLoading(false);
				return;
			}
			// Firestore 'in' queries are limited to 10 items per query
			const vendorChunks = [];
			for (let i = 0; i < vendorIds.length; i += 10) {
				vendorChunks.push(vendorIds.slice(i, i + 10));
			}
			let vendors = [];
			for (const chunk of vendorChunks) {
				const q = query(
					collection(db, 'restaurants'),
					where('__name__', 'in', chunk)
				);
				const snapshot = await getDocs(q);
				vendors = vendors.concat(
					snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				);
			}
			setFavoriteVendors(vendors);
			setLoading(false);
		};
		fetchFavorites();
	}, []);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={styles.container}>
				<View style={styles.header}>
					{/* Back Button */}
					<Pressable onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back" size={24} color={theme.text} />
					</Pressable>
					<Text style={styles.title}>Favorites</Text>
					<View></View>
				</View>
				{loading ? (
					<Text>Loading...</Text>
				) : favoriteVendors.length === 0 ? (
					<Text>No favorite vendors yet.</Text>
				) : (
					favoriteVendors.map((vendor) => (
						<Pressable
							key={vendor.id}
							onPress={() =>
								navigation.navigate('RestaurantDetail', {
									restaurantId: vendor.id,
								})
							}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								margin: 16,
								marginTop: 0,
								backgroundColor: '#fff',
								borderRadius: 4,
								padding: 12,
								elevation: 2,
							}}
						>
							{/* Thumbnail image */}
							<Image
								source={
									vendor.imageUrl
										? { uri: vendor.imageUrl }
										: require('../../assets/placeholder.jpg')
								}
								style={{
									width: 48,
									height: 48,
									borderRadius: 4,
									marginRight: 12,
									backgroundColor: '#EEE',
								}}
							/>
							{/* Vendor details */}
							<View style={{ flex: 1 }}>
								<Text
									style={{ fontWeight: 'bold', fontSize: 16, color: '#FF521B' }}
								>
									{vendor.name}
								</Text>
								{vendor.cuisineType && (
									<Text style={{ color: '#666' }}>{vendor.cuisineType}</Text>
								)}
								{/* isOpen status */}
								<Text
									style={{
										color: vendor.isOpen ? '#4CAF50' : '#F44336',
										fontWeight: 'bold',
										marginTop: 4,
									}}
								>
									{vendor.isOpen ? 'OPEN NOW' : 'CLOSED'}
								</Text>
							</View>
						</Pressable>
					))
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF9F7',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		marginTop: 40,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
		marginBottom: 16,
	},
});
