import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const SettingsScreen = ({ navigation }) => {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => navigation.toggleDrawer()}>
					<MaterialIcons name="arrow-back" size={24} color="#FF521B" />
				</Pressable>
				<Text style={styles.locationText}>Settings</Text>
				<View style={{ width: 24 }}></View>
			</View>
			<ScrollView>
				<View style={styles.generalSettings}>
					<View>
						<Text style={styles.title}>General Settings</Text>
					</View>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('Appearance')}>
            <Entypo name="eye" size={18} color="#B3B3B3" />
						<Text>Appearance</Text>
					</Pressable>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('Language')}>
						<Ionicons name="language-outline" size={18} color="#B3B3B3" />
						<Text>Language and Input Settings</Text>
					</Pressable>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('DataStorage')}>
						<FontAwesome5 name="database" size={18} color="#B3B3B3" />
						<Text>Data and Storage</Text>
					</Pressable>
				</View>
        <View style={styles.generalSettings}>
					<View>
						<Text style={styles.title}>Notifications</Text>
					</View>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('NotificationsOptions')}>
          <FontAwesome6 name="gear" size={24} color="#B3B3B3" />
						<Text>Notification Options</Text>
					</Pressable>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('PushNotifications')}>
						<FontAwesome name="bell" size={24} color="#B3B3B3" />
						<Text>Push Notifications</Text>
					</Pressable>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('Chat')}>
						<MaterialIcons name="support-agent" size={24} color="#B3B3B3" />
						<Text>Live support</Text>
					</Pressable>
          <Pressable style={styles.listView}
          onPress={() => navigation.navigate('OffersScreen')}>
						<FontAwesome6 name="gift" size={24} color="#B3B3B3" />
						<Text>Offers</Text>
					</Pressable>
				</View>
        <View style={styles.generalSettings}>
					<View>
						<Text style={styles.title}>Privacy</Text>
					</View>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('Permissions')}>
          <FontAwesome6 name="universal-access" size={24} color="#B3B3B3" />
						<Text>Permissions</Text>
					</Pressable>
					
				</View>
        <View style={styles.generalSettings}>
					<View>
						<Text style={styles.title}>Legal</Text>
					</View>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('AboutScreen')}>
          <Entypo name="info-with-circle" size={18} color="#B3B3B3" />
						<Text>About</Text>
					</Pressable>
					<Pressable style={styles.listView}
          onPress={() => navigation.navigate('TermsService')}>
						<Octicons name="law" size={24} color="#B3B3B3" />
						<Text>Terms of Service</Text>
					</Pressable>
					
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	backButton: {
		marginTop: 20,
		marginBottom: 16,
	},
	backButtonText: {
		fontSize: 16,
		color: '#FF521B',
	},
	title: {
		fontSize: 16,
		fontWeight: 500,
		color: '#0B3948',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFF0EB',
	},
  locationText: {
    fontSize: 18,
    fontWeight: 400,
    color: '#0B3948',
  },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#7F9172',
		marginTop: 40,
	},
  listView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: '#B3B3B3',
    borderBottomWidth: 1,
    backgroundColor: 'white',
    padding: 16,
  }
});

export default SettingsScreen;
