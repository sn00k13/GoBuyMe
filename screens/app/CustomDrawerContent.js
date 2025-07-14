import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import {
	DrawerContentScrollView,
	DrawerItemList,
} from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { useTheme } from '../../utils/ThemeContext';

const CustomDrawerContent = (props) => {
	const { theme, mode, setMode } = useTheme();
	return (
		<View style={styles.container}>
			{/* Custom Header */}
			<View style={[styles.header, { backgroundColor: theme.cards, borderBottomColor: theme.borderBottom }]}>
				<Image source={require('../../assets/logo.png')} style={styles.logo} />				
			</View>

			{/* Scrollable Content */}
			<View style={[styles.scrollContainer, { backgroundColor: theme.cards }]}>
				<DrawerContentScrollView {...props}>
					<DrawerItemList {...props} />
				</DrawerContentScrollView>
			</View>

			{/* Fixed Footer with Sign Out */}
			<View style={[styles.footer, { backgroundColor: theme.cards, borderTopColor: theme.borderBottom }]}>
				<Pressable
					style={styles.logoutButton}
					onPress={async () => {
						const auth = getAuth();
						try {
							await signOut(auth);
							console.log('User signed out successfully');
							props.navigation.navigate('Home', { screen: 'Login' }); // Navigate to the Login screen
						} catch (error) {
							console.error('Error signing out:', error);
						}
					}}
				>
					<MaterialIcons name="logout" size={20} color="#FF6B6B" />
					<Text style={styles.logoutText}>Sign Out</Text>
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF',
	},
	header: {
		padding: 20,
		borderBottomWidth: 1,
		alignItems: 'center',
	},
	logo: {
		width: 100,
		height: 150,
		marginBottom: 10,
		marginTop: 40,
	},
	appName: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	scrollContainer: {
		flex: 1, // Takes all available space between header and footer
	},
	footer: {
		padding: 20,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
	},
	logoutText: {
		marginLeft: 10,
		fontSize: 16,
		color: '#FF6B6B',
	},
});

export default CustomDrawerContent;
