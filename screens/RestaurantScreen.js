import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Image,
	ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RestaurantScreen({ navigation, route }) {
	const { restaurantId } = route.params;
	const [restaurant, setRestaurant] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isFavorited, setIsFavorited] = useState(false);

	useEffect(() => {
		const fetchRestaurant = async () => {
			try {
				const docRef = doc(db, 'restaurants', restaurantId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const restaurantData = docSnap.data();
					console.log('Fetched restaurant data:', restaurantData); // Debugging
					setRestaurant(restaurantData);
				} else {
					console.log('No such document!');
				}
			} catch (error) {
				console.error('Error fetching restaurant:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchRestaurant();
	}, [restaurantId]);

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
				<Text style={styles.todaysHoursLabel}>Today's Hours</Text>
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

	const MenuSection = ({ title, items }) => {
		if (!items || Object.keys(items).length === 0) return null;

		return (
			<>
				<View style={styles.menuDisplay}>
					<Text style={styles.menuHeader}>{title}</Text>
				</View>
				<View style={styles.menuItemsContainer}>
					{Object.entries(items).map(([id, item]) => (
						<View key={id} style={styles.menuItem}>
							<Pressable
								style={styles.plusButton}
								onPress={() => console.log('Add to cart:', id)}
							>
								<AntDesign name="pluscircleo" size={24} color="#FF521B" />
							</Pressable>
							<Pressable
								onPress={() =>
									navigation.navigate('MealDetails', {
										restaurantId,
										mealDescription: item.description,
										mealName: item.name,
										mealPrice: item.price,
										mealImageUrl: item.imageUrl,
										extras: item.extras,
										protein: item.protein,
									})
								}
								style={{ flex: 1 }}
							>
								<Text style={styles.mealName}>{item.name}</Text>
								<Text style={styles.mealPrice}>₦{item.price}</Text>
							</Pressable>
						</View>
					))}
				</View>
			</>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	if (!restaurant) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Restaurant not found</Text>
				<Pressable onPress={() => navigation.goBack()}>
					<Text style={styles.backText}>Go Back</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Fixed Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.locationText}>
					{restaurant.location || 'Owerri'}
				</Text>
				<Pressable onPress={() => setIsFavorited(!isFavorited)}>
					<MaterialIcons
						name={isFavorited ? 'favorite' : 'favorite-border'}
						size={24}
						color="#FF521B"
					/>
				</Pressable>
			</View>

			{/* Fixed Restaurant Card */}
			<View style={styles.restaurantCard}>
				<View style={styles.restaurantHeader}>
					<Text style={styles.restaurantName}>{restaurant.name}</Text>
				</View>

				<View style={styles.restaurantDetails}>
					<View style={styles.restaurantImageContainer}>
						<Image
							source={
								restaurant.imageUrl
									? { uri: restaurant.imageUrl }
									: require('../assets/placeholder.jpg')
							}
							style={styles.restaurantImage}
						/>
					</View>

					<View style={styles.restaurantInfo}>
						<View style={styles.restaurantInfoBar}>
							<Text style={styles.infoLabel}>Payment:</Text>
							<Text style={styles.infoText}>
								{restaurant.paymentMethods?.join(', ') || 'Cash, Card'}
							</Text>
						</View>

						<View style={styles.restaurantInfoBar}>
							<Text style={styles.infoLabel}>Delivery Time:</Text>
							<Text style={styles.infoText}>
								{restaurant.deliveryTime || '20-30 mins'}
							</Text>
						</View>

						<View style={styles.restaurantInfoBar}>
							<Text style={styles.infoLabel}>Min. Order:</Text>
							<Text style={styles.infoText}>
								₦{restaurant.minimumOrderAmount || '10'}
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.openingHours}>
					<Text style={styles.sectionTitle}>Opening Hours</Text>
					{renderTodaysHoursWithStatus()}
				</View>
			</View>

			{/* Scrollable Menu Sections */}
			<ScrollView style={styles.menuScrollContainer}>
				{restaurant.menuPreview ? (
					<>
						<MenuSection
							title="Customer Favorites"
							items={restaurant.menuPreview.customerFavorites || {}}
						/>

						<MenuSection
							title="Breakfast"
							items={restaurant.menuPreview.breakfast || {}}
						/>

						<MenuSection
							title="Lunch"
							items={restaurant.menuPreview.lunch || {}}
						/>
					</>
				) : (
					<View style={styles.menuDisplay}>
						<Text style={styles.menuHeader}>Menu coming soon</Text>
					</View>
				)}
			</ScrollView>
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
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 40,
		marginBottom: 5,
		backgroundColor: '#FFF9F7',
		padding: 16,
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	restaurantCard: {
		backgroundColor: '#FFF',
		shadowColor: '#2A324B',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		padding: 16,
	},
	restaurantHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	restaurantDetails: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	restaurantImageContainer: {
		width: '35%',
		aspectRatio: 1,
	},
	restaurantImage: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
	},
	restaurantInfo: {
		width: '60%',
	},
	restaurantInfoBar: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	infoLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		width: '40%',
		color: '#2A324B',
	},
	infoText: {
		fontSize: 16,
		width: '60%',
		color: '#2A324B',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#FF521B',
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
		fontSize: 16,
		fontWeight: '600',
		color: '#2A324B',
	},
	todaysHoursLabel: {
		fontSize: 14,
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
	menuScrollContainer: {
		flex: 1,
		paddingBottom: 20,
	},
	menuDisplay: {
		backgroundColor: '#EDEDF4',
		padding: 10,
		paddingLeft: 16,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
	},
	menuHeader: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2A324B',
	},
	menuItemsContainer: {
		backgroundColor: 'white',
		paddingHorizontal: 16,
		elevation: 2,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#EDEDF4',
	},
	plusButton: {
		marginRight: 12,
	},
	mealName: {
		flex: 1,
		fontSize: 16,
		color: '#2A324B',
	},
	mealPrice: {
		fontSize: 16,
		color: '#FF521B',
		fontWeight: 'bold',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		color: 'red',
		marginBottom: 20,
	},
	backText: {
		color: '#FF521B',
		fontWeight: 'bold',
	},
	restaurantName: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
	},
});
