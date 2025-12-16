import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Share,
	Alert,
	ScrollView,
	ActivityIndicator,
	Pressable,
	Platform,
	SafeAreaView,
	RefreshControl, // Add this import
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
	doc,
	getDoc,
	updateDoc,
	arrayUnion,
	collection,
	addDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReferralScreen({ navigation }) {
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [settings, setSettings] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [refreshing, setRefreshing] = useState(false); // Add this state

	useEffect(() => {
		// Set up auth state listener
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			if (user) {
				loadUserData(user.uid);
				loadSettings();
			} else {
				setLoading(false);
			}
		});

		// Cleanup subscription on unmount
		return () => unsubscribe();
	}, []);

	const loadUserData = async (userId) => {
		try {
			const userDoc = await getDoc(doc(db, 'users', userId));
			if (userDoc.exists()) {
				setUserData(userDoc.data());
			}
		} catch (error) {
			console.error('Error loading user data:', error);
			Alert.alert('Error', 'Failed to load user data');
		} finally {
			setLoading(false);
			setRefreshing(false); // Stop refreshing when done
		}
	};

	const loadSettings = async () => {
		try {
			const settingsDoc = await getDoc(doc(db, 'settings', 'referralProgram'));
			if (settingsDoc.exists()) {
				setSettings(settingsDoc.data());
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	};

	// Add this function for pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		if (currentUser) {
			await loadUserData(currentUser.uid);
			await loadSettings();
		}
	};

	const shareReferralCode = async () => {
		if (!userData?.referralCode) {
			Alert.alert('Error', 'Referral code not available');
			return;
		}

		try {
			const message = `GoBuyMe!...don't let hunger control you. Control your favorite restaurant now! Use my referral code ${
				userData.referralCode
			} to get ${
				settings?.rewardForReferee || 0
			} credits when you sign up and make your first purchase. Download now! https://gobuyme.app.link/`;

			await Share.share({
				message: message,
				title: 'Referral Code',
			});
		} catch (error) {
			console.error('Error sharing:', error);
			Alert.alert('Error', 'Failed to share referral code');
		}
	};

	const sendReferralEmail = async (email) => {
		if (sending || !currentUser || !userData?.referralCode) return;

		try {
			setSending(true);

			await addDoc(collection(db, 'referrals'), {
				referrerId: currentUser.uid,
				refereeEmail: email,
				referralCode: userData.referralCode,
				status: 'pending',
				createdAt: new Date(),
			});

			await updateDoc(doc(db, 'users', currentUser.uid), {
				pendingReferrals: arrayUnion(email),
			});

			Alert.alert('Success', 'Referral invitation sent!');
		} catch (error) {
			console.error('Error sending referral:', error);
			Alert.alert('Error', 'Failed to send referral invitation');
		} finally {
			setSending(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size="large" color="#FF521B" />
			</View>
		);
	}

	if (!currentUser) {
		return (
			<View style={styles.centerContainer}>
				<Text>Please sign in to access the referral program</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header2}>
				<Pressable onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back" size={24} color="black" />
				</Pressable>
				<Text style={{ fontSize: 20 }}>Owerri</Text>
				<View style={{ width: 24 }}></View>
			</View>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#FF521B']} // Android
						tintColor="#FF521B" // iOS
					/>
				}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Referral Program</Text>
					<Text style={styles.subtitle}>
						Refer friends and earn credits when they join and make their first
						purchase!
					</Text>
				</View>
				{userData?.referralCode ? (
					<View style={styles.card}>
						<Text style={styles.cardTitle}>Your Referral Code</Text>
						<View style={styles.codeContainer}>
							<Text style={styles.codeText}>{userData.referralCode}</Text>
							<TouchableOpacity
								onPress={shareReferralCode}
								style={styles.copyButton}
							>
								<MaterialIcons name="content-copy" size={20} color="#FFF" />
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							onPress={shareReferralCode}
							style={styles.shareButton}
						>
							<MaterialIcons name="share" size={20} color="#FFF" />
							<Text style={styles.shareButtonText}>Share Referral Code</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={styles.card}>
						<Text style={styles.cardTitle}>
							Generating Your Referral Code...
						</Text>
						<ActivityIndicator
							size="small"
							color="#FF521B"
							style={{ marginVertical: 10 }}
						/>
						<Text style={styles.helpText}>
							If this takes too long, please try refreshing the app.
						</Text>
					</View>
				)}
				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Text style={styles.statNumber}>
							{userData?.referralCount || 0}
						</Text>
						<Text style={styles.statLabel}>Successful Referrals</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={styles.statNumber}>
							G-{userData?.earnedCredits || 0}
						</Text>
						<Text style={styles.statLabel}>Credits Earned</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={styles.statNumber}>
							{userData?.pendingReferrals?.length || 0}
						</Text>
						<Text style={styles.statLabel}>Pending Referrals</Text>
					</View>
				</View>
				
				{userData?.hasFreeDelivery ? (
					<View style={styles.freeDeliveryCard}>
						<MaterialIcons name="local-shipping" size={24} color="#4CAF50" />
						<View style={styles.freeDeliveryText}>
							<Text style={styles.freeDeliveryTitle}>
								FREE Delivery Active!
							</Text>
							<Text style={styles.freeDeliveryDescription}>
								You've unlocked FREE delivery on ANY order for reaching 5000
								referral credits!
							</Text>
						</View>
					</View>
				) : (
					<View style={styles.progressCard}>
						<Text style={styles.cardTitle}>Free Delivery Progress</Text>
						<View style={styles.progressContainer}>
							<View style={styles.progressBar}>
								<View
									style={[
										styles.progressFill,
										{
											width: `${Math.min(
												((userData?.earnedCredits || 0) / 5000) * 100,
												100
											)}%`,
										},
									]}
								/>
							</View>
							<Text style={styles.progressText}>
								{userData?.earnedCredits || 0} / 5000 credits
							</Text>
							<Text style={styles.progressSubtext}>
								Earn 5000 credits to unlock FREE delivery on any order.
							</Text>
						</View>
					</View>
				)}
				<View style={styles.rewardsCard}>
					<Text style={styles.cardTitle}>How It Works</Text>
					<View style={styles.rewardItem}>
						<MaterialIcons name="person-add" size={24} color="#FF521B" />
						<View style={styles.rewardText}>
							<Text style={styles.rewardTitle}>1. Share Your Code</Text>
							<Text style={styles.rewardDescription}>
								Share your unique referral code with friends
							</Text>
						</View>
					</View>
					<View style={styles.rewardItem}>
						<MaterialIcons name="login" size={24} color="#FF521B" />
						<View style={styles.rewardText}>
							<Text style={styles.rewardTitle}>2. Friend Signs Up</Text>
							<Text style={styles.rewardDescription}>
								Your friend signs up using your referral code
							</Text>
						</View>
					</View>
					<View style={styles.rewardItem}>
						<MaterialIcons name="shopping-cart" size={24} color="#FF521B" />
						<View style={styles.rewardText}>
							<Text style={styles.rewardTitle}>3. Friend Makes Purchase</Text>
							<Text style={styles.rewardDescription}>
								Your friend makes their first qualifying purchase
							</Text>
						</View>
					</View>
					<View style={styles.rewardItem}>
						<MaterialIcons name="card-giftcard" size={24} color="#FF521B" />
						<View style={styles.rewardText}>
							<Text style={styles.rewardTitle}>4. You Both Get Rewards</Text>
							<Text style={styles.rewardDescription}>
								You get ₦{settings?.rewardForReferrer || 0} credits, your friend
								gets ₦{settings?.rewardForReferee || 0} credits
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF9F7',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	header: {
		padding: 16,
	},
	header2: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'white',
		...Platform.select({
			ios: {
				marginTop: 0,
			},
			android: {
				marginTop: 40,
			},
		}),
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		lineHeight: 22,
	},
	card: {
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 20,
		margin: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		color: '#333',
	},
	codeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#F5F5F5',
		borderRadius: 4,
		padding: 12,
		marginBottom: 16,
	},
	codeText: {
		fontSize: 18,
		fontFamily: 'monospace',
		color: '#333',
	},
	copyButton: {
		backgroundColor: '#FF521B',
		padding: 8,
		borderRadius: 4,
	},
	shareButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FF521B',
		padding: 12,
		borderRadius: 4,
	},
	shareButtonText: {
		color: '#FFF',
		fontWeight: '600',
		marginLeft: 8,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		margin: 16,
		marginTop: 0,
	},
	statItem: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 16,
		borderRadius: 4,
		marginHorizontal: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	statNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF521B',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
	},
	rewardsCard: {
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 20,
		margin: 16,
		marginTop: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	rewardItem: {
		flexDirection: 'row',
		marginBottom: 20,
		alignItems: 'flex-start',
	},
	rewardText: {
		flex: 1,
		marginLeft: 12,
	},
	rewardTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
		color: '#333',
	},
	rewardDescription: {
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
	},
	helpText: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginTop: 8,
	},
	freeDeliveryCard: {
		backgroundColor: '#E8F5E9',
		borderRadius: 4,
		padding: 20,
		margin: 16,
		marginTop: 0,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	  },
	  freeDeliveryText: {
		flex: 1,
		marginLeft: 12,
	  },
	  freeDeliveryTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#4CAF50',
		marginBottom: 4,
	  },
	  freeDeliveryDescription: {
		fontSize: 14,
		color: '#388E3C',
	  },
	  progressCard: {
		backgroundColor: '#FFF',
		borderRadius: 4,
		padding: 20,
		margin: 16,
		marginTop: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	  },
	  progressContainer: {
		alignItems: 'center',
	  },
	  progressBar: {
		height: 10,
		width: '100%',
		backgroundColor: '#E0E0E0',
		borderRadius: 5,
		marginBottom: 10,
		overflow: 'hidden',
	  },
	  progressFill: {
		height: '100%',
		backgroundColor: '#FF521B',
		borderRadius: 5,
	  },
	  progressText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333',
		marginBottom: 4,
	  },
	  progressSubtext: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
	  },
});
