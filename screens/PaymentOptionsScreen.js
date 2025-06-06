// screens/VendorListScreen.js
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function PaymentOptionsScreen({ navigation }) {
  return (
    <View style={styles.container}>
            {/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.locationText}>Address and Billing</Text>
				<View style={{ width: 24 }} />
			</View>
      {/* Display Logged items here */}
      
      <Pressable onPress={() => navigation.navigate('Confirmation')}>
        <Text style={{ color: '#FF521B', fontSize: 18, marginTop: 20 }}>
          Proceed
        </Text>
      </Pressable>
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