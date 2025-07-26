import React, { useEffect, useState } from 'react';
import {
	StyleSheet,
	Text,
	View,
	Pressable,
	FlatList,
	Image,
	TextInput,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useStoreCart } from '../app/StoreCartContext';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';

function SelectProductScreen({ navigation, route }) {
	const [activeCategory, setActiveCategory] = useState(
		route?.params?.selectedCategory
	);
	const [activeSubcategory, setActiveSubcategory] = useState(null);
	const { theme, mode, setMode } = useTheme();
	const { getCart, updateCartItemQuantity, addToCart } = useStoreCart();
	const [categories, setCategories] = useState([]);
	const [cartItemCount, setCartItemCount] = useState(0);

	// Get storeId from navigation params or fallback to a default
	const storeId = route?.params?.storeId || 'J3GO05mnhnoccDG9Bchc';

	const cartItems = getCart(storeId);
	const cartCount = cartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

	const getProductQuantity = (productId) => {
		const cartItems = getCart(storeId);
		const cartItem = cartItems.find((ci) => ci.id === productId);
		return Number(cartItem?.quantity || 0);
	};

	const increment = (productId, productObj) => {
		const qty = getProductQuantity(productId);
		if (qty > 0) {
			updateCartItemQuantity(storeId, productId, qty + 1);
		} else {
			if (typeof addToCart === 'function') {
				addToCart(storeId, { ...productObj, id: productId, quantity: 1 });
			} else {
				updateCartItemQuantity(storeId, productId, 1);
			}
		}
	};

	const decrement = (productId) => {
		const qty = getProductQuantity(productId);
		if (qty > 0) {
			updateCartItemQuantity(storeId, productId, qty - 1);
		}
	};

	useEffect(() => {
		const fetchStore = async () => {
			try {
				const storeRef = doc(db, 'stores', storeId);
				const storeSnap = await getDoc(storeRef);
				if (storeSnap.exists()) {
					const storeData = storeSnap.data();
					let categoriesArray = [];
					if (
						storeData.categories &&
						typeof storeData.categories === 'object'
					) {
						categoriesArray = Object.values(storeData.categories);
					}
					setCategories(categoriesArray);
				} else {
					setCategories([]);
				}
			} catch (err) {
				console.log('Error fetching store:', err);
				setCategories([]);
			}
		};
		fetchStore();
	}, [storeId]);

	const sortedCategories = categories
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const selectedIndex = sortedCategories.findIndex(
		(item) => item.name === activeCategory
	);

	// Find the active top-level category object (e.g., alcohol)
	const activeCategoryObj = sortedCategories.find(
		(cat) => cat.name === activeCategory
	);

	// Get subcategory keys (e.g., beer, wine, etc.), filter out 'name' and other non-subcategory keys
	const subcategoryKeys = activeCategoryObj
		? Object.keys(activeCategoryObj).filter(
				(key) => key !== 'name' && typeof activeCategoryObj[key] === 'object'
		  )
		: [];

	// Build subcategories array with their names and order
	const subcategories = subcategoryKeys
		.map((key) => {
			const subcat = activeCategoryObj[key];
			return { key, name: subcat.name || key, order: subcat.order ?? 0 };
		})
		.sort((a, b) => a.order - b.order);

	// Set first subcategory as active on mount or when activeCategory changes
	useEffect(() => {
		if (subcategories.length > 0) {
			setActiveSubcategory(subcategories[0].key);
		} else {
			setActiveSubcategory(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeCategory, activeCategoryObj && subcategories.length]);

	const renderCategory = ({ item }) => (
		<Pressable
			onPress={() => setActiveCategory(item.name)}
			style={[
				styles.categoryItem,
				item.name === activeCategory && styles.selectedCategoryItem,
			]}
		>
			<Text
				style={[
					styles.categoryName,
					item.name === activeCategory && styles.selectedCategoryName,
				]}
			>
				{item.name}
			</Text>
		</Pressable>
	);

	const renderSubcategory = ({ item }) => (
		<Pressable
			style={[
				styles.subcategoryItem,
				item.key === activeSubcategory && styles.selectedSubcategoryItem,
			]}
			onPress={() => setActiveSubcategory(item.key)}
		>
			<Text
				style={[
					styles.subcategoryName,
					item.key === activeSubcategory && styles.selectedSubcategoryName,
				]}
			>
				{item.name}
			</Text>
		</Pressable>
	);

	// Get products for the active subcategory
	const activeSubcategoryObj =
		activeCategoryObj && activeSubcategory
			? activeCategoryObj[activeSubcategory]
			: null;

	// If products are stored as a map (e.g., beer1, beer2, ...), convert to array
	const products =
		activeSubcategoryObj && typeof activeSubcategoryObj === 'object'
			? Object.values(activeSubcategoryObj)
				.filter((item) => typeof item === 'object' && item.name) // filter out non-product fields
				.map((item) => ({
					...item,
					id: item.id || `${item.name}_${item.size || ''}` // assign stable id if missing
				}))
			: [];

	// Render each product card
	const renderProductCard = ({ item }) => (
		<View style={[styles.productCard, { backgroundColor: theme.cards }]}>
			<View style={styles.imagenTitle}>
				<Image
					source={
						item.imgUrl
							? { uri: item.imgUrl }
							: require('../../assets/placeholder.jpg')
					}
					style={styles.productImage}
					resizeMode="cover"
				/>
				<Text style={[styles.productName, { color: theme.secondary }]}>
					{item.name}
				</Text>
			</View>
			<View style={styles.pricenSize}>
				<Text style={[styles.productSize, { color: theme.text }]}>
					{item.size}
				</Text>
				<Text style={[styles.productPrice, { color: theme.text }]}>
					₦{item.price}
				</Text>
			</View>
			<View style={styles.addToCartAlt}>
				<Pressable
					style={styles.cartButton}
					onPress={() => decrement(item.id)}
				>
					<Text style={styles.cartButtonText}>-</Text>
				</Pressable>
				<View
					style={[
						styles.quantityBox,
						{ backgroundColor: theme.background, borderColor: theme.accent },
					]}
				>
					<Text style={[styles.quantityText, { color: theme.text }]}>
						{getProductQuantity(item.id)}
					</Text>
				</View>
				<Pressable
					style={styles.cartButton}
					onPress={() => increment(item.id, item)}
				>
					<Text style={styles.cartButtonText}>+</Text>
				</Pressable>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{ backgroundColor: theme.cards, borderBottomColor: theme.border },
				]}
			>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={styles.locationText}>Select Products</Text>
				<View style={{ width: 24 }} />
			</View>
			{/* Horizontal category list */}
			<View style={styles.categoryList}>
				<FlatList
					data={sortedCategories}
					renderItem={renderCategory}
					keyExtractor={(item, idx) => item.name + idx}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.horizontalList}
					initialScrollIndex={selectedIndex > 0 ? selectedIndex : 0}
					getItemLayout={(_, index) => ({
						length: 100,
						offset: 100 * index,
						index,
					})}
				/>
			</View>
			{/* Horizontal subcategory list with highlight */}
			<View style={[styles.subcategoryList, { backgroundColor: theme.cards }]}>
				<FlatList
					data={subcategories}
					renderItem={renderSubcategory}
					keyExtractor={(item, idx) => item.key + idx}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.horizontalList}
				/>
			</View>
			<FlatList
				style={[styles.productsGrid, { backgroundColor: theme.background }]}
				data={products}
				renderItem={renderProductCard}
				keyExtractor={(item, idx) => item.name + idx}
				numColumns={3}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.productsContainer}
				ListEmptyComponent={
					<Text style={styles.emptyText}>No available products found.</Text>
				}
			/>
			<View style={styles.cartFab}>
				<Pressable
					style={styles.cartButtonFab}
					onPress={() =>
						navigation.navigate('EMartCartDetails', {
							cartItems: getCart(storeId),
							storeId,
						})
					}
				>
					<MaterialIcons
						name="shopping-cart"
						size={28}
						color={theme.background}
					/>
					{cartCount > 0 && (
						<View style={styles.cartCounter}>
							<Text style={styles.cartCounterText}>{cartCount}</Text>
						</View>
					)}
				</Pressable>
			</View>
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
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	categoryList: {
		paddingVertical: 8,
		backgroundColor: '#E14E1F',
	},
	horizontalList: {
		paddingHorizontal: 16,
	},
	categoryItem: {
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 4,
		backgroundColor: 'transparent',
		marginRight: 3,
		alignItems: 'center',
		justifyContent: 'center',
	},
	categoryName: {
		fontSize: 14,
		color: 'white',
	},
	selectedCategoryItem: {
		backgroundColor: 'white',
		borderColor: '#FF521B',
		borderWidth: 1,
	},
	selectedCategoryName: {
		color: '#E14E1F',
	},
	subcategoryList: {
		padding: 8,
		backgroundColor: '#FFF',
	},
	subcategoryItem: {
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 4,
		backgroundColor: 'transparent',
		marginRight: 3,
		alignItems: 'center',
		justifyContent: 'center',
	},
	selectedSubcategoryItem: {
		backgroundColor: '#E14E1F',
		borderColor: '#FF521B',
		borderWidth: 1,
	},
	subcategoryName: {
		fontSize: 14,
		color: '#E14E1F',
	},
	selectedSubcategoryName: {
		color: 'white',
	},
	productCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 6,
		margin: 6,
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 2,
		minWidth: 90,
		maxWidth: 120,
	},
	imagenTitle: {
		width: '100%',
		height: 110,
		alignItems: 'center',
		padding: 4,
	},
	productImage: {
		width: 64,
		height: 64,
		borderRadius: 8,
		marginBottom: 8,
		backgroundColor: '#F0F0F0',
	},
	productName: {
		fontSize: 13,
		color: '#0B3948',
		textAlign: 'center',
		fontWeight: '700',
	},
	pricenSize: {
		marginTop: 15,
		marginBottom: 10,
	},
	productSize: {
		minWidth: 100,
		fontSize: 13,
		color: '#0B3948',
		textAlign: 'left',
	},
	productPrice: {
		minWidth: 90,
		fontSize: 13,
		color: '#0B3948',
		textAlign: 'left',
	},
	productsGrid: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	productsContainer: {
		paddingHorizontal: 8,
		paddingBottom: 80, // Add extra padding for the FAB
	},
	emptyText: {
		textAlign: 'center',
		color: '#aaa',
		marginTop: 24,
	},
	addToCartAlt: {
		marginLeft: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
	},
	cartButton: {
		width: 30,
		height: 30,
		borderRadius: 4,
		backgroundColor: '#FF521B',
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 4,
	},
	cartButtonText: {
		color: 'white',
		fontSize: 20,
		// fontWeight: 'bold',
	},
	quantityBox: {
		minWidth: 30,
		height: 30,
		borderRadius: 4,
		backgroundColor: '#FFF0EB',
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 4,
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	quantityText: {
		fontSize: 16,
		color: '#FF521B',
		// fontWeight: 'bold',
	},
	cartFab: {
		position: 'absolute',
		bottom: 32,
		right: 24,
		zIndex: 100,
	},
	cartButtonFab: {
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

export default SelectProductScreen;
