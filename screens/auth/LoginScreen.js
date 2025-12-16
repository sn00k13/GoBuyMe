import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ImageBackground,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { validate, validators } from '../../utils/validation';

export default function LoginScreen({ navigation }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});

	const validateField = (field, value) => {
		const rules = {
			email: [validators.required, validators.email],
			password: [validators.required, validators.minLength(6)],
		};

		const error = validate(value, rules[field] || []);
		setErrors(prev => ({ ...prev, [field]: error === true ? '' : error }));
		return error === true;
	};

	const handleLogin = async () => {
		// Validate all fields
		const isEmailValid = validateField('email', email);
		const isPasswordValid = validateField('password', password);

		if (!isEmailValid || !isPasswordValid) {
			return;
		}

		try {
			await signInWithEmailAndPassword(auth, email, password);
			navigation.replace('HomeMain'); // Navigate to Home screen on successful login
		} catch (error) {
			Alert.alert('Login Error', 'User or password is incorrect');
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
						onChangeText={(value) => {
							setEmail(value);
							if (errors.email) {
								validateField('email', value);
							}
						}}
						onBlur={() => validateField('email', email)}
						keyboardType="email-address"
						autoCapitalize="none"
						style={[styles.input, errors.email && styles.inputError]}
					/>
					{errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

					<View style={styles.passwordContainer}>
						<TextInput
							placeholder="Password"
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={(value) => {
								setPassword(value);
								if (errors.password) {
									validateField('password', value);
								}
							}}
							onBlur={() => validateField('password', password)}
							style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
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
					{errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

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
							<Text style={styles.link}>Register</Text>
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
		maxWidth: 350, // Add this line
		alignSelf: 'center', // Add this line
		width: '100%', // Ensure it shrinks on small screens
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
	errorText: {
		color: '#ff4444',
		fontSize: 12,
		marginTop: -10,
		marginBottom: 10,
		marginLeft: 5,
	},
	inputError: {
		borderColor: '#ff4444',
	},
});
