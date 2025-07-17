import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Switch,
	Pressable,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export default function NotificationsOptions({ navigation }) {
	const [orderUpdates, setOrderUpdates] = useState(true);
	const [promotions, setPromotions] = useState(false);
	const [appUpdates, setAppUpdates] = useState(true);
	const { theme, mode, setMode } = useTheme();

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={28} color={theme.text} />
				</Pressable>
				<Text style={styles.title}>Notifications</Text>
				<View style={{ width: 28 }} />
			</View>

			{/* Order Updates */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Order Updates
				</Text>
				<View style={styles.row}>
					<Feather name="shopping-bag" size={22} color="#58A4B0" />
					<Text style={styles.value}>Get notified about your orders</Text>
					<Switch
						value={orderUpdates}
						onValueChange={setOrderUpdates}
						thumbColor={orderUpdates ? '#FF521B' : '#f4f3f4'}
						trackColor={{ false: '#ccc', true: '#FF521B' }}
					/>
				</View>
			</View>

			{/* Promotions */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Promotions
				</Text>
				<View style={styles.row}>
					<MaterialIcons name="local-offer" size={22} color="#58A4B0" />
					<Text style={styles.value}>Receive special offers & deals</Text>
					<Switch
						value={promotions}
						onValueChange={setPromotions}
						thumbColor={promotions ? '#FF521B' : '#f4f3f4'}
						trackColor={{ false: '#ccc', true: '#FF521B' }}
					/>
				</View>
			</View>

			{/* App Updates */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					App Updates
				</Text>
				<View style={styles.row}>
					<MaterialIcons name="update" size={22} color="#58A4B0" />
					<Text style={styles.value}>Be informed about new features</Text>
					<Switch
						value={appUpdates}
						onValueChange={setAppUpdates}
						thumbColor={appUpdates ? '#FF521B' : '#f4f3f4'}
						trackColor={{ false: '#ccc', true: '#FF521B' }}
					/>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF0EB',
		paddingTop: 48,
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
	section: {
		backgroundColor: '#FFF',
		marginHorizontal: 16,
		marginBottom: 24,
		borderRadius: 10,
		padding: 16,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#0B3948',
		marginBottom: 12,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		paddingVertical: 8,
		justifyContent: 'space-between',
	},
	value: {
		flex: 1,
		fontSize: 15,
		color: '#58A4B0',
		marginLeft: 16,
	},
});
