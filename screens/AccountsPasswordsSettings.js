import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	TextInput,
	Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

export default function AccountsPasswordsSettings({ navigation }) {
	const [email, setEmail] = useState('user@email.com');
	const [editingEmail, setEditingEmail] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const handleSaveEmail = () => {
		setEditingEmail(false);
		// Save email logic here
		Alert.alert('Email updated!');
	};

	const handleChangePassword = () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			Alert.alert('Please fill all fields');
			return;
		}
		if (newPassword !== confirmPassword) {
			Alert.alert('New passwords do not match');
			return;
		}
		// Change password logic here
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		Alert.alert('Password changed!');
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={28} color="#0B3948" />
				</Pressable>
				<Text style={styles.title}>Account & Password</Text>
				<View style={{ width: 28 }} />
			</View>

			{/* Email Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Email</Text>
				<View style={styles.row}>
					<Feather name="mail" size={22} color="#58A4B0" />
					{editingEmail ? (
						<TextInput
							style={styles.input}
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
							onBlur={handleSaveEmail}
							autoFocus
						/>
					) : (
						<Text style={styles.value}>{email}</Text>
					)}
					<Pressable onPress={() => setEditingEmail(!editingEmail)}>
						<MaterialIcons
							name={editingEmail ? 'check' : 'edit'}
							size={22}
							color="#FF521B"
						/>
					</Pressable>
				</View>
			</View>

			{/* Password Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Change Password</Text>
				<View style={styles.inputRow}>
					<TextInput
						style={styles.input}
						placeholder="Current Password"
						value={currentPassword}
						onChangeText={setCurrentPassword}
						secureTextEntry
					/>
				</View>
				<View style={styles.inputRow}>
					<TextInput
						style={styles.input}
						placeholder="New Password"
						value={newPassword}
						onChangeText={setNewPassword}
						secureTextEntry
					/>
				</View>
				<View style={styles.inputRow}>
					<TextInput
						style={styles.input}
						placeholder="Confirm New Password"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry
					/>
				</View>
				<Pressable style={styles.saveBtn} onPress={handleChangePassword}>
					<Text style={styles.saveBtnText}>Change Password</Text>
				</Pressable>
			</View>
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
	input: {
		flex: 1,
		fontSize: 15,
		color: '#0B3948',
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
		paddingVertical: 4,
		marginLeft: 16,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	saveBtn: {
		backgroundColor: '#FF521B',
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	saveBtnText: {
		color: '#FFF',
		fontWeight: 'bold',
		fontSize: 15,
	},
});
