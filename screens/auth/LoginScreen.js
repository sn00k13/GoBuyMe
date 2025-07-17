import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ImageBackground,
	SafeAreaView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const handleLogin = async () => {
		try {
			await signInWithEmailAndPassword(auth, email, password);
			navigation.replace('HomeMain'); // Navigate to Home screen on successful login
		} catch (error) {
			Alert.alert('Login Error', error.message);
		}
	};

	return (
		<ImageBackground
			source={require('../../assets/background.jpg')} // Replace with your image path
			style={styles.background}
		>
			{/* Tint overlay */}
			<View style={styles.overlay}>
				<View style={styles.container}>
					<Text style={styles.title}>Login</Text>

					<TextInput
						placeholder="Email"
						value={email}
						onChangeText={setEmail}
						style={styles.input}
					/>

					<View style={styles.passwordContainer}>
						<TextInput
							placeholder="Password"
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={setPassword}
							style={[styles.input, styles.passwordInput]}
						/>
						<Pressable
							onPress={() => setShowPassword(!showPassword)}
							style={styles.eyeIcon}
						>
							<MaterialIcons
								name={showPassword ? 'visibility-off' : 'visibility'}
								size={24}
								color="#666"
							/>
						</Pressable>
					</View>

					<Pressable
						onPress={handleLogin}
						style={({ pressed }) => [
							styles.loginButton,
							{ opacity: pressed ? 0.7 : 1 }, // This is the press effect
						]}
					>
						<Text style={styles.loginButtonText}>Login</Text>
					</Pressable>

					<View style={styles.subSection}>
						<Pressable onPress={() => navigation.navigate('ResetPassword')}>
							<Text style={styles.link}>Forgot Password?</Text>
						</Pressable>
						<Pressable onPress={() => navigation.navigate('Register')}>
							<Text style={styles.link}>Don't have an account? Register</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		resizeMode: 'cover', // Ensures the image covers the entire screen
	},
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)', // Black tint with 50% opacity
		justifyContent: 'center',
	},
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 20,
		maxWidth: 350,           // Add this line
		alignSelf: 'center',     // Add this line
		width: '100%',           // Ensure it shrinks on small screens
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#FFF', // White text for better contrast
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		padding: 15,
		marginBottom: 15,
		backgroundColor: '#FFF', // White background for inputs
	},
	passwordContainer: {
		position: 'relative',
		marginBottom: 15,
	},
	passwordInput: {
		marginBottom: 0,
		paddingRight: 50, // Make room for the eye icon
	},
	eyeIcon: {
		position: 'absolute',
		right: 12,
		top: 12,
		padding: 2,
	},
	loginButton: {
		backgroundColor: '#FF521B', // Your brand color
		padding: 15,
		borderRadius: 4,
		alignItems: 'center',
		marginBottom: 15,
	},
	loginButtonText: {
		color: 'white',
		// fontWeight: 'bold',
		fontSize: 16,
	},
	link: {
		color: '#C6CCB2',
		textAlign: 'center',
		fontSize: 13,
	},
	subSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 10,
	},
});
