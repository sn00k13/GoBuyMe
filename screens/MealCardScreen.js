import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ActivityIndicator,
	SafeAreaView,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MealCardScreen({ navigation, route }) {
	const { mealId } = route.params;
	const [meal, setMeal] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMeal = async () => {
			try {
				const docRef = doc(db, 'meals', mealId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					setMeal({ id: docSnap.id, ...docSnap.data() });
				} else {
					console.log('No such meal!');
				}
			} catch (error) {
				console.error('Error fetching meal:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchMeal();
	}, [mealId]);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	if (!meal) {
		return (
			<View style={styles.container}>
				<Text>Meal not found</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={styles.container}>
				<Image
					source={
						meal.imageUrl
							? { uri: meal.imageUrl }
							: require('../assets/placeholder.jpg')
					}
					style={styles.mealImage}
				/>
				<Text style={styles.mealName}>{meal.name}</Text>
				<Text style={styles.mealDescription}>
					{meal.description || 'No description available'}
				</Text>
				<Text style={styles.mealPrice}>₦{meal.price || '--'}</Text>
				{/* Add more meal details as needed */}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFF9F7',
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
		color: '#FF521B',
	},
	mealDescription: {
		fontSize: 16,
		marginBottom: 16,
		color: '#555',
	},
	mealPrice: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
	},
});
