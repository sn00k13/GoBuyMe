import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Modal,
	FlatList,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

const LANGUAGES = [
	{ code: 'en', label: 'English' },
	{ code: 'fr', label: 'Français' },
	{ code: 'es', label: 'Español' },
	{ code: 'ig', label: 'Igbo' },
	{ code: 'yo', label: 'Yoruba' },
];

const INPUT_METHODS = [
	{ key: 'default', label: 'System Default' },
	{ key: 'qwerty', label: 'QWERTY Keyboard' },
	{ key: 'azerty', label: 'AZERTY Keyboard' },
];

export default function LanguageInput({ navigation }) {
	const [language, setLanguage] = useState(LANGUAGES[0]);
	const [inputMethod, setInputMethod] = useState(INPUT_METHODS[0]);
	const [langModal, setLangModal] = useState(false);
	const [inputModal, setInputModal] = useState(false);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={28} color="#0B3948" />
				</Pressable>
				<Text style={styles.title}>Language & Input</Text>
				<View style={{ width: 28 }} />
			</View>

			{/* Language Setting */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>App Language</Text>
				<Pressable style={styles.row} onPress={() => setLangModal(true)}>
					<FontAwesome name="language" size={22} color="#58A4B0" />
					<Text style={styles.value}>{language.label}</Text>
					<MaterialIcons
						name="keyboard-arrow-right"
						size={24}
						color="#0B3948"
					/>
				</Pressable>
			</View>

			{/* Input Method Setting */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Input Method</Text>
				<Pressable style={styles.row} onPress={() => setInputModal(true)}>
					<MaterialIcons name="keyboard" size={22} color="#58A4B0" />
					<Text style={styles.value}>{inputMethod.label}</Text>
					<MaterialIcons
						name="keyboard-arrow-right"
						size={24}
						color="#0B3948"
					/>
				</Pressable>
			</View>

			{/* Language Modal */}
			<Modal visible={langModal} transparent animationType="slide">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Language</Text>
						<FlatList
							data={LANGUAGES}
							keyExtractor={(item) => item.code}
							renderItem={({ item }) => (
								<Pressable
									style={styles.modalOption}
									onPress={() => {
										setLanguage(item);
										setLangModal(false);
									}}
								>
									<Text style={styles.modalOptionText}>{item.label}</Text>
									{language.code === item.code && (
										<MaterialIcons name="check" size={20} color="#FF521B" />
									)}
								</Pressable>
							)}
						/>
						<Pressable
							style={styles.modalClose}
							onPress={() => setLangModal(false)}
						>
							<Text style={{ color: '#FF521B', fontWeight: 'bold' }}>
								Cancel
							</Text>
						</Pressable>
					</View>
				</View>
			</Modal>

			{/* Input Method Modal */}
			<Modal visible={inputModal} transparent animationType="slide">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Input Method</Text>
						<FlatList
							data={INPUT_METHODS}
							keyExtractor={(item) => item.key}
							renderItem={({ item }) => (
								<Pressable
									style={styles.modalOption}
									onPress={() => {
										setInputMethod(item);
										setInputModal(false);
									}}
								>
									<Text style={styles.modalOptionText}>{item.label}</Text>
									{inputMethod.key === item.key && (
										<MaterialIcons name="check" size={20} color="#FF521B" />
									)}
								</Pressable>
							)}
						/>
						<Pressable
							style={styles.modalClose}
							onPress={() => setInputModal(false)}
						>
							<Text style={{ color: '#FF521B', fontWeight: 'bold' }}>
								Cancel
							</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</View>
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
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#FFF',
		borderRadius: 12,
		padding: 24,
		width: '80%',
		maxHeight: '60%',
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 16,
	},
	modalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	modalOptionText: {
		fontSize: 15,
		color: '#0B3948',
	},
	modalClose: {
		marginTop: 16,
		alignItems: 'center',
	},
});
