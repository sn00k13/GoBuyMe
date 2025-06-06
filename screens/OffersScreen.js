import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const offers = [
	{
		id: '1',
		title: '10% OFF on First Order',
		description: 'Enjoy 10% discount on your first purchase. Use code: FIRST10',
		validTill: 'Valid till June 30',
	},
	{
		id: '2',
		title: 'Free Delivery',
		description: 'Get free delivery on orders above ₦10,000.',
		validTill: 'Valid till July 15',
	},
	{
		id: '3',
		title: 'Refer & Earn',
		description: 'Refer a friend and earn ₦500 wallet credit.',
		validTill: 'No expiry',
	},
];

export default function OffersScreen({ navigation }) {
	return (
		<View style={styles.container}>
			{/* Back Button */}
			<Pressable
				style={styles.backButton}
				onPress={() => navigation.toggleDrawer()}
			>
				<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
			</Pressable>
			<Text style={styles.title}>Available Offers</Text>
			<FlatList
				data={offers}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: 32 }}
				renderItem={({ item }) => (
					<View style={styles.offerCard}>
						<Text style={styles.offerTitle}>{item.title}</Text>
						<Text style={styles.offerDesc}>{item.description}</Text>
						<Text style={styles.offerValid}>{item.validTill}</Text>
					</View>
				)}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<MaterialIcons name="local-offer" size={48} color="#ccc" />
						<Text style={styles.emptyText}>
							No offers available at the moment
						</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFF9F7',
		paddingTop: 40,
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	backButtonText: {
		color: '#0B3948',
		fontSize: 16,
		marginLeft: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 18,
	},
	offerCard: {
		backgroundColor: '#FFF',
		borderRadius: 10,
		padding: 18,
		marginBottom: 18,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	offerTitle: {
		fontSize: 17,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 6,
	},
	offerDesc: {
		fontSize: 15,
		color: '#444',
		marginBottom: 8,
	},
	offerValid: {
		fontSize: 13,
		color: '#58A4B0',
		fontStyle: 'italic',
	},
	emptyContainer: {
		alignItems: 'center',
		marginTop: 40,
	},
	emptyText: {
		marginTop: 10,
		fontSize: 16,
		color: '#aaa',
	},
});
