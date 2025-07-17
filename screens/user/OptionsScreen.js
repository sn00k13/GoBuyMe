// screens/OptionsScreen.js
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';

export default function OptionsScreen({ navigation }) {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F7' }}>
			<View style={styles.container}>
				<Pressable
					style={styles.optionItem}
					onPress={() => navigation.navigate('Profile')}
				>
					<Text style={styles.optionText}>My Profile</Text>
				</Pressable>

				{/* Add more options later */}
				<Pressable style={styles.optionItem}>
					<Text style={styles.optionText}>Settings</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#FFF9F7',
	},
	optionItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	optionText: {
		fontSize: 16,
		color: '#2E2E2E',
	},
	backButtonText: {
		fontSize: 16,
		color: '#FF521B',
	},
});
