import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Switch,
	Pressable,
	Alert,
	SafeAreaView,
	Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export default function DataStorage({ navigation }) {
	const [saveData, setSaveData] = useState(true);
	const [autoDownload, setAutoDownload] = useState(false);
	const { theme, mode, setMode } = useTheme();

	const handleClearCache = () => {
		Alert.alert(
			'Clear Cache',
			'Are you sure you want to clear cached data? This cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear',
					style: 'destructive',
					onPress: () => {
						/* Clear cache logic here */
					},
				},
			]
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={28} color={theme.text} />
				</Pressable>
				<Text style={styles.title}>Data & Storage</Text>
				<View style={{ width: 28 }} />
			</View>

			{/* Save Data */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Save Data
				</Text>
				<View style={styles.row}>
					<FontAwesome name="database" size={22} color="#58A4B0" />
					<Text style={styles.value}>Reduce data usage</Text>
					<Switch
						value={saveData}
						onValueChange={setSaveData}
						thumbColor={saveData ? '#FF521B' : '#f4f3f4'}
						trackColor={{ false: '#ccc', true: '#FF521B' }}
					/>
				</View>
			</View>

			{/* Auto Download */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Auto Download Media
				</Text>
				<View style={styles.row}>
					<MaterialIcons name="file-download" size={22} color="#58A4B0" />
					<Text style={styles.value}>Download images automatically</Text>
					<Switch
						value={autoDownload}
						onValueChange={setAutoDownload}
						thumbColor={autoDownload ? '#FF521B' : '#f4f3f4'}
						trackColor={{ false: '#ccc', true: '#FF521B' }}
					/>
				</View>
			</View>

			{/* Clear Cache */}
			<View style={[styles.section, { backgroundColor: theme.cards }]}>
				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					Storage
				</Text>
				<Pressable style={styles.row} onPress={handleClearCache}>
					<MaterialIcons name="delete-sweep" size={22} color="#FF521B" />
					<Text style={[styles.value, { color: '#FF521B' }]}>Clear Cache</Text>
					<MaterialIcons
						name="keyboard-arrow-right"
						size={24}
						color="#0B3948"
					/>
				</Pressable>
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
		...Platform.select({
			ios: {
				marginTop: 0,
				// iOS specific styles
			  },
			android: {
				marginTop: 40,
				// Android specific styles
			  },
		  }),
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
