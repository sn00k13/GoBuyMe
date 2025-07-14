// screens/VendorListScreen.js
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function FavoritesScreen({ navigation }) {
	return (
		<View style={styles.container}>
			{/* Back Button */}
			<Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
				<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
			</Pressable>
			<Text style={styles.title}>Favorite Items You like ordering</Text>
			<Text>This screen will show Favorite Items You like ordering</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFF9F7',
		marginTop: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
	},
});
