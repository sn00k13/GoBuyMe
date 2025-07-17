import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Image,
	Linking,
	ScrollView,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export default function AboutScreen({ navigation }) {
	const { theme, mode, setMode } = useTheme();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<ScrollView
				style={[styles.container, { backgroundColor: theme.background }]}
				contentContainerStyle={{ paddingBottom: 32 }}
			>
				{/* Header */}
				<View style={styles.header}>
					<Pressable onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back" size={28} color={theme.text} />
					</Pressable>
					<Text style={styles.title}>About GoBuyMe</Text>
					<View style={{ width: 28 }} />
				</View>

				{/* App Logo */}
				<View style={styles.logoContainer}>
					<Image
						source={require('../../assets/logo.png')}
						style={[styles.logo, { backgroundColor: theme.cards }]}
						resizeMode="contain"
					/>
				</View>

				{/* App Info */}
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.appName, {color: theme.secondary}]}>GoBuyMe</Text>
					<Text style={styles.version}>Version 1.0.0</Text>
					<Text style={[styles.description, {color: theme.text}]}>
						GoBuyMe is your trusted shopping companion. Discover amazing deals,
						order with ease, and enjoy fast delivery. Our mission is to make
						shopping simple, secure, and rewarding for everyone.
					</Text>
				</View>

				{/* Contact & Links */}
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, {color: theme.text}]}>Contact & Support</Text>
					<Pressable
						onPress={() => Linking.openURL('mailto:support@gobuyme.shop')}
					>
						<Text style={styles.link}>support@gobuyme.shop</Text>
					</Pressable>
					<Pressable onPress={() => Linking.openURL('https://gobuyme.shop')}>
						<Text style={styles.link}>Visit our website</Text>
					</Pressable>
				</View>

				{/* Legal */}
				<View style={[styles.section, { backgroundColor: theme.cards }]}>
					<Text style={[styles.sectionTitle, {color: theme.text}]}>Legal</Text>
					<Pressable
						onPress={() => Linking.openURL('https://gobuyme.shop/privacy')}
					>
						<Text style={styles.link}>Privacy Policy</Text>
					</Pressable>
					<Pressable onPress={() => Linking.openURL('https://gobuyme.shop/terms')}>
						<Text style={styles.link}>Terms of Service</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginBottom: 24,
		justifyContent: 'space-between',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FF521B',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 16,
	},
	logo: {
		width: 90,
		height: 90,
		borderRadius: 18,
		backgroundColor: '#FFF',
	},
	section: {
		backgroundColor: '#FFF',
		marginHorizontal: 16,
		marginBottom: 20,
		borderRadius: 10,
		padding: 16,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	appName: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#0B3948',
		marginBottom: 4,
		textAlign: 'center',
	},
	version: {
		fontSize: 14,
		color: '#58A4B0',
		marginBottom: 10,
		textAlign: 'center',
	},
	description: {
		fontSize: 15,
		color: '#444',
		textAlign: 'center',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#0B3948',
		marginBottom: 8,
	},
	link: {
		color: '#FF521B',
		fontSize: 15,
		marginBottom: 8,
		textDecorationLine: 'underline',
	},
});
