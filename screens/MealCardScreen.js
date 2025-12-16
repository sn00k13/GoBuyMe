import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ActivityIndicator,
	SafeAreaView,
	FlatList,
	Pressable,
	Alert,
	Platform,
	ScrollView,
} from 'react-native';
import {
	doc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

export default function MealCardScreen({ navigation, route }) {
	const { mealId } = route.params;
	const [meal, setMeal] = useState(null);
	const [loading, setLoading] = useState(true);
	const [restaurants, setRestaurants] = useState([]);
	const [restaurantsLoading, setRestaurantsLoading] = useState(false);
	const [restaurantsError, setRestaurantsError] = useState(null);
	const { theme } = useTheme();

	useEffect(() => {
		const fetchMeal = async () => {
			try {
				const docRef = doc(db, 'meals', mealId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const mealData = { id: docSnap.id, ...docSnap.data() };
					setMeal(mealData);

					// Fetch restaurants that have this meal in their menu
					await fetchRestaurantsWithMeal(mealData.name);
				} else {
					console.log('No such meal!');
				}
			} catch (error) {
				console.error('Error fetching meal:', error);
				setRestaurantsError('Failed to load meal information');
			} finally {
				setLoading(false);
			}
		};

		fetchMeal();
	}, [mealId]);

	// Function to check if two strings share common words
	const hasMatchingWords = (str1, str2) => {
		if (!str1 || !str2) return false;

		// Convert to lowercase and split into words
		const words1 = str1.toLowerCase().split(/\s+/);
		const words2 = str2.toLowerCase().split(/\s+/);

		// Check if any word from the first string exists in the second string
		return words1.some(
			(word) =>
				word.length > 2 && // Only consider words with more than 2 characters
				words2.some((otherWord) => otherWord.includes(word))
		);
	};

	const fetchRestaurantsWithMeal = async (mealName) => {
		try {
			setRestaurantsLoading(true);
			setRestaurantsError(null);

			// First, get all restaurants
			const restaurantsQuery = query(collection(db, 'restaurants'));
			const restaurantsSnapshot = await getDocs(restaurantsQuery);

			if (restaurantsSnapshot.empty) {
				setRestaurants([]);
				setRestaurantsLoading(false);
				return;
			}

			// Check each restaurant's menu for the meal using partial matching
			const restaurantsWithMeal = [];

			for (const restaurantDoc of restaurantsSnapshot.docs) {
				try {
					// Get all menu items for this restaurant
					const menuQuery = query(
						collection(db, 'restaurants', restaurantDoc.id, 'menu')
					);
					const menuSnapshot = await getDocs(menuQuery);

					// Check if any menu item name matches the meal name
					const hasMatchingMenuItem = menuSnapshot.docs.some((menuDoc) => {
						const menuItemName = menuDoc.data().name;
						return hasMatchingWords(mealName, menuItemName);
					});

					if (hasMatchingMenuItem) {
						restaurantsWithMeal.push({
							id: restaurantDoc.id,
							...restaurantDoc.data(),
						});
					}
				} catch (error) {
					console.error(
						`Error checking menu for restaurant ${restaurantDoc.id}:`,
						error
					);
					// Continue with other restaurants even if one fails
				}
			}

			// Sort restaurants (same logic as VendorListScreen)
			const sortedRestaurants = sortRestaurants(
				restaurantsWithMeal,
				'orderCount'
			);
			setRestaurants(sortedRestaurants);
		} catch (error) {
			console.error('Error fetching restaurants with meal:', error);

			// Handle specific permission errors
			if (error.code === 'permission-denied') {
				setRestaurantsError(
					'Permission denied. Please check your Firebase security rules.'
				);
			} else {
				setRestaurantsError(
					'Failed to load restaurant information. Please try again later.'
				);
			}
		} finally {
			setRestaurantsLoading(false);
		}
	};

	const sortRestaurants = (restaurantsList, sortBy) => {
		// Separate open and closed restaurants
		const openRestaurants = [];
		const closedRestaurants = [];

		restaurantsList.forEach((restaurant) => {
			if (restaurant.isOpen === false) {
				closedRestaurants.push(restaurant);
			} else {
				openRestaurants.push(restaurant);
			}
		});

		// Sort open restaurants by selected criteria
		const sortedOpen = openRestaurants.sort((a, b) => {
			switch (sortBy) {
				case 'rating':
					return (b.rating || 0) - (a.rating || 0);
				case 'minimumOrderValue':
					return (a.minimumOrderValue || 0) - (b.minimumOrderValue || 0);
				case 'orderCount':
				default:
					return (b.orderCount || 0) - (a.orderCount || 0);
			}
		});

		// Sort closed restaurants by the same criteria
		const sortedClosed = closedRestaurants.sort((a, b) => {
			switch (sortBy) {
				case 'rating':
					return (b.rating || 0) - (a.rating || 0);
				case 'minimumOrderValue':
					return (a.minimumOrderValue || 0) - (b.minimumOrderValue || 0);
				case 'orderCount':
				default:
					return (b.orderCount || 0) - (a.orderCount || 0);
			}
		});

		// Return open restaurants first, then closed ones
		return [...sortedOpen, ...sortedClosed];
	};

	const renderRestaurantItem = ({ item }) => (
		<Pressable
			style={[
				styles.restaurantCard,
				{
					backgroundColor: theme.cards,
					opacity: item.isOpen === false ? 0.5 : 1,
				},
			]}
			onPress={() => {
				if (item.isOpen === false) {
					Alert.alert('This restaurant is closed at this moment');
				} else {
					navigation.navigate('RestaurantDetail', { restaurantId: item.id });
				}
			}}
		>
			<Image
				source={
					item.imageUrl
						? { uri: item.imageUrl }
						: require('../assets/placeholder.jpg')
				}
				style={styles.restaurantImage}
			/>
			<View style={styles.restaurantInfo}>
				<Text style={[styles.restaurantName, { color: theme.text }]}>
					{item.name}
				</Text>
				<Text style={[styles.restaurantCuisine, { color: theme.text }]}>
					{Array.isArray(item.cuisineType)
						? item.cuisineType.join(' • ')
						: item.cuisine || 'Various cuisines'}
				</Text>
				<View style={styles.restaurantMeta}>
					<View style={styles.ratingContainer}>
						<MaterialIcons name="star" size={16} color="#FFD700" />
						<Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
					</View>
					<View style={styles.orderCountContainer}>
						<MaterialIcons name="shopping-bag" size={14} color="#777" />
						<Text style={styles.orderCountText}>{item.orderCount || 0}</Text>
					</View>
					<Text style={styles.deliveryTime}>
						Avg. Time: {item.deliveryTime || 'Time not specified'}
					</Text>
				</View>
			</View>
		</Pressable>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	if (!meal) {
		return (
			<View style={[styles.container, { backgroundColor: theme.background }]}>
				<Text style={[styles.errorText, { color: theme.text }]}>
					Meal not found
				</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={[styles.container, { backgroundColor: theme.background }]}>
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
					<Pressable onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
					</Pressable>
					<Text style={{ fontSize: 20 }}>Owerri</Text>
					<View style={{ width: 24 }}></View>
				</View>

				<View style={styles.mealContainer}>
					<Image
						source={
							meal.imageUrl
								? { uri: meal.imageUrl }
								: require('../assets/placeholder.jpg')
						}
						style={styles.mealImage}
					/>
					<Text style={[styles.mealName, { color: theme.text }]}>
						{meal.name}
					</Text>
					<Text style={[styles.mealDescription, { color: theme.text }]}>
						{meal.description || 'No description available'}
					</Text>
					<Text style={[styles.mealPrice, { color: theme.text }]}>
						₦{meal.price || '--'}
					</Text>
				</View>

				{/* Available at these locations section */}
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Available at these locations:
				</Text>
				<ScrollView style={styles.availableSection}>
					{restaurantsLoading ? (
						<View style={styles.restaurantsLoading}>
							<ActivityIndicator size="small" color="#FF521B" />
							<Text style={[styles.loadingText, { color: theme.text }]}>
								Finding restaurants...
							</Text>
						</View>
					) : restaurantsError ? (
						<View style={styles.errorContainer}>
							<MaterialIcons name="error-outline" size={24} color="#FF5252" />
							<Text style={[styles.errorText, { color: theme.text }]}>
								{restaurantsError}
							</Text>
							<Text style={[styles.errorHelpText, { color: theme.text }]}>
								Please check your Firebase security rules to allow menu queries.
							</Text>
						</View>
					) : restaurants.length > 0 ? (
						<FlatList
							data={restaurants}
							renderItem={renderRestaurantItem}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							contentContainerStyle={styles.restaurantList}
						/>
					) : (
						<View style={styles.emptyContainer}>
							<MaterialIcons name="search-off" size={24} color="#777" />
							<Text style={[styles.emptyText, { color: theme.text }]}>
								Not currently available at any restaurants
							</Text>
						</View>
					)}
				</ScrollView>
			</View>
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
		backgroundColor: 'white',
		...Platform.select({
			ios: {
				marginTop: 0,
			},
			android: {
				marginTop: 40,
			},
		}),
	},
	mealContainer: {
		padding: 16,
		paddingBottom: 0
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	mealImage: {
		width: '100%',
		height: 200,
		borderRadius: 4,
		marginBottom: 16,
	},
	mealName: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	mealDescription: {
		fontSize: 16,
		marginBottom: 16,
		lineHeight: 22,
	},
	mealPrice: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	availableSection: {
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		padding: 16,
		paddingBottom: 0
	},
	restaurantsLoading: {
		alignItems: 'center',
		padding: 20,
	},
	loadingText: {
		marginTop: 8,
		fontSize: 14,
	},
	errorContainer: {
		padding: 16,
		backgroundColor: '#FFF0F0',
		borderRadius: 8,
		marginVertical: 8,
	},
	errorText: {
		fontSize: 14,
		marginBottom: 8,
		fontWeight: 'bold',
	},
	errorHelpText: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	emptyContainer: {
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		marginTop: 8,
		fontSize: 14,
		textAlign: 'center',
	},
	restaurantList: {
		paddingBottom: 20,
	},
	restaurantCard: {
		flexDirection: 'row',
		borderRadius: 4,
		marginBottom: 12,
		overflow: 'hidden',
		elevation: 2,
	},
	restaurantImage: {
		width: 100,
		height: 100,
	},
	restaurantInfo: {
		flex: 1,
		padding: 12,
	},
	restaurantName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	restaurantCuisine: {
		fontSize: 14,
		marginBottom: 8,
	},
	restaurantMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	ratingText: {
		marginLeft: 4,
		fontSize: 14,
	},
	orderCountContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	orderCountText: {
		marginLeft: 4,
		fontSize: 14,
	},
	deliveryTime: {
		fontSize: 14,
	},
});
