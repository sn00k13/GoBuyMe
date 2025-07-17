// screens/VendorListScreen.js
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';

export default function OrderHistoryScreen({ navigation }) {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F7' }}>
			<View style={styles.container}>
				{/* Back Button */}
				<Pressable
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.backButtonText}>← Back</Text>
				</Pressable>
				<Text style={styles.title}>Order History</Text>
				<Text>
					This screen will show order history and ability to repeat order.
				</Text>
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
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
	},
});
