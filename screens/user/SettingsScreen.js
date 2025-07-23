import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../utils/ThemeContext';

const SettingsScreen = ({ navigation }) => {
	const { theme, mode, setMode } = useTheme();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
			<View style={[styles.header, { backgroundColor: theme.cards }]}>
				<Pressable onPress={() => navigation.toggleDrawer()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.text} />
				</Pressable>
				<Text style={[styles.locationText, { color: theme.primary }]}>
					Settings
				</Text>
				<View style={{ width: 24 }}></View>
			</View>
			<ScrollView>
				<View style={styles.generalSettings}>
					<View>
						<Text
							style={[
								styles.title,
								{ backgroundColor: theme.background, color: theme.text },
							]}
						>
							General Settings
						</Text>
					</View>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('Appearance')}
					>
						<Entypo name="eye" size={18} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Appearance</Text>
					</Pressable>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('Language')}
					>
						<Ionicons name="language-outline" size={18} color={theme.text} />
						<Text style={[{ color: theme.text }]}>
							Language and Input Settings
						</Text>
					</Pressable>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('DataStorage')}
					>
						<FontAwesome5 name="database" size={18} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Data and Storage</Text>
					</Pressable>
				</View>
				<View style={styles.generalSettings}>
					<View>
						<Text
							style={[
								styles.title,
								{
									backgroundColor: theme.background,
									borderBottomColor: theme.borderBottom,
									color: theme.text,
								},
							]}
						>
							Notifications
						</Text>
					</View>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('NotificationsOptions')}
					>
						<FontAwesome6 name="gear" size={24} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Notification Options</Text>
					</Pressable>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('PushNotifications')}
					>
						<FontAwesome name="bell" size={24} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Push Notifications</Text>
					</Pressable>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('Chat')}
					>
						<MaterialIcons name="support-agent" size={24} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Live support</Text>
					</Pressable>
				</View>
				<View style={styles.generalSettings}>
					<View>
						<Text
							style={[
								styles.title,
								{
									backgroundColor: theme.background,
									borderBottomColor: theme.borderBottom,
									color: theme.text,
								},
							]}
						>
							Privacy
						</Text>
					</View>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('Permissions')}
					>
						<FontAwesome6
							name="universal-access"
							size={24}
							color={theme.text}
						/>
						<Text style={[{ color: theme.text }]}>Permissions</Text>
					</Pressable>
				</View>
				<View style={styles.generalSettings}>
					<View>
						<Text
							style={[
								styles.title,
								{
									backgroundColor: theme.background,
									borderBottomColor: theme.borderBottom,
									color: theme.text,
								},
							]}
						>
							Legal
						</Text>
					</View>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('AboutScreen')}
					>
						<Entypo name="info-with-circle" size={18} color={theme.text} />
						<Text style={[{ color: theme.text }]}>About</Text>
					</Pressable>
					<Pressable
						style={[
							styles.listView,
							{
								backgroundColor: theme.cards,
								borderBottomColor: theme.borderBottom,
							},
						]}
						onPress={() => navigation.navigate('TermsService')}
					>
						<Octicons name="law" size={24} color={theme.text} />
						<Text style={[{ color: theme.text }]}>Terms of Service</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
		padding: 16,
		paddingTop: 8,
		paddingBottom: 8,
	},
	locationText: {
		fontSize: 18,
		fontWeight: 400,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		marginTop: 40,
	},
	listView: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		borderBottomWidth: 1,
		padding: 16,
	},
});

export default SettingsScreen;
