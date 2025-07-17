import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform, SafeAreaView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import Recaptcha from 'react-native-recaptcha-that-works';
import { RECAPTCHA_CONFIG } from '../../config';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaRef = useRef();
  
  // Track form changes to determine if user is likely human
  const [formInteractions, setFormInteractions] = useState(0);
  const isLikelyHuman = formInteractions > 3; // Consider user likely human after 3 field interactions

  const handleFieldChange = (value, setter) => {
    setter(value);
    setFormInteractions(prev => prev + 1);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill all fields');
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save additional data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: new Date(),
      });
      
      Alert.alert('Registration Successful', 'Welcome to GoBuyMe! Attack that hunger');
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
    console.warn('reCAPTCHA Error:', err);
    // If reCAPTCHA fails, allow registration if user seems human
    if (isLikelyHuman) {
      setIsVerified(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={(value) => handleFieldChange(value, setName)}
          style={styles.input}
        />
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(value) => handleFieldChange(value, setEmail)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(value) => handleFieldChange(value, setPassword)}
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
        
        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={(value) => handleFieldChange(value, setPhone)}
          keyboardType="phone-pad"
          style={styles.input}
        />

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
          style={[
            styles.button,
            isLoading && styles.buttonDisabled
          ]}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Registering...' : 'Register'}
          </Text>
        </Pressable>
        
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </Pressable>
      </View>
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
});