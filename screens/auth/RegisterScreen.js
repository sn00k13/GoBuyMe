import { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	Platform,
	SafeAreaView,
	KeyboardAvoidingView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import Recaptcha from 'react-native-recaptcha-that-works';
import { RECAPTCHA_CONFIG } from '../../config';
import { validate, validators } from '../../utils/validation';
import logger from '../../utils/logger';

export default function RegisterScreen({ navigation }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [referralCode, setReferralCode] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isVerified, setIsVerified] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [validatingReferral, setValidatingReferral] = useState(false);
	const [isReferralValid, setIsReferralValid] = useState(false);
	const [errors, setErrors] = useState({});
	const recaptchaRef = useRef();

	// Track form changes to determine if user is likely human
	const [formInteractions, setFormInteractions] = useState(0);
	const isLikelyHuman = formInteractions > 3; // Consider user likely human after 3 field interactions

	// Helper function to generate random referral code
	const generateRandomCode = (length) => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	// Function to check if a referral code is unique
	const isReferralCodeUnique = async (code) => {
		try {
			const usersRef = collection(db, 'users');
			const q = query(usersRef, where('referralCode', '==', code));
			const querySnapshot = await getDocs(q);
			return querySnapshot.empty;
		} catch (error) {
			logger.error('Error checking referral code:', error);
			return false;
		}
	};

	// Function to validate a referral code
	const validateReferralCode = async (code) => {
		if (!code) return false;
		
		try {
			const usersRef = collection(db, 'users');
			const q = query(usersRef, where('referralCode', '==', code.toUpperCase()));
			const querySnapshot = await getDocs(q);
			return !querySnapshot.empty;
		} catch (error) {
			logger.error('Error validating referral code:', error);
			return false;
		}
	};

	// Function to generate a unique referral code
	const generateUniqueReferralCode = async () => {
		let isUnique = false;
		let referralCode = '';
		let attempts = 0;
		const maxAttempts = 5;

		while (!isUnique && attempts < maxAttempts) {
			attempts++;
			referralCode = generateRandomCode(8);
			isUnique = await isReferralCodeUnique(referralCode);
		}

		if (!isUnique) {
			// Fallback: use UID + timestamp as code
			const timestamp = Date.now().toString(36);
			const randomPart = Math.random().toString(36).substring(2, 6);
			referralCode = (timestamp + randomPart).toUpperCase().substring(0, 8);
		}

		return referralCode;
	};

	const validateField = (field, value) => {
		const rules = {
			name: [validators.required, validators.minLength(2)],
			email: [validators.required, validators.email],
			password: [validators.required, validators.minLength(6)],
			phone: [validators.required, validators.phone],
		};

		const error = validate(value, rules[field] || []);
		setErrors(prev => ({ ...prev, [field]: error === true ? '' : error }));
		return error === true;
	};

	const handleFieldChange = (value, setter, fieldName = null) => {
		setter(value);
		setFormInteractions((prev) => prev + 1);
		// Validate field if it has errors or if fieldName is provided
		if (fieldName && errors[fieldName]) {
			validateField(fieldName, value);
		}
	};

	// Check referral code when it changes
	useEffect(() => {
		const checkReferralCode = async () => {
			if (referralCode && referralCode.length >= 3) {
				setValidatingReferral(true);
				const isValid = await validateReferralCode(referralCode);
				setIsReferralValid(isValid);
				setValidatingReferral(false);
			} else {
				setIsReferralValid(false);
			}
		};

		const timeoutId = setTimeout(checkReferralCode, 500);
		return () => clearTimeout(timeoutId);
	}, [referralCode]);

	const handleRegister = async () => {
		// Validate all required fields
		const isNameValid = validateField('name', name);
		const isEmailValid = validateField('email', email);
		const isPasswordValid = validateField('password', password);
		const isPhoneValid = validateField('phone', phone);

		if (!isNameValid || !isEmailValid || !isPasswordValid || !isPhoneValid) {
			Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
			return;
		}

		if (referralCode && !isReferralValid) {
			Alert.alert('Invalid Referral Code', 'The referral code you entered is invalid. Please check and try again.');
			return;
		}

		setIsLoading(true);
		try {
			// Only show reCAPTCHA if user behavior seems suspicious
			if (!isVerified && !isLikelyHuman) {
				recaptchaRef.current.open();
				setIsLoading(false);
				return;
			}

			// Create auth user
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);

			// Generate unique referral code for the new user
			const userReferralCode = await generateUniqueReferralCode();

			// Find the referrer if a valid code was provided
			let referredBy = null;
			if (referralCode && isReferralValid) {
				const usersRef = collection(db, 'users');
				const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()));
				const querySnapshot = await getDocs(q);
				
				if (!querySnapshot.empty) {
					referredBy = querySnapshot.docs[0].id;
					
					// Update referrer's pending referrals
					const referrerRef = doc(db, 'users', referredBy);
					await updateDoc(referrerRef, {
						pendingReferrals: arrayUnion(email)
					});
				}
			}

			// Save additional data to Firestore with referral code
			const userData = {
				name,
				email,
				phone,
				referralCode: userReferralCode,
				referralCount: 0,
				earnedCredits: 0,
				pendingReferrals: [],
				hasFreeDelivery: false,        // Add this
				freeDeliveryUnlockedAt: null,  // Add this
				createdAt: new Date(),
			  };
			  
			  // Add referredBy field if applicable
			  if (referredBy) {
				userData.referredBy = referredBy;
				userData.hasCompletedReferral = false;
			  }

			await setDoc(doc(db, 'users', userCredential.user.uid), userData);

			Alert.alert(
				'Registration Successful',
				referredBy 
					? 'Welcome to GoBuyMe! You used a referral code and will receive credit after your first order.' 
					: 'Welcome to GoBuyMe! Attack that hunger'
			);
			navigation.replace('Login');
		} catch (error) {
			Alert.alert('Registration Failed', error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const onVerify = (token) => {
		setIsVerified(true);
		// Automatically proceed with registration after verification
		handleRegister();
	};

	const onExpire = () => {
		setIsVerified(false);
	};

	const onError = (err) => {
		logger.warn('reCAPTCHA Error:', err);
		// If reCAPTCHA fails, allow registration if user seems human
		if (isLikelyHuman) {
			setIsVerified(true);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
			<KeyboardAvoidingView style={styles.container}>
				<Text style={styles.title}>Create Account</Text>

				<TextInput
					placeholder="Full Name"
					value={name}
					onChangeText={(value) => handleFieldChange(value, setName, 'name')}
					onBlur={() => validateField('name', name)}
					style={[styles.input, errors.name && styles.inputError]}
				/>
				{errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

				<TextInput
					placeholder="Email"
					value={email}
					onChangeText={(value) => handleFieldChange(value, setEmail, 'email')}
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
						onChangeText={(value) => handleFieldChange(value, setPassword, 'password')}
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

				<TextInput
					placeholder="Phone Number"
					value={phone}
					onChangeText={(value) => handleFieldChange(value, setPhone, 'phone')}
					onBlur={() => validateField('phone', phone)}
					keyboardType="phone-pad"
					style={[styles.input, errors.phone && styles.inputError]}
				/>
				{errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

				<View>
					<TextInput
						placeholder="Referral Code (optional)"
						value={referralCode}
						onChangeText={(value) => handleFieldChange(value, setReferralCode)}
						style={[
							styles.input,
							referralCode && !validatingReferral && {
								borderColor: isReferralValid ? 'green' : 'red'
							}
						]}
					/>
					{referralCode && !validatingReferral && (
						<Text style={[
							styles.referralStatus,
							{ color: isReferralValid ? 'green' : 'red' }
						]}>
							{isReferralValid ? 'Valid referral code' : 'Invalid referral code'}
						</Text>
					)}
					{validatingReferral && (
						<Text style={styles.referralStatus}>Checking referral code...</Text>
					)}
				</View>

				<Recaptcha
					ref={recaptchaRef}
					siteKey={RECAPTCHA_CONFIG.siteKey}
					baseUrl={RECAPTCHA_CONFIG.baseUrl}
					onVerify={onVerify}
					onExpire={onExpire}
					onError={onError}
					size="invisible"
					enterprise
					hideBadge
				/>

				<Pressable
					onPress={handleRegister}
					style={[styles.button, isLoading && styles.buttonDisabled]}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>
						{isLoading ? 'Registering...' : 'Register'}
					</Text>
				</Pressable>

				<Pressable onPress={() => navigation.navigate('Login')}>
					<Text style={styles.link}>Already have an account? Login</Text>
				</Pressable>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 20,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		padding: 10,
		marginBottom: 15,
		backgroundColor: '#f9f9f9',
	},
	passwordContainer: {
		position: 'relative',
		marginBottom: 15,
	},
	passwordInput: {
		marginBottom: 0,
		paddingRight: 50,
	},
	eyeIcon: {
		position: 'absolute',
		right: 12,
		top: 12,
		padding: 2,
	},
	button: {
		backgroundColor: '#FF521B',
		padding: 15,
		borderRadius: 4,
		alignItems: 'center',
		marginTop: 10,
	},
	buttonDisabled: {
		backgroundColor: '#ccc',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
	},
	link: {
		color: '#5E5EFF',
		marginTop: 15,
		textAlign: 'center',
	},
	referralStatus: {
		fontSize: 12,
		marginTop: -10,
		marginBottom: 15,
		marginLeft: 10,
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