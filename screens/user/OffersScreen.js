import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	FlatList,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

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
	const { theme, mode, setMode } = useTheme();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={styles.header}>
				{/* Back Button */}
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={styles.title}>Available Offers</Text>
				<View></View>
			</View>
			<FlatList
				data={offers}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: 32 }}
				renderItem={({ item }) => (
					<View style={[styles.offerCard, { backgroundColor: theme.cards }]}>
						<Text style={[styles.offerTitle, { color: theme.secondary }]}>
							{item.title}
						</Text>
						<Text style={[styles.offerDesc, { color: theme.text }]}>
							{item.description}
						</Text>
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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFF0EB',
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
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	offerCard: {
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 18,
		margin: 16,
		marginTop: 0,
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
