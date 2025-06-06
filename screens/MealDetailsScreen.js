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
import { RadioButton } from 'react-native-paper'; // Import RadioButton if using react-native-paper
import { CheckBox } from 'react-native-elements'; // Import CheckBox

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
	const [selectedExtra, setSelectedExtra] = useState(null);
	const [selectedProtein, setSelectedProtein] = useState(null);
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
					console.log('Fetched restaurant data:', restaurantData); // Debugging
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
		addToCart(restaurantId, mealPrice);
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
			// Deselect the item
			setSelectedExtras((prev) => prev.filter((item) => item !== key));
			setCartTotal((prev) => prev - price);
		} else {
			// Select the item
			setSelectedExtras((prev) => [...prev, key]);
			setCartTotal((prev) => prev + price);
		}
	};

	const handleSelectProtein = (key, price) => {
		if (selectedProteins.includes(key)) {
			// Deselect the item
			setSelectedProteins((prev) => prev.filter((item) => item !== key));
			setCartTotal((prev) => prev - price);
		} else {
			// Select the item
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
					{restaurant?.location || 'Owerri'}
				</Text>
				<Pressable onPress={() => setIsFavorited(!isFavorited)}>
					<MaterialIcons
						name={isFavorited ? 'favorite' : 'favorite-border'}
						size={24}
						color="#FF521B"
					/>
				</Pressable>
			</View>
			<View style={styles.restaurantCard}>
				<Image
					source={
						mealImageUrl
							? { uri: mealImageUrl } // Use the imageUrl from the database
							: require('../assets/placeholder.jpg') // Fallback image
					}
					style={styles.mealImage}
					resizeMode="cover"
				/>
				<Text style={styles.title}>{mealName}</Text>
				<Text style={styles.detail}>{mealDescription}</Text>

				<Text style={styles.detail2}>Price: ₦{mealPrice}</Text>
				<View style={styles.addToCartView}>
					<Pressable onPress={handleAddToCart} style={styles.addToCartButton}>
						<Text style={styles.addToCart}>Add to Cart</Text>
					</Pressable>
					<Pressable
						onPress={handleRemoveFromCart}
						style={styles.addToCartButton2}
					>
						<Text style={styles.addToCart}>Remove Item</Text>
					</Pressable>
				</View>
			</View>
			<ScrollView style={styles.menuScrollContainer}>
				<View>
					{/* Render Extras */}
					<Text style={styles.sectionTitle}>Extras</Text>
					{extras && Object.keys(extras).length > 0 ? (
						Object.entries(extras).map(([key, extra]) => (
							<CustomCheckbox
								key={key}
								isChecked={selectedExtras.includes(key)}
								onPress={() => handleSelectExtra(key, extra.price)}
								label={extra.name}
								price={extra.price}
							/>
						))
					) : (
						<Text style={styles.noItemsText}>No extras available</Text>
					)}

					{/* Render Protein */}
					<Text style={styles.sectionTitle}>Protein</Text>
					{protein && Object.keys(protein).length > 0 ? (
						Object.entries(protein).map(([key, item]) => (
							<CustomCheckbox
								key={key}
								isChecked={selectedProteins.includes(key)}
								onPress={() => handleSelectProtein(key, item.price)}
								label={item.name}
								price={item.price}
							/>
						))
					) : (
						<Text style={styles.noItemsText}>No protein options available</Text>
					)}
				</View>
			</ScrollView>

			<Pressable
				style={styles.cartIcon}
				onPress={() => navigation.navigate('Cart', { restaurantId, cartTotal })}
			>
				<FontAwesome name="shopping-basket" size={42} color="#2e1e0f" />
				<Text style={styles.cartTotal}>₦ {cartTotal.toFixed(2)}</Text>
				{cartItemCount > 0 && (
					<View style={styles.cartItemCount}>
						<Text style={styles.cartItemCountText}>{cartItemCount}</Text>
					</View>
				)}
			</Pressable>
			{console.log('Meal Image URL:', mealImageUrl)}
			{console.log('Restaurant Data:', restaurant)}
			{console.log('Breakfast Meals:', restaurant?.menuPreview?.breakfast)}
		</View>
	);
}

const CustomCheckbox = ({ isChecked, onPress, label, price }) => {
	return (
		<Pressable onPress={onPress} style={styles.checkboxRow}>
			<View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
				{isChecked && <View style={styles.checkboxInner} />}
			</View>
			<Text style={styles.checkboxLabel}>
				{label} - ₦{price}
			</Text>
		</Pressable>
	);
};

// Keep your existing styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF9F7',
	},
	menuScrollContainer: {
		flex: 1,
		padding: 16,
		paddingBottom: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
	},
	detail: {
		fontSize: 18,
		color: '#2A324B',
		marginBottom: 8,
		fontStyle: 'italic',
	},
	detail2: {
		fontSize: 18,
		color: '#2A324B',
		marginBottom: 8,
		fontWeight: 'bold',
	},
	cartIcon: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		backgroundColor: '#A2A79E',
		elevation: 5,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 10,
		height: 90,
		width: 110,
		paddingTop: 10,
	},
	cartTotal: {
		width: 110,
		backgroundColor: '#FF521B',
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FFF',
		marginTop: 5,
		padding: 5,
		textAlign: 'center',
		borderRadiusLeft: 0,
		borderRadiusRight: 0,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
	},
	cartItemCount: {
		position: 'absolute',
		top: 5,
		right: 5,
		backgroundColor: '#FF521B',
		borderRadius: '50%',
		height: 25,
		width: 25,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cartItemCountText: {
		color: '#FFF',
		fontSize: 13,
		fontWeight: 'bold',
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
	mealImage: {
		width: '100%',
		height: 200,
		aspectRatio: 16 / 9,
		borderRadius: 8,
		marginBottom: 16,
		overflow: 'hidden',
	},
	addToCartButton: {
		backgroundColor: '#4D8B31',
		padding: 10,
		// margin: 'auto',
		marginTop: 10,
		width: '40%',
		borderRadius: 8,
		alignItems: 'center',
	},
	addToCartButton2: {
		backgroundColor: '#832232',
		padding: 10,
		// margin: 'auto',
		marginTop: 10,
		width: '40%',
		borderRadius: 8,
		alignItems: 'center',
	},
	addToCart: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	addToCartView: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 8,
	},
	groupContainer: {
		marginBottom: 12,
	},
	itemText: {
		fontSize: 16,
		color: '#2A324B',
		marginBottom: 4,
	},
	noItemsText: {
		fontSize: 16,
		fontStyle: 'italic',
		color: '#777',
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	checkboxContainer: {
		backgroundColor: 'transparent',
		borderWidth: 0,
		padding: 0,
		margin: 0,
		marginBottom: 8,
	},
	checkboxText: {
		fontSize: 16,
		color: '#2A324B',
	},
	checkboxRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: '#2A324B',
		borderRadius: 4,
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: {
		backgroundColor: '#FF521B',
	},
	checkboxInner: {
		width: 12,
		height: 12,
		backgroundColor: '#FF521B',
	},
	checkboxLabel: {
		fontSize: 18,
		color: '#2A324B',
	},
});
