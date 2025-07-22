import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	Pressable,
	FlatList,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
	doc,
	getDoc,
	collection,
	getDocs,
	setDoc,
	updateDoc,
	arrayUnion,
	arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useCart } from '../app/CartContext';
import { useFocusEffect } from '@react-navigation/native';

export default function RestaurantDetailScreen({ route, navigation }) {
	const { restaurantId } = route.params;
	const { cart, getCartItemCount } = useCart();
	const [cartItemCount, setCartItemCount] = useState(0);
	const [restaurant, setRestaurant] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [categories, setCategories] = useState([]);
	const [isFavorite, setIsFavorite] = useState(false);
	const [favLoading, setFavLoading] = useState(false);

	useEffect(() => {
		const fetchRestaurant = async () => {
			try {
				const docRef = doc(db, 'restaurants', restaurantId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					setRestaurant(data);
				}
			} catch (error) {
				console.error('Error fetching restaurant:', error);
			}
		};

		const fetchMenu = async () => {
			try {
				const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
				const menuSnap = await getDocs(menuRef);
				const items = [];
				const cats = new Set();

				menuSnap.forEach((doc) => {
					const item = { id: doc.id, ...doc.data() };
					items.push(item);
					if (item.category) {
						cats.add(item.category);
					}
				});

				setMenuItems(items);
				setCategories(Array.from(cats));
				if (cats.size > 0) {
					setSelectedCategory(Array.from(cats)[0]);
				}
			} catch (error) {
				console.error('Error fetching menu:', error);
			}
		};

		const checkFavorite = async () => {
			const user = getAuth().currentUser;
			if (!user || !restaurantId) return;
			try {
				const favDoc = await getDoc(
					doc(db, 'users', user.uid, 'favorites', 'vendors')
				);
				const ids = favDoc.exists() ? favDoc.data().ids || [] : [];
				setIsFavorite(ids.includes(restaurantId));
			} catch (e) {
				setIsFavorite(false);
			}
		};
		checkFavorite();

		fetchRestaurant();
		fetchMenu();
	}, [restaurantId]);

	useFocusEffect(
		React.useCallback(() => {
			setCartItemCount(getCartItemCount(restaurantId));
		}, [cart, restaurantId])
	);

	const renderCategory = ({ item }) => (
		<Pressable
			style={[
				styles.categoryItem,
				selectedCategory === item && styles.selectedCategoryItem,
			]}
			onPress={() => setSelectedCategory(item)}
		>
			<Text
				style={[
					styles.categoryText,
					selectedCategory === item && styles.selectedCategoryText,
				]}
			>
				{item}
			</Text>
		</Pressable>
	);

	const renderMenuItem = ({ item }) => {
		if (selectedCategory && item.category !== selectedCategory) return null;

		return (
			<Pressable
				style={styles.menuItem}
				onPress={() =>
					navigation.navigate('RestaurantMenuItem', {
						restaurantId,
						menuItem: {
							id: item.id,
							name: item.name || '',
							description: item.description || '',
							price: item.price || 0,
							imageUrl: item.imageUrl || null,
						},
						restaurantName: restaurant?.name || '',
					})
				}
			>
				<Image
					source={
						item.imageUrl
							? { uri: item.imageUrl }
							: require('../../assets/placeholder.jpg')
					}
					style={styles.menuItemImage}
				/>
				<View style={styles.menuItemInfo}>
					<Text style={styles.menuItemName}>{item.name}</Text>
					<Text style={styles.menuItemDescription} numberOfLines={2}>
						{item.description}
					</Text>
					<Text style={styles.menuItemPrice}>₦{item.price}</Text>
				</View>
			</Pressable>
		);
	};

	if (!restaurant) {
		return (
			<View style={styles.loadingContainer}>
				<Text>Loading...</Text>
			</View>
		);
	}

	const renderTodaysHoursWithStatus = () => {
		if (!restaurant?.openingHours) {
			return (
				<Text style={styles.noHoursText}>Opening hours not available</Text>
			);
		}

		const days = [
			'sunday',
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
		];
		const today = days[new Date().getDay()];
		const todaysHours = restaurant.openingHours[today];

		if (!todaysHours) {
			return <Text style={styles.noHoursText}>Closed today</Text>;
		}

		const { openTime, closeTime } =
			typeof todaysHours === 'string'
				? parseTimeString(todaysHours)
				: { openTime: todaysHours.open, closeTime: todaysHours.close };

		const isOpen = checkIfOpen(openTime, closeTime);
		const hoursText = `${openTime} - ${closeTime}`;

		return (
			<View style={styles.hoursContainer}>
				<View style={styles.hoursRow}>
					<Text style={styles.todaysHoursText}>{hoursText}</Text>
					<View
						style={[
							styles.statusIndicator,
							isOpen ? styles.open : styles.closed,
						]}
					>
						<Text style={styles.statusText}>
							{isOpen ? 'OPEN NOW' : 'CLOSED'}
						</Text>
					</View>
				</View>
			</View>
		);
	};

	const parseTimeString = (timeRange) => {
		const [open, close] = timeRange.split(' - ');
		return { openTime: open, closeTime: close };
	};

	const checkIfOpen = (openTime, closeTime) => {
		try {
			const now = new Date();
			const currentHours = now.getHours();
			const currentMinutes = now.getMinutes();

			const open = convertTo24Hour(openTime);
			const close = convertTo24Hour(closeTime);

			const currentTime = currentHours * 60 + currentMinutes;
			const openTimeValue = open.hours * 60 + open.minutes;
			const closeTimeValue = close.hours * 60 + close.minutes;

			return currentTime >= openTimeValue && currentTime <= closeTimeValue;
		} catch {
			return false;
		}
	};

	const convertTo24Hour = (timeStr) => {
		const [time, period] = timeStr.split(' ');
		const [hours, minutes] = time.split(':').map(Number);

		return {
			hours:
				period === 'PM' && hours !== 12
					? hours + 12
					: period === 'AM' && hours === 12
					? 0
					: hours,
			minutes: minutes || 0,
		};
	};

	const toggleFavorite = async () => {
		setFavLoading(true);
	  
		try {
		  const user = auth.currentUser;
		  const id = restaurantId;
	  
		  if (!user) {
			console.warn('No authenticated user.');
			setFavLoading(false);
			return;
		  }
		  if (!id) {
			console.warn('No restaurantId.');
			setFavLoading(false);
			return;
		  }
	  
		  const favRef = doc(db, 'users', user.uid, 'favorites', 'vendors');
		  let favDoc;
		  try {
			favDoc = await getDoc(favRef);
		  } catch (err) {
			console.error('Error fetching favorites doc:', err);
			setFavLoading(false);
			return;
		  }
	  
		  let currentIds = [];
		  if (favDoc.exists()) {
			const data = favDoc.data();
			currentIds = Array.isArray(data.ids) ? data.ids : [];
		  }
	  
		  let newIds;
		  if (currentIds.includes(id)) {
			// Remove favorite
			newIds = currentIds.filter(favId => favId !== id);
			console.log('Removing favorite. New ids:', newIds);
		  } else {
			// Add favorite
			newIds = [...currentIds, id];
			console.log('Adding favorite. New ids:', newIds);
		  }
	  
		  try {
			await setDoc(favRef, { ids: newIds }, { merge: true });
			setIsFavorite(newIds.includes(id));
			console.log('Favorite updated successfully');
		  } catch (err) {
			console.error('Error updating favorites:', err);
			alert('Failed to update favorites: ' + err.message);
		  }
		} catch (error) {
		  console.error('Unexpected error in toggleFavorite:', error);
		} finally {
		  setFavLoading(false);
		}
	  };

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.headerText}>{restaurant.name}</Text>
				<Pressable onPress={toggleFavorite} disabled={favLoading}>
					<MaterialIcons
						name={isFavorite ? 'favorite' : 'favorite-border'}
						size={24}
						color="#FF521B"
					/>
				</Pressable>
			</View>

			{/* Restaurant Info */}
			<View style={styles.restaurantInfo}>
				<View style={styles.restaurantInfoContainer}>
					<Image
						source={
							restaurant.imageUrl
								? { uri: restaurant.imageUrl }
								: require('../../assets/placeholder.jpg')
						}
						style={styles.restaurantImage}
					/>
					<View style={styles.infoContainer}>
						<View style={styles.paymentTypeContainer}>
							<Text style={styles.infoContainerText}>Payment Type:</Text>
							<Text>
								{Array.isArray(restaurant.paymentType)
									? restaurant.paymentType.join(' • ')
									: 'Flexible payment options'}
							</Text>
						</View>
						<View style={styles.paymentTypeContainer}>
							<Text style={styles.infoContainerText}>Ratings:</Text>
							<View style={styles.ratingContainer}>
								<MaterialIcons name="star" size={20} color="#FFD700" />
								<Text>{restaurant.rating || 'N/A'}</Text>
							</View>
						</View>
						<View style={styles.paymentTypeContainer}>
							<Text style={styles.infoContainerText}>Delivery Fee:</Text>
							<Text> ₦{restaurant.deliveryFee || '0'}</Text>
						</View>
						<View style={styles.paymentTypeContainer}>
							<Text style={styles.infoContainerText}>Minimum Order:</Text>
							<Text> ₦{restaurant.minOrder || '0'}</Text>
						</View>
					</View>
				</View>
				<View>
					<Text style={styles.cuisineType}>
						{Array.isArray(restaurant.cuisineType)
							? restaurant.cuisineType.join(' • ')
							: 'Various cuisines'}
					</Text>
				</View>
				<View>
					<Text style={styles.openingHours}>Opening Hours</Text>
					{renderTodaysHoursWithStatus()}
				</View>
			</View>

			{/* Categories */}
			<View style={styles.categoriesContainer}>
				<FlatList
					data={categories}
					renderItem={renderCategory}
					keyExtractor={(item) => item}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoriesList}
				/>
			</View>

			{/* Menu Items */}
			<FlatList
				data={menuItems}
				renderItem={renderMenuItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.menuList}
			/>

			{/* Cart FAB */}
			<Pressable
				style={styles.cartButtonFab}
				onPress={() => navigation.navigate('Cart', { restaurantId })}
			>
				<MaterialIcons name="shopping-cart" size={28} color="#fff" />
				{cartItemCount > 0 && (
					<View style={styles.cartCounter}>
						<Text style={styles.cartCounterText}>{cartItemCount}</Text>
					</View>
				)}
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
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
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	restaurantInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	restaurantInfo: {
		backgroundColor: 'white',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	restaurantImage: {
		width: 150,
		height: 150,
		borderRadius: 8,
	},
	paymentTypeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	infoContainerText: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	infoContainer: {
		flex: 1,
		gap: 10,
		paddingHorizontal: 8,
		paddingVertical: 16,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	cuisineType: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	openingHours: {
		fontWeight: 'bold',
	},
	hoursContainer: {
		gap: 4,
	},
	hoursRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	todaysHoursText: {
		marginTop: 8,
		fontSize: 14,
		fontWeight: '600',
		color: '#2A324B',
	},
	statusIndicator: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	open: {
		backgroundColor: '#4CAF50',
	},
	closed: {
		backgroundColor: '#F44336',
	},
	statusText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold',
	},
	noHoursText: {
		fontStyle: 'italic',
		color: '#777',
	},
	categoriesContainer: {
		backgroundColor: 'white',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	categoriesList: {
		paddingHorizontal: 16,
		gap: 8,
	},
	categoryItem: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4,
		backgroundColor: '#F0F0F0',
		marginRight: 8,
	},
	selectedCategoryItem: {
		backgroundColor: '#FF521B',
	},
	categoryText: {
		fontSize: 14,
		color: '#2A324B',
	},
	selectedCategoryText: {
		color: 'white',
	},
	menuList: {
		padding: 14,
	},
	menuItem: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderRadius: 4,
		marginBottom: 12,
		overflow: 'hidden',
		elevation: 2,
		alignItems: 'center',
	},
	menuItemImage: {
		width: 100,
		height: 100,
		resizeMode: 'cover',
		backgroundColor: '#FFF0EB',
	},
	menuItemInfo: {
		flex: 1,
		padding: 12,
		justifyContent: 'space-between',
	},
	menuItemName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	menuItemDescription: {
		fontSize: 14,
		color: '#666',
		marginVertical: 4,
	},
	menuItemPrice: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	cartButtonFab: {
		position: 'absolute',
		bottom: 32,
		right: 24,
		backgroundColor: '#FF521B',
		borderRadius: 32,
		width: 56,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	cartCounter: {
		position: 'absolute',
		top: 6,
		right: 6,
		backgroundColor: '#fff',
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	cartCounterText: {
		color: '#FF521B',
		fontWeight: 'bold',
		fontSize: 13,
	},
});
