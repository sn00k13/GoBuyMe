import React, { useEffect, useState } from 'react';
import {
	StyleSheet,
	Text,
	View,
	Pressable,
	FlatList,
	Image,
	TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert } from 'react-native';
import { useStoreCart } from './StoreCartContext';

function SelectProductScreen({ navigation, route }) {
	const [categories, setCategories] = useState([]);
	const [activeCategory, setActiveCategory] = useState(
		route?.params?.selectedCategory
	);
	const [activeSubcategory, setActiveSubcategory] = useState(null);
	const [quantities, setQuantities] = useState({});
	const { getCart, setCart } = useStoreCart();
	const [cartItemCount, setCartItemCount] = useState(0);

	// Get storeId from navigation params or fallback to a default
	const storeId = route?.params?.storeId || 'J3GO05mnhnoccDG9Bchc';

	// Initialize quantities from cart when component mounts and update cart count
	useEffect(() => {
		const cartItems = getCart(storeId);
		if (cartItems.length > 0) {
			const initialQuantities = {};
			cartItems.forEach(item => {
				initialQuantities[item.name] = item.quantity;
			});
			setQuantities(initialQuantities);
			updateCartCount(initialQuantities);
		}
	}, [storeId]);

	// Update cart count whenever quantities change
	const updateCartCount = (newQuantities) => {
		const count = Object.values(newQuantities).reduce(
			(sum, q) => sum + (parseInt(q, 10) || 0),
			0
		);
		setCartItemCount(count);
	};

	const handleQuantityChange = (key, value) => {
		const newQuantities = {
			...quantities,
			[key]: value.replace(/[^0-9]/g, ''), // Only allow numbers
		};
		setQuantities(newQuantities);
		updateCartCount(newQuantities);
		
		// Update cart when quantity changes
		const cartItems = products
			.filter(item => parseInt(newQuantities[item.name], 10) > 0)
			.map(item => ({
				...item,
				quantity: newQuantities[item.name],
			}));
		setCart(storeId, cartItems);
	};

	const increment = (key) => {
		const newQuantities = {
			...quantities,
			[key]: String(parseInt(quantities[key] || '0', 10) + 1),
		};
		setQuantities(newQuantities);
		updateCartCount(newQuantities);
		
		// Update cart when quantity changes
		const cartItems = products
			.filter(item => parseInt(newQuantities[item.name], 10) > 0)
			.map(item => ({
				...item,
				quantity: newQuantities[item.name],
			}));
		setCart(storeId, cartItems);
	};

	const decrement = (key) => {
		const newQuantities = {
			...quantities,
			[key]: String(Math.max(0, parseInt(quantities[key] || '0', 10) - 1)),
		};
		setQuantities(newQuantities);
		updateCartCount(newQuantities);
		
		// Update cart when quantity changes
		const cartItems = products
			.filter(item => parseInt(newQuantities[item.name], 10) > 0)
			.map(item => ({
				...item,
				quantity: newQuantities[item.name],
			}));
		setCart(storeId, cartItems);
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
			? Object.values(activeSubcategoryObj).filter(
					(item) => typeof item === 'object' && item.name // filter out non-product fields
			  )
			: [];
	const cartItems = products
		.filter((item) => parseInt(quantities[item.name], 10) > 0)
		.map((item) => ({
			...item,
			quantity: quantities[item.name],
		}));
	// Render each product card
	const renderProductCard = ({ item }) => (
		<View style={styles.productCard}>
			<View style={styles.imagenTitle}>
				<Image
					source={
						item.imgUrl
							? { uri: item.imgUrl }
							: require('../assets/placeholder.jpg')
					}
					style={styles.productImage}
					resizeMode="cover"
				/>
				<Text style={styles.productName}>{item.name}</Text>
			</View>
			<View style={styles.pricenSize}>
				<Text style={styles.productSize}>{item.size}</Text>
				<Text style={styles.productPrice}>₦{item.price}</Text>
			</View>
			<View style={styles.addToCartAlt}>
				<Pressable
					style={styles.cartButton}
					onPress={() => decrement(item.name)}
				>
					<Text style={styles.cartButtonText}>-</Text>
				</Pressable>
				<View style={styles.quantityBox}>
					<Text style={styles.quantityText}>
						{quantities[item.name] || '0'}
					</Text>
				</View>
				<Pressable
					style={styles.cartButton}
					onPress={() => increment(item.name)}
				>
					<Text style={styles.cartButtonText}>+</Text>
				</Pressable>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable
					onPress={() => {
						Alert.alert(
							'Leave this page?',
							'Your cart for this store will be cleared if you go back. Are you sure?',
							[
								{ text: 'Cancel', style: 'cancel' },
								{
									text: 'Yes',
									style: 'destructive',
									onPress: () => navigation.goBack(),
								},
							]
						);
					}}
				>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
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
			<View style={styles.subcategoryList}>
				<FlatList
					data={subcategories}
					renderItem={renderSubcategory}
					keyExtractor={(item, idx) => item.key + idx}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.horizontalList}
				/>
			</View>
			<View style={styles.productsGrid}>
				<FlatList
					data={products}
					renderItem={renderProductCard}
					keyExtractor={(item, idx) => item.name + idx}
					numColumns={3}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 24 }}
					ListEmptyComponent={
						<Text style={{ textAlign: 'center', color: '#aaa', marginTop: 24 }}>
							No products found.
						</Text>
					}
				/>
			</View>
			<View style={styles.cartFab}>
				<Pressable
					style={styles.cartButtonFab}
					onPress={() => navigation.navigate('EMartCartDetails', { 
						cartItems,
						storeId 
					})}
				>
					<MaterialIcons name="shopping-cart" size={28} color="#fff" />
					{cartItemCount > 0 && (
						<View style={styles.cartCounter}>
							<Text style={styles.cartCounterText}>
								{cartItemCount}
							</Text>
						</View>
					)}
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
		paddingHorizontal: 8,
		paddingBottom: 24,
		marginTop: 10,
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
