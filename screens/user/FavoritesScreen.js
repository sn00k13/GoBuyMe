// screens/user/FavoritesScreen.js
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	SafeAreaView,
	Image,
	Platform,
	Alert,
	FlatList,
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
	setDoc,
} from 'firebase/firestore';
import { useTheme } from '../../utils/ThemeContext';

export default function FavoritesScreen({ navigation }) {
	const [favoriteVendors, setFavoriteVendors] = useState([]);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();

	useEffect(() => {
		fetchFavorites();
	}, []);

	const fetchFavorites = async () => {
		setLoading(true);
		const user = getAuth().currentUser;
		if (!user) return;
		
		try {
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
		} catch (error) {
			console.error('Error fetching favorites:', error);
			Alert.alert('Error', 'Failed to load favorites');
		} finally {
			setLoading(false);
		}
	};

	const removeFromFavorites = async (vendorId) => {
		const user = getAuth().currentUser;
		if (!user) return;
		
		try {
			// Get current favorites
			const favRef = doc(db, 'users', user.uid, 'favorites', 'vendors');
			const favDoc = await getDoc(favRef);
			
			let currentIds = [];
			if (favDoc.exists()) {
				currentIds = favDoc.data().ids || [];
			}
			
			// Remove the vendor ID
			const updatedIds = currentIds.filter(id => id !== vendorId);
			
			// Update Firestore
			await setDoc(favRef, { ids: updatedIds }, { merge: true });
			
			// Update local state
			setFavoriteVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
			
			Alert.alert('Success', 'Restaurant removed from favorites');
		} catch (error) {
			console.error('Error removing favorite:', error);
			Alert.alert('Error', 'Failed to remove from favorites');
		}
	};

	const confirmRemove = (vendor) => {
		Alert.alert(
			'Remove Favorite',
			`Are you sure you want to remove ${vendor.name} from your favorites?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Remove', onPress: () => removeFromFavorites(vendor.id), style: 'destructive' }
			]
		);
	};

	const renderFavoriteItem = ({ item }) => (
		<Pressable
			onPress={() =>
				navigation.navigate('RestaurantDetail', {
					restaurantId: item.id,
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
					item.imageUrl
						? { uri: item.imageUrl }
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
					{item.name}
				</Text>
				{item.cuisineType && (
					<Text style={{ color: '#666' }}>{item.cuisineType}</Text>
				)}
				{/* isOpen status */}
				<Text
					style={{
						color: item.isOpen ? '#4CAF50' : '#F44336',
						fontWeight: 'bold',
						marginTop: 4,
					}}
				>
					{item.isOpen ? 'OPEN NOW' : 'CLOSED'}
				</Text>
			</View>
			{/* Remove button */}
			<Pressable
				onPress={() => confirmRemove(item)}
				style={{ padding: 8 }}
			>
				<MaterialIcons name="delete-outline" size={24} color="#FF521B" />
			</Pressable>
		</Pressable>
	);

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
					<Text style={styles.loadingText}>Loading...</Text>
				) : favoriteVendors.length === 0 ? (
					<Text style={styles.loadingText}>You do not have any favorites yet.</Text>
				) : (
					<FlatList
						data={favoriteVendors}
						renderItem={renderFavoriteItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingBottom: 20 }}
					/>
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
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
		marginBottom: 16,
		...Platform.select({
			ios: {
				marginTop: 0,
			},
			android: {
				marginTop: 40,
			},
		}),
	},
	loadingText: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 20,
	},
});