// LandingScreen.js
import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	StyleSheet,
	SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingScreen = () => {
	const navigation = useNavigation();

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFF0EB' }}>
			<View style={styles.container}>
				{/* App Logo/Title Section */}
				<View style={styles.header}>
					<Image
						source={require('../../assets/logo.png')}
						style={styles.logo}
					/>
					<Text style={styles.title}>GoBuyMe</Text>
					<Text style={styles.subtitle}>
						Your favorite meals, delivered fast
					</Text>
				</View>

				{/* Action Buttons */}
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={[styles.button, styles.primaryButton]}
						onPress={() => navigation.navigate('Register')}
					>
						<Text style={styles.buttonText}>Create Account</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.secondaryButton]}
						onPress={() => navigation.navigate('Login')}
					>
						<Text style={[styles.buttonText, styles.secondaryButtonText]}>
							Sign In
						</Text>
					</TouchableOpacity>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>By continuing, you agree to our</Text>
					<View style={styles.linksContainer}>
						<TouchableOpacity
							onPress={() => navigation.navigate('TermsService')}
						>
							<Text style={styles.linkText}>Terms of Service</Text>
						</TouchableOpacity>
						<Text style={styles.footerText}> and </Text>
						<TouchableOpacity
							onPress={() => navigation.navigate('Permissions')}
						>
							<Text style={styles.linkText}>Privacy Policy</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
		padding: 20,
		justifyContent: 'space-between',
	},
	header: {
		alignItems: 'center',
		marginTop: 60,
	},
	logo: {
		width: 120,
		height: 120,
		marginBottom: 20,
		resizeMode: 'contain',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#7F9172',
	},
	buttonContainer: {
		marginLeft: 20,
		marginRight: 20,
		marginBottom: 40,
	},
	button: {
		padding: 16,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	primaryButton: {
		backgroundColor: '#FF521B',
	},
	secondaryButton: {
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#FF521B',
	},
	buttonText: {
		fontSize: 16,
		color: '#FFFFFF',
	},
	secondaryButtonText: {
		color: '#FF521B',
	},
	footer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	footerText: {
		color: '#7F9172',
		fontSize: 12,
	},
	linksContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	linkText: {
		color: '#0B3948',
		fontSize: 12,
		textDecorationLine: 'underline',
	},
});

export default LandingScreen;
