import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	Pressable,
	Image,
	FlatList,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import logoImg from '../../assets/logo.png';
import { useTheme } from '../../utils/ThemeContext';
const PLACEHOLDER_IMAGE = require('../../assets/placeholder.jpg');

function EmartScreen({ navigation, route }) {
	const [categories, setCategories] = useState([]);
	const [search, setSearch] = useState('');
	const [store, setStore] = useState(null);
	const { theme, mode, setMode } = useTheme();

	// You should pass storeId via navigation params, fallback to a default for dev
	const storeId = route?.params?.storeId || 'J3GO05mnhnoccDG9Bchc';

	useEffect(() => {
		const fetchStore = async () => {
			try {
				const storeRef = doc(db, 'stores', storeId);
				const storeSnap = await getDoc(storeRef);
				if (storeSnap.exists()) {
					const storeData = storeSnap.data();
					setStore(storeData);
					// If categories is a map, convert to array
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

	const filteredCategories = categories
		.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const renderCategory = ({ item }) => (
		<Pressable
			style={[styles.productCard, { backgroundColor: theme.cards }]}
			onPress={() =>
				navigation.navigate('SelectProductScreen', {
					categories, // pass the whole categories array
					selectedCategory: item.name, // or item.id if you have unique ids
				})
			}
		>
			<Image
				source={item.imgUrl ? { uri: item.imgUrl } : PLACEHOLDER_IMAGE}
				style={styles.productImage}
				resizeMode="cover"
			/>
			<Text style={[styles.productName, { color: theme.text }]}>
				{item.name}
			</Text>
		</Pressable>
	);

	const renderTodaysHoursWithStatus = () => {
		if (!store?.openingHours) {
			return (
				<Text style={[styles.noHoursText, { color: theme.text }]}>
					Opening hours not available
				</Text>
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
		const todaysHours = store.openingHours[today];

		if (!todaysHours) {
			return (
				<Text style={[styles.noHoursText, { color: theme.text }]}>
					Closed today
				</Text>
			);
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
					<Text style={[styles.todaysHoursText, { color: theme.secondary }]}>
						{hoursText}
					</Text>
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
				<Text style={[styles.todaysHoursLabel, { color: theme.text }]}>
					Today's Hours
				</Text>
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
				<Pressable onPress={() => navigation.navigate('VendorList')}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={styles.locationText}>eMart</Text>
				<View style={{ width: 24 }} />
			</View>

			{/* Store Card */}
			<View
				style={[
					styles.emartCard,
					{
						backgroundColor: theme.cards,
						borderBottomColor: theme.borderBottom,
					},
				]}
			>
				<View style={styles.cardContainer}>
					<Image
						style={styles.storeImageContainer}
						source={logoImg}
						resizeMode="contain"
					/>
					<View style={styles.storeDetails}>
						<View>
							<Text style={[styles.emartInfoTitle, { color: theme.text }]}>
								Payment:{' '}
							</Text>
							<Text style={[styles.emartInfDesc, { color: theme.text }]}>
								Bank Transfer, Cards and Cash on Delivery
							</Text>
						</View>
						<View>
							<Text style={[styles.emartInfoTitle, { color: theme.text }]}>
								Average Delivery Time:{' '}
							</Text>
							<Text style={[styles.emartInfDesc, { color: theme.text }]}>
								45mins
							</Text>
						</View>
						<View>
							<Text style={[styles.emartInfoTitle, { color: theme.text }]}>
								Minimum Order Amount:{' '}
							</Text>
							<Text style={[styles.emartInfDesc, { color: theme.text }]}>
								N3000
							</Text>
						</View>
					</View>
				</View>
				<View>
					<Text style={[styles.openingHours, { color: theme.text }]}>
						Opening Hours
					</Text>
					{renderTodaysHoursWithStatus()}
				</View>
			</View>
			<View style={styles.searchContainer}>
				<MaterialIcons
					name="search"
					size={20}
					color="#777"
					style={styles.searchIcon}
				/>
				<TextInput
					style={styles.searchInput}
					placeholder="Search eMart..."
					value={search}
					onChangeText={setSearch}
				/>
			</View>

			{/* Categories Grid */}
			<FlatList
				data={filteredCategories}
				renderItem={renderCategory}
				keyExtractor={(item, idx) => item.name + idx}
				numColumns={3}
				contentContainerStyle={styles.productsGrid}
				ListEmptyComponent={
					<Text style={{ textAlign: 'center', color: '#aaa', marginTop: 24 }}>
						No categories found.
					</Text>
				}
			/>
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
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	locationText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	emartCard: {
		marginTop: 5,
		alignItems: 'flex-start',
		padding: 16,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	storeImageContainer: {
		width: '40%',
		aspectRatio: 1,
	},
	storeDetails: {
		width: '60%',
		justifyContent: 'space-between',
	},
	cardContainer: {
		width: '100%',
		flexDirection: 'row',
		padding: 8,
	},
	openingHours: {
		fontWeight: 'bold',
	},
	emartInfoTitle: {
		fontWeight: 'bold',
	},
	emartInfDesc: {
		fontStyle: 'italic',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'white',
		borderRadius: 4,
		paddingHorizontal: 12,
		margin: 8,
		height: 45,
		elevation: 2,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: '#333',
	},
	productsGrid: {
		paddingHorizontal: 8,
		paddingBottom: 24,
	},
	productCard: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 12,
		margin: 6,
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 2,
		minWidth: 90,
		maxWidth: 120,
	},
	productImage: {
		width: 64,
		height: 64,
		borderRadius: 8,
		marginBottom: 8,
		backgroundColor: '#F0F0F0',
	},
	productName: {
		fontSize: 14,
		color: '#0B3948',
		textAlign: 'center',
		fontWeight: '500',
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
});

export default EmartScreen;
