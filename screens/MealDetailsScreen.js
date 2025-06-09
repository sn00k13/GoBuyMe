import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Image,
	ScrollView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MealDetailsScreen({ route, navigation }) {
	const {
		mealId,
		mealName,
		mealPrice,
		restaurantId,
		mealImageUrl,
		mealDescription,
		extras,
		protein,
	} = route.params;
	const { addToCart, getCartTotal, getCartItemCount } = useCart();
	const [restaurant, setRestaurant] = useState(null);
	const [isFavorited, setIsFavorited] = useState(false);
	const [cartTotal, setCartTotal] = useState(0);
	const [cartItemCount, setCartItemCount] = useState(0);
	const [selectedExtras, setSelectedExtras] = useState([]);
	const [selectedProteins, setSelectedProteins] = useState([]);

	// Initialize cart total when restaurantId changes
	useEffect(() => {
		setCartTotal(getCartTotal(restaurantId));
		setCartItemCount(getCartItemCount(restaurantId));
	}, [restaurantId]);

	useEffect(() => {
		const fetchRestaurant = async () => {
			try {
				const docRef = doc(db, 'restaurants', restaurantId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const restaurantData = docSnap.data();
					setRestaurant(restaurantData);
				} else {
					console.log('No such document!');
				}
			} catch (error) {
				console.error('Error fetching restaurant:', error);
			}
		};

		fetchRestaurant();
	}, [restaurantId]);

	const handleAddToCart = () => {
		const meal = {
			id: mealId,
			name: mealName,
			price: parseFloat(mealPrice),
		};
		addToCart(restaurantId, meal, selectedExtras, selectedProteins, extras, protein);
		setCartTotal((prev) => prev + parseFloat(mealPrice));
		setCartItemCount((prev) => prev + 1);
	};

	const handleRemoveFromCart = () => {
		if (cartItemCount > 0) {
			setCartTotal((prev) => prev - parseFloat(mealPrice));
			setCartItemCount((prev) => prev - 1);
		}
	};

	const handleSelectExtra = (key, price) => {
		if (selectedExtras.includes(key)) {
			setSelectedExtras((prev) => prev.filter((item) => item !== key));
			setCartTotal((prev) => prev - price);
		} else {
			setSelectedExtras((prev) => [...prev, key]);
			setCartTotal((prev) => prev + price);
		}
	};

	const handleSelectProtein = (key, price) => {
		if (selectedProteins.includes(key)) {
			setSelectedProteins((prev) => prev.filter((item) => item !== key));
			setCartTotal((prev) => prev - price);
		} else {
			setSelectedProteins((prev) => [...prev, key]);
			setCartTotal((prev) => prev + price);
		}
	};

	return (
		<View style={styles.container}>
			{/* Fixed Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.locationText}>
					{restaurant?.name || 'Restaurant'}
				</Text>
				<Pressable onPress={() => setIsFavorited(!isFavorited)}>
					<MaterialIcons
						name={isFavorited ? 'favorite' : 'favorite-border'}
						size={24}
						color="#FF521B"
					/>
				</Pressable>
			</View>

			<ScrollView style={styles.content}>
				{/* Meal Image and Basic Info Card */}
				<View style={styles.mealCard}>
					<Image
						source={
							mealImageUrl
								? { uri: mealImageUrl }
								: require('../assets/placeholder.jpg')
						}
						style={styles.mealImage}
						resizeMode="cover"
					/>
					<View style={styles.mealInfo}>
						<Text style={styles.mealName}>{mealName}</Text>
						<Text style={styles.mealDescription}>{mealDescription}</Text>
						<Text style={styles.mealPrice}>₦{mealPrice}</Text>
					</View>
				</View>

				{/* Extras Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Extras</Text>
					{extras && Object.keys(extras).length > 0 ? (
						Object.entries(extras).map(([key, extra]) => (
							<Pressable
								key={key}
								style={styles.optionCard}
								onPress={() => handleSelectExtra(key, extra.price)}
							>
								<View style={styles.optionInfo}>
									<Text style={styles.optionName}>{extra.name}</Text>
									<Text style={styles.optionPrice}>₦{extra.price}</Text>
								</View>
								<View
									style={[
										styles.checkbox,
										selectedExtras.includes(key) && styles.checkboxChecked,
									]}
								>
									{selectedExtras.includes(key) && (
										<MaterialIcons name="check" size={16} color="white" />
									)}
								</View>
							</Pressable>
						))
					) : (
						<Text style={styles.noItemsText}>No extras available</Text>
					)}
				</View>

				{/* Protein Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Protein</Text>
					{protein && Object.keys(protein).length > 0 ? (
						Object.entries(protein).map(([key, item]) => (
							<Pressable
								key={key}
								style={styles.optionCard}
								onPress={() => handleSelectProtein(key, item.price)}
							>
								<View style={styles.optionInfo}>
									<Text style={styles.optionName}>{item.name}</Text>
									<Text style={styles.optionPrice}>₦{item.price}</Text>
								</View>
								<View
									style={[
										styles.checkbox,
										selectedProteins.includes(key) && styles.checkboxChecked,
									]}
								>
									{selectedProteins.includes(key) && (
										<MaterialIcons name="check" size={16} color="white" />
									)}
								</View>
							</Pressable>
						))
					) : (
						<Text style={styles.noItemsText}>No protein options available</Text>
					)}
				</View>
			</ScrollView>

			{/* Bottom Action Bar */}
			<View style={styles.bottomBar}>
				<View style={styles.cartActions}>
					<Pressable
						style={styles.cartButton}
						onPress={handleRemoveFromCart}
					>
						<Text style={styles.cartButtonText}>-</Text>
					</Pressable>
					<Text style={styles.cartCount}>{cartItemCount}</Text>
					<Pressable
						style={styles.cartButton}
						onPress={handleAddToCart}
					>
						<Text style={styles.cartButtonText}>+</Text>
					</Pressable>
				</View>
				<Pressable
					style={styles.viewCartButton}
					onPress={() => navigation.navigate('Cart', { restaurantId })}
				>
					<Text style={styles.viewCartText}>View Cart</Text>
					<Text style={styles.cartTotal}>₦{cartTotal.toFixed(2)}</Text>
				</Pressable>
			</View>
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
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	content: {
		flex: 1,
	},
	mealCard: {
		backgroundColor: 'white',
		margin: 16,
		borderRadius: 8,
		elevation: 2,
		overflow: 'hidden',
	},
	mealImage: {
		width: '100%',
		height: 200,
		backgroundColor: '#F0F0F0',
	},
	mealInfo: {
		padding: 16,
	},
	mealName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#2A324B',
		marginBottom: 8,
	},
	mealDescription: {
		fontSize: 16,
		color: '#666',
		marginBottom: 8,
		lineHeight: 22,
	},
	mealPrice: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	section: {
		backgroundColor: 'white',
		margin: 16,
		marginTop: 0,
		padding: 16,
		borderRadius: 8,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2A324B',
		marginBottom: 16,
	},
	optionCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	optionInfo: {
		flex: 1,
	},
	optionName: {
		fontSize: 16,
		color: '#2A324B',
		marginBottom: 4,
	},
	optionPrice: {
		fontSize: 14,
		color: '#FF521B',
		fontWeight: '500',
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#FF521B',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 12,
	},
	checkboxChecked: {
		backgroundColor: '#FF521B',
	},
	noItemsText: {
		fontSize: 16,
		color: '#666',
		fontStyle: 'italic',
		textAlign: 'center',
		paddingVertical: 16,
	},
	bottomBar: {
		backgroundColor: 'white',
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	cartActions: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16,
	},
	cartButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#FF521B',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cartButtonText: {
		color: 'white',
		fontSize: 20,
		fontWeight: 'bold',
	},
	cartCount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2A324B',
		marginHorizontal: 16,
	},
	viewCartButton: {
		flex: 1,
		backgroundColor: '#FF521B',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
	},
	viewCartText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	cartTotal: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
