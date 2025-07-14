import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function ResetPasswordSuccessScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Sent!</Text>
      <Text style={styles.message}>
        We've sent a password reset link to your email address.
      </Text>
      
      <Pressable 
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Return to Login</Text>
      </Pressable>
    </View>
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
    color: '#FF6B6B',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});