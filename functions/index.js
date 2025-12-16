/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall, onRequest } = require('firebase-functions/v2/https');
const {
	onDocumentUpdated,
	onDocumentCreated,
} = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { Client } = require('@googlemaps/google-maps-services-js');
const functions = require('firebase-functions');
const fetch = (...args) =>
	import('node-fetch').then((mod) => mod.default(...args));

initializeApp();

const mapsClient = new Client({});
exports.geocodeAddress = onCall(
	{ region: 'us-central1', secrets: ['MAPS_API_KEY'] },
	async (request) => {
		const address = request.data.address;
		if (!address) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'The function must be called with one argument "address".'
			);
		}

		// Check if MAPS_API_KEY is available
		if (!process.env.MAPS_API_KEY) {
			console.error('MAPS_API_KEY is not set in environment variables');
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Geocoding service is not properly configured.'
			);
		}

		try {
			const response = await mapsClient.geocode({
				params: {
					address: address,
					key: process.env.MAPS_API_KEY,
					components: 'country:NG', // Bias results to Nigeria
				},
				timeout: 10000, // Increased to 10 seconds
			});

			if (response.data.results && response.data.results.length > 0) {
				const location = response.data.results[0].geometry.location;
				return { lat: location.lat, lng: location.lng };
			} else {
				console.warn('No geocoding results found for address:', address);
				throw new functions.https.HttpsError(
					'not-found',
					'No results found for the address.'
				);
			}
		} catch (error) {
			// Log the detailed error from the Google Maps client
			console.error(
				'Geocoding failed. Full error from Google Maps API:',
				JSON.stringify(error?.response?.data || error.message, null, 2)
			);

			// Check if it's a specific Google Maps API error
			if (error.response?.data?.error_message) {
				console.error(
					'Google Maps API error:',
					error.response.data.error_message
				);
			}

			// If it's already an HttpsError, re-throw it
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}

			// Otherwise, throw a more descriptive error
			throw new functions.https.HttpsError(
				'internal',
				`Failed to geocode address: ${error.message || 'Unknown error'}`
			);
		}
	}
);

// Process referral completion when order status becomes 'delivered'
exports.processReferralOnOrder = onDocumentUpdated(
	'orders/{orderId}',
	async (event) => {
		const beforeData = event.data.before.data();
		const afterData = event.data.after.data();

		// Check if status changed to 'delivered'
		if (beforeData.status !== 'Delivered' && afterData.status === 'Delivered') {
			const userId = afterData.userId;

			if (!userId) return null;

			const db = getFirestore();

			try {
				// Get user document
				const userRef = db.collection('users').doc(userId);
				const userDoc = await userRef.get();

				if (!userDoc.exists) {
					console.log('User not found:', userId);
					return null;
				}

				const userData = userDoc.data();

				// Check if user was referred and hasn't been processed yet
				if (userData.referredBy && !userData.hasCompletedReferral) {
					const referrerId = userData.referredBy;
					const referrerRef = db.collection('users').doc(referrerId);

					// Get referral settings
					const settingsDoc = await db
						.collection('settings')
						.doc('referralProgram')
						.get();
					const settings = settingsDoc.exists ? settingsDoc.data() : {};
					const rewardAmount = settings.rewardForReferrer || 0;

					// Update referrer's stats
					await referrerRef.update({
						earnedCredits: FieldValue.increment(rewardAmount),
						referralCount: FieldValue.increment(1),
						pendingReferrals: FieldValue.arrayRemove(userData.email),
					});

					// Mark referral as completed for this user
					await userRef.update({
						hasCompletedReferral: true,
					});

					console.log(
						`Referral completed for user ${userId}. Referrer ${referrerId} earned ${rewardAmount} credits.`
					);
				}
			} catch (error) {
				console.error('Error processing referral:', error);
			}
		}
	}
);

// Cloud Function to increment orderCount when order status becomes 'delivered'
exports.incrementOrderCount = onDocumentUpdated(
	'orders/{orderId}',
	async (event) => {
		const beforeData = event.data.before.data();
		const afterData = event.data.after.data();

		// Check if status changed to 'delivered'
		if (beforeData.status !== 'Delivered' && afterData.status === 'Delivered') {
			const db = getFirestore();
			const restaurantId = afterData.restaurantId;

			if (!restaurantId) {
				console.log('No restaurantId found in order');
				return;
			}

			try {
				// Increment orderCount in the restaurant document
				const restaurantRef = db.collection('restaurants').doc(restaurantId);
				await restaurantRef.update({
					orderCount: FieldValue.increment(1),
				});

				console.log(`Incremented orderCount for restaurant: ${restaurantId}`);
			} catch (error) {
				console.error('Error updating orderCount:', error);
			}
		}
	}
);

// Process referral completion when order status becomes 'delivered'
exports.processReferralOnOrder = onDocumentUpdated(
	'orders/{orderId}',
	async (event) => {
		const beforeData = event.data.before.data();
		const afterData = event.data.after.data();

		// Check if status changed to 'delivered'
		if (beforeData.status !== 'Delivered' && afterData.status === 'Delivered') {
			const userId = afterData.userId;

			if (!userId) return null;

			const db = getFirestore();

			try {
				// Get user document
				const userRef = db.collection('users').doc(userId);
				const userDoc = await userRef.get();

				if (!userDoc.exists) {
					console.log('User not found:', userId);
					return null;
				}

				const userData = userDoc.data();

				// Check if user was referred and hasn't been processed yet
				if (userData.referredBy && !userData.hasCompletedReferral) {
					const referrerId = userData.referredBy;
					const referrerRef = db.collection('users').doc(referrerId);

					// Get referral settings
					const settingsDoc = await db
						.collection('settings')
						.doc('referralProgram')
						.get();
					const settings = settingsDoc.exists ? settingsDoc.data() : {};
					const rewardAmount = settings.rewardForReferrer || 0;

					// Get current earned credits
					const currentEarnedCredits = userData.earnedCredits || 0;
					const newEarnedCredits = currentEarnedCredits + rewardAmount;

					// Check if user qualifies for free delivery
					const qualifiesForFreeDelivery =
						newEarnedCredits >= 5000 && currentEarnedCredits < 5000;

					// Update referrer's stats
					const updateData = {
						earnedCredits: FieldValue.increment(rewardAmount),
						referralCount: FieldValue.increment(1),
						pendingReferrals: FieldValue.arrayRemove(userData.email),
					};

					// Add free delivery eligibility if qualified
					if (qualifiesForFreeDelivery) {
						updateData.hasFreeDelivery = true;
						updateData.freeDeliveryUnlockedAt = new Date();
					}

					await referrerRef.update(updateData);

					// Mark referral as completed for this user
					await userRef.update({
						hasCompletedReferral: true,
					});

					console.log(
						`Referral completed for user ${userId}. Referrer ${referrerId} earned ${rewardAmount} credits.`
					);

					// Send notification if free delivery was unlocked
					if (qualifiesForFreeDelivery) {
						await sendFreeDeliveryNotification(referrerId);
					}
				}
			} catch (error) {
				console.error('Error processing referral:', error);
			}
		}
	}
);

// Optional: Function to check free delivery eligibility
exports.checkFreeDeliveryEligibility = onRequest(async (req, res) => {
	try {
		const db = getFirestore();
		const usersSnapshot = await db
			.collection('users')
			.where('hasFreeDelivery', '==', true)
			.get();

		let updatedCount = 0;

		for (const doc of usersSnapshot.docs) {
			const userData = doc.data();
			if (userData.earnedCredits < 5000) {
				await doc.ref.update({
					hasFreeDelivery: false,
				});
				updatedCount++;
			}
		}

		res
			.status(200)
			.send(
				`Updated ${updatedCount} users who no longer qualify for free delivery`
			);
	} catch (error) {
		console.error('Error checking free delivery eligibility:', error);
		res.status(500).send('Error checking free delivery eligibility');
	}
});

// Helper function to send free delivery notification
async function sendFreeDeliveryNotification(userId) {
	try {
		const db = getFirestore();
		const userDoc = await db.collection('users').doc(userId).get();

		if (!userDoc.exists) return;

		const userData = userDoc.data();
		const expoPushToken = userData.expoPushToken;

		if (!expoPushToken) {
			console.log('No push token for user:', userId);
			return;
		}

		const message = {
			to: expoPushToken,
			sound: 'default',
			title: '🎉 Free Delivery Unlocked!',
			body: "Congratulations! You've earned FREE delivery on all orders for reaching 5000 referral credits!",
			data: { type: 'free_delivery_unlocked' },
		};

		const response = await fetch('https://exp.host/--/api/v2/push/send', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Accept-encoding': 'gzip, deflate',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(message),
		});

		const result = await response.json();
		console.log('Free delivery notification sent:', result);
	} catch (error) {
		console.error('Error sending free delivery notification:', error);
	}
}

// Send push notifications for broadcast messages to users only
exports.sendBroadcastNotification = onDocumentCreated(
	'broadcasts/{broadcastId}',
	async (event) => {
		const broadcast = event.data.data();

		if (broadcast.status !== 'sent') {
			return null;
		}

		try {
			const db = getFirestore();

			// Only target users collection
			let query = db.collection('users');

			// Apply segment filters if specified
			if (broadcast.target === 'segment' && broadcast.segmentFilters) {
				if (broadcast.segmentFilters.lastActive) {
					const lastActiveDate = new Date();
					lastActiveDate.setDate(
						lastActiveDate.getDate() - broadcast.segmentFilters.lastActive
					);
					query = query.where('lastActive', '>=', lastActiveDate);
				}

				if (broadcast.segmentFilters.hasOrders) {
					query = query.where('orderCount', '>', 0);
				}

				if (broadcast.segmentFilters.appVersion) {
					query = query.where(
						'appVersion',
						'==',
						broadcast.segmentFilters.appVersion
					);
				}
			}

			const usersSnapshot = await query.get();
			const tokens = [];

			usersSnapshot.forEach((doc) => {
				const userData = doc.data();
				if (userData.expoPushToken) {
					tokens.push(userData.expoPushToken);
				}
			});

			if (tokens.length === 0) {
				console.log('No users found for broadcast');
				return null;
			}

			// Send notifications using Expo
			const message = {
				to: tokens,
				sound: 'default',
				title: broadcast.title,
				body: broadcast.message,
				data: {
					broadcastId: event.params.broadcastId,
					type: 'broadcast',
				},
			};

			const response = await fetch('https://exp.host/--/api/v2/push/send', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Accept-encoding': 'gzip, deflate',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(message),
			});

			const result = await response.json();
			console.log('Expo push response:', result);

			let totalSent = 0;
			if (result.data && result.data.length > 0) {
				totalSent = result.data.filter((item) => item.status === 'ok').length;
			}

			// Update the broadcast with the sent count
			await event.data.ref.update({
				sentCount: totalSent,
			});

			console.log(`Successfully sent broadcast to ${totalSent} users`);
			return null;
		} catch (error) {
			console.error('Error sending broadcast notification:', error);
			// Update status to failed
			await event.data.ref.update({
				status: 'failed',
			});
			return null;
		}
	}
);

// Process scheduled broadcasts for users
exports.processScheduledBroadcasts = onRequest(
	{ schedule: 'every 5 minutes', region: 'us-central1' },
	async (req, res) => {
		try {
			const db = getFirestore();
			const now = new Date();

			const scheduledBroadcasts = await db
				.collection('broadcasts')
				.where('status', '==', 'scheduled')
				.where('scheduledFor', '<=', now)
				.get();

			const batch = db.batch();

			scheduledBroadcasts.forEach((doc) => {
				const broadcastRef = db.collection('broadcasts').doc(doc.id);
				batch.update(broadcastRef, {
					status: 'sent',
					sentAt: now,
				});
			});

			await batch.commit();
			console.log(`Processed ${scheduledBroadcasts.size} scheduled broadcasts`);
			res
				.status(200)
				.send(`Processed ${scheduledBroadcasts.size} scheduled broadcasts`);
		} catch (error) {
			console.error('Error processing scheduled broadcasts:', error);
			res.status(500).send('Error processing scheduled broadcasts');
		}
	}
);

// Track broadcast opens for users
exports.trackBroadcastOpen = onCall(
	{ region: 'us-central1' },
	async (request) => {
		if (!request.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated'
			);
		}

		const { broadcastId } = request.data;
		if (!broadcastId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'broadcastId is required'
			);
		}

		try {
			const db = getFirestore();
			const broadcastRef = db.collection('broadcasts').doc(broadcastId);
			await broadcastRef.update({
				openCount: FieldValue.increment(1),
			});

			return { success: true };
		} catch (error) {
			console.error('Error tracking broadcast open:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to track broadcast open'
			);
		}
	}
);

// Track broadcast clicks for users
exports.trackBroadcastClick = onCall(
	{ region: 'us-central1' },
	async (request) => {
		if (!request.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated'
			);
		}

		const { broadcastId } = request.data;
		if (!broadcastId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'broadcastId is required'
			);
		}

		try {
			const db = getFirestore();
			const broadcastRef = db.collection('broadcasts').doc(broadcastId);
			await broadcastRef.update({
				clickCount: FieldValue.increment(1),
			});

			return { success: true };
		} catch (error) {
			console.error('Error tracking broadcast click:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to track broadcast click'
			);
		}
	}
);

// Order status update notification for users
exports.notifyOrderStatusUpdate = onDocumentUpdated(
	'orders/{orderId}',
	async (event) => {
		const before = event.data.before.data();
		const after = event.data.after.data();

		if (before.status !== after.status) {
			const userId = after.userId;
			const orderId = event.params.orderId;

			const db = getFirestore();
			const userDoc = await db.collection('users').doc(userId).get();
			const userData = userDoc.data();

			if (!userData || !userData.expoPushToken) {
				console.log('No push token for user:', userId);
				return;
			}

			const message = {
				to: userData.expoPushToken,
				sound: 'default',
				title: 'Order Status Updated',
				body: `Order ${orderId} status has been updated to "${
					after.status
				}".\n ${
					after.status === 'Delivered'
						? 'If you have not received your order, please contact us immediately.'
						: ''
				}`,
				data: { orderId, status: after.status },
			};

			const response = await fetch('https://exp.host/--/api/v2/push/send', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Accept-encoding': 'gzip, deflate',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(message),
			});

			const result = await response.json();
			console.log('Expo push response:', result);
		}
	}
);

// Update business rating when a new rating is added (for both restaurants and stores)
exports.updateBusinessRating = onDocumentCreated(
	'ratings/{ratingId}',
	async (event) => {
		const rating = event.data.data();

		// Check if rating is for a business (restaurant or store)
		if (rating.targetType !== 'restaurant' && rating.targetType !== 'store')
			return null;

		try {
			const db = getFirestore();
			const businessRef = db
				.collection(
					rating.targetType === 'restaurant' ? 'restaurants' : 'stores'
				)
				.doc(rating.targetId);

			await db.runTransaction(async (transaction) => {
				const businessDoc = await transaction.get(businessRef);
				if (!businessDoc.exists) {
					console.log(`${rating.targetType} not found:`, rating.targetId);
					return;
				}

				const businessData = businessDoc.data();
				const newRatingCount = (businessData.ratingCount || 0) + 1;
				const newTotalRating = (businessData.totalRating || 0) + rating.rating;
				const newAverageRating = newTotalRating / newRatingCount;

				transaction.update(businessRef, {
					ratingCount: newRatingCount,
					totalRating: newTotalRating,
					averageRating: parseFloat(newAverageRating.toFixed(1)), // Round to 1 decimal
				});
			});

			console.log(
				`Updated rating for ${rating.targetType}: ${rating.targetId}`
			);
			return null;
		} catch (error) {
			console.error(`Error updating ${rating.targetType} rating:`, error);
			return null;
		}
	}
);

// Update agent rating when a new rating is added
exports.updateAgentRating = onDocumentCreated(
	'ratings/{ratingId}',
	async (event) => {
		const rating = event.data.data();

		if (rating.targetType !== 'agent') return null;

		try {
			const db = getFirestore();
			const agentRef = db.collection('agents').doc(rating.targetId);

			await db.runTransaction(async (transaction) => {
				const agentDoc = await transaction.get(agentRef);
				if (!agentDoc.exists) {
					console.log('Agent not found:', rating.targetId);
					return;
				}

				const agentData = agentDoc.data();
				const newRatingCount = (agentData.ratingCount || 0) + 1;
				const newTotalRating = (agentData.totalRating || 0) + rating.rating;
				const newAverageRating = newTotalRating / newRatingCount;

				transaction.update(agentRef, {
					ratingCount: newRatingCount,
					totalRating: newTotalRating,
					averageRating: parseFloat(newAverageRating.toFixed(1)), // Round to 1 decimal
				});
			});

			console.log(`Updated rating for agent: ${rating.targetId}`);
			return null;
		} catch (error) {
			console.error('Error updating agent rating:', error);
			return null;
		}
	}
);

// Prevent users from rating the same order multiple times
exports.preventDuplicateRatings = onDocumentCreated(
	'ratings/{ratingId}',
	async (event) => {
		const rating = event.data.data();

		try {
			const db = getFirestore();
			const ratingsQuery = db
				.collection('ratings')
				.where('userId', '==', rating.userId)
				.where('orderId', '==', rating.orderId)
				.where('targetType', '==', rating.targetType);

			const snapshot = await ratingsQuery.get();

			if (snapshot.size > 1) {
				// Delete the duplicate rating
				await event.data.ref.delete();
				console.log('Deleted duplicate rating');
				return null;
			}

			return null;
		} catch (error) {
			console.error('Error checking for duplicate ratings:', error);
			return null;
		}
	}
);

//Paystack Payout for orders

// Constants
const SERVICE_CHARGE = 20000; // Flat service charge in kobo (₦200.00)
const DELIVERY_AGENT_SHARE = 0.85; // 85% of delivery fee goes to agent

// 1. Function to process completed orders and create payout tasks
exports.processCompletedOrders = onSchedule(
	{
		schedule: '0 0 * * *', // Runs every day at midnight
		timeZone: 'Africa/Lagos',
	},
	async (event) => {
		const now = admin.firestore.Timestamp.now();
		const yesterday = new Date(
			now.toDate().setDate(now.toDate().getDate() - 1)
		);

		try {
			// Get all delivered orders from yesterday that haven't been processed for payout
			const ordersSnapshot = await db
				.collection('orders')
				.where('status', '==', 'delivered')
				.where('payoutProcessed', '==', false)
				.where('deliveryDate', '>=', yesterday)
				.where('deliveryDate', '<', now)
				.get();

			if (ordersSnapshot.empty) {
				console.log('No orders to process for payout');
				return null;
			}

			// Group orders by restaurant and delivery agent
			const payouts = {
				restaurants: {}, // { restaurantId: { amount, orders: [] } }
				deliveryAgents: {}, // { agentId: { amount, orders: [] } }
			};

			// Process each order
			const batch = db.batch();
			const ordersToUpdate = [];

			ordersSnapshot.forEach((doc) => {
				const order = doc.data();
				const orderId = doc.id;

				// Mark order for update
				const orderRef = db.collection('orders').doc(orderId);
				ordersToUpdate.push(orderRef.update({ payoutProcessed: true }));

				// Calculate restaurant payout
				const restaurantPayout = order.orderItemsTotal - order.commissionAmount;

				// Initialize restaurant in payouts if not exists
				if (!payouts.restaurants[order.restaurantId]) {
					payouts.restaurants[order.restaurantId] = {
						amount: 0,
						orders: [],
					};
				}
				payouts.restaurants[order.restaurantId].amount += restaurantPayout;
				payouts.restaurants[order.restaurantId].orders.push(orderId);

				// Calculate delivery agent payout if applicable
				if (order.deliveryAgentId) {
					const agentPayout = order.deliveryFee * DELIVERY_AGENT_SHARE;

					if (!payouts.deliveryAgents[order.deliveryAgentId]) {
						payouts.deliveryAgents[order.deliveryAgentId] = {
							amount: 0,
							orders: [],
						};
					}
					payouts.deliveryAgents[order.deliveryAgentId].amount += agentPayout;
					payouts.deliveryAgents[order.deliveryAgentId].orders.push(orderId);
				}
			});

			// Create payout documents
			const payoutsRef = db.collection('payouts');
			const payoutsToCreate = [];

			// Create restaurant payouts
			for (const [restaurantId, data] of Object.entries(payouts.restaurants)) {
				const payoutData = {
					type: 'restaurant',
					recipientId: restaurantId,
					amount: Math.round(data.amount), // Convert to kobo
					status: 'pending',
					orders: data.orders,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				};
				payoutsToCreate.push(payoutsRef.add(payoutData));
			}

			// Create delivery agent payouts
			for (const [agentId, data] of Object.entries(payouts.deliveryAgents)) {
				const payoutData = {
					type: 'delivery_agent',
					recipientId: agentId,
					amount: Math.round(data.amount * 100), // Convert to kobo
					status: 'pending',
					orders: data.orders,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				};
				payoutsToCreate.push(payoutsRef.add(payoutData));
			}

			// Execute all updates and creates in a batch
			await Promise.all([...ordersToUpdate, ...payoutsToCreate]);
			console.log(`Processed ${ordersSnapshot.size} orders for payout`);

			return null;
		} catch (error) {
			console.error('Error processing payouts:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to process payouts'
			);
		}
	}
);

// 2. Function to process pending payouts
exports.processPayouts = onSchedule(
	{
		schedule: '0 1 * * *', // Runs every day at 1:00 AM
		timeZone: 'Africa/Lagos',
	},
	async (event) => {
		try {
			// Get all pending payouts
			const payoutsSnapshot = await db
				.collection('payouts')
				.where('status', '==', 'pending')
				.get();

			if (payoutsSnapshot.empty) {
				console.log('No pending payouts to process');
				return null;
			}

			// Process each payout
			const batch = db.batch();
			const payoutsToUpdate = [];

			for (const doc of payoutsSnapshot.docs) {
				const payout = doc.data();
				const payoutRef = db.collection('payouts').doc(doc.id);

				try {
					// Get recipient's transfer recipient code
					const recipientDoc = await db
						.collection('users')
						.doc(payout.recipientId)
						.get();
					const recipientData = recipientDoc.data();
					const recipientCode = recipientData.bankAccount?.recipientCode;

					if (!recipientCode) {
						console.warn(
							`No recipient code for ${payout.type} ${payout.recipientId}`
						);
						continue;
					}

					// Initiate transfer via Paystack
					const transfer = await paystack.transfer.create({
						source: 'balance',
						amount: payout.amount,
						recipient: recipientCode,
						reference: `payout_${Date.now()}_${doc.id}`,
						reason: `${payout.type} payout`,
					});

					// Update payout status
					payoutsToUpdate.push(
						payoutRef.update({
							status: 'processing',
							transferReference: transfer.data.reference,
							updatedAt: admin.firestore.FieldValue.serverTimestamp(),
						})
					);

					console.log(
						`Initiated transfer of ₦${payout.amount / 100} to ${payout.type} ${
							payout.recipientId
						}`
					);
				} catch (error) {
					console.error(`Failed to process payout ${doc.id}:`, error);
					payoutsToUpdate.push(
						payoutRef.update({
							status: 'failed',
							error: error.message,
							updatedAt: admin.firestore.FieldValue.serverTimestamp(),
						})
					);
				}
			}

			// Update all payouts in a batch
			await Promise.all(payoutsToUpdate);
			return null;
		} catch (error) {
			console.error('Error in processPayouts:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to process payouts'
			);
		}
	}
);

// 3. Webhook to handle Paystack transfer updates
exports.handlePaystackWebhook = onRequest(
	{ cors: true }, // Enable CORS if needed
	async (req, res) => {
		const crypto = require('crypto');
		const signature = req.headers['x-paystack-signature'];
		const hash = crypto
			.createHmac('sha512', functions.config().paystack.secret_key)
			.update(JSON.stringify(req.body))
			.digest('hex');

		if (hash !== signature) {
			console.error('Invalid webhook signature');
			return res.status(401).send('Invalid signature');
		}

		const event = req.body;
		const db = admin.firestore();

		try {
			switch (event.event) {
				case 'transfer.success':
					await handleTransferSuccess(event.data, db);
					break;

				case 'transfer.failed':
				case 'transfer.reversed':
					await handleTransferFailure(event.data, db);
					break;

				default:
					console.log(`Unhandled event type: ${event.event}`);
			}

			res.status(200).send('Webhook processed');
		} catch (error) {
			console.error('Error processing webhook:', error);
			res.status(500).send('Error processing webhook');
		}
	}
);

// Helper function to handle successful transfers
async function handleTransferSuccess(transferData, db) {
	const { reference, amount, recipient } = transferData;

	// Find the payout with this transfer reference
	const payoutsSnapshot = await db
		.collection('payouts')
		.where('transferReference', '==', reference)
		.limit(1)
		.get();

	if (payoutsSnapshot.empty) {
		console.error(`No payout found for transfer reference: ${reference}`);
		return;
	}

	const payoutDoc = payoutsSnapshot.docs[0];
	const payoutData = payoutDoc.data();

	// Update payout status
	await payoutDoc.ref.update({
		status: 'completed',
		completedAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	console.log(`Payout ${payoutDoc.id} marked as completed`);
}

// Helper function to handle failed transfers
async function handleTransferFailure(transferData, db) {
	const { reference, reason } = transferData;

	// Find the payout with this transfer reference
	const payoutsSnapshot = await db
		.collection('payouts')
		.where('transferReference', '==', reference)
		.limit(1)
		.get();

	if (payoutsSnapshot.empty) {
		console.error(`No payout found for transfer reference: ${reference}`);
		return;
	}

	const payoutDoc = payoutsSnapshot.docs[0];

	// Update payout status
	await payoutDoc.ref.update({
		status: 'failed',
		failureReason: reason || 'Transfer failed',
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	console.error(`Payout ${payoutDoc.id} failed: ${reason}`);
}

// 4. Function to update order with commission and service charge
exports.calculateOrderCommissions = onDocumentCreated(
	'orders/{orderId}',
	async (event) => {
		const order = event.data.data();
		const orderRef = event.data.ref;
		try {
			// Skip if already calculated
			if (order.commissionCalculated) {
				return null;
			}

			const restaurantRef = db
				.collection('restaurants')
				.doc(order.restaurantId);
			const restaurantDoc = await restaurantRef.get();

			if (!restaurantDoc.exists) {
				throw new Error(`Restaurant ${order.restaurantId} not found`);
			}

			const restaurantData = restaurantDoc.data();
			const tier = restaurantData.tier || 1; // Default to tier 1 if not set

			// Calculate commission (7.5% for tier 1, 3% for tier 2)
			const commissionRate = tier === 2 ? 0.03 : 0.075;
			const commissionAmount =
				order.orderItemsTotal * commissionRate + SERVICE_CHARGE / 100; // Convert kobo to naira for calculation

			// Calculate restaurant payout
			const restaurantPayout = order.orderItemsTotal - commissionAmount;

			// Update order with commission details
			await orderRef.update({
				commissionRate,
				commissionAmount,
				serviceCharge: SERVICE_CHARGE,
				restaurantPayout,
				commissionCalculated: true,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log(
				`Calculated commission for order ${context.params.orderId}: ₦${
					commissionAmount / 100
				}`
			);
		} catch (error) {
			console.error('Error calculating commission:', error);
			// Mark as failed but don't throw to prevent infinite retries
			await orderRef.update({
				commissionCalculationError: error.message,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
		}

		return null;
	}
);
// Cloud Storage function to generate signed URLs
exports.getSignedUrl = functions.https.onCall(async (data, context) => {
	if (!context.auth) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Authentication required'
		);
	}

	const { filePath } = data;
	const bucket = admin.storage().bucket();
	const file = bucket.file(filePath);
	const [url] = await file.getSignedUrl({
		action: 'read',
		expires: '03-01-2500', // Far future expiration
	});
	return { url };
});

// Send push notification to restaurant for new order
exports.notifyRestaurantNewOrder = onDocumentCreated(
	'orders/{orderId}',
	async (event) => {
		const order = event.data.data();
		const restaurantRef = admin
			.firestore()
			.collection('restaurants')
			.doc(order.restaurantId);
		const restaurant = await restaurantRef.get();
		const tokens = restaurant.data().fcmTokens || [];

		if (tokens.length === 0) return null;

		const message = {
			notification: {
				title: 'New Order Received',
				body: `New order #${order.orderNumber || ''} has been placed.`,
			},
			tokens: tokens,
		};

		try {
			await admin.messaging().sendMulticast(message);
			console.log('New order notification sent successfully');
		} catch (error) {
			console.error('Error sending new order notification:', error);
		}
		return null;
	}
);
// Send notification for new restaurant review
exports.notifyRestaurantNewReview = onDocumentCreated(
	'reviews/{reviewId}',
	async (event) => {
		const review = event.data.data();
		if (!review.restaurantId) return null;

		const restaurantRef = admin
			.firestore()
			.collection('restaurants')
			.doc(review.restaurantId);
		const restaurant = await restaurantRef.get();
		const tokens = restaurant.data().fcmTokens || [];

		if (tokens.length === 0) return null;

		const message = {
			notification: {
				title: 'New Review Received',
				body: 'You have received a new review!',
			},
			tokens: tokens,
		};

		try {
			await admin.messaging().sendMulticast(message);
			console.log('New review notification sent successfully');
		} catch (error) {
			console.error('Error sending new review notification:', error);
		}
		return null;
	}
);

// Notify restaurant about order status updates
exports.notifyRestaurantOrderUpdate = onDocumentUpdated(
	'orders/{orderId}',
	async (event) => {
		const newValue = event.data.after.data();
		const previousValue = event.data.before.data();

		// Only proceed if status changed
		if (newValue.status === previousValue.status) return null;

		const restaurantRef = admin
			.firestore()
			.collection('restaurants')
			.doc(newValue.restaurantId);
		const restaurant = await restaurantRef.get();
		const tokens = restaurant.data().fcmTokens || [];

		if (tokens.length === 0) return null;

		const message = {
			notification: {
				title: `Order ${newValue.status}`,
				body: `Order #${newValue.orderNumber || ''} is now ${newValue.status}.`,
			},
			tokens: tokens,
		};

		try {
			await admin.messaging().sendMulticast(message);
			console.log('Order update notification sent successfully');
		} catch (error) {
			console.error('Error sending order update notification:', error);
		}
		return null;
	}
);

// Send low stock notification to restaurant
exports.sendLowStockNotification = onDocumentUpdated(
	'menuItems/{itemId}',
	async (event) => {
		const newValue = event.data.after.data();
		const previousValue = event.data.before.data();

		// Only proceed if stock was updated and is now low
		if (newValue.stock === previousValue.stock || newValue.stock > 10)
			return null;

		const restaurantRef = admin
			.firestore()
			.collection('restaurants')
			.doc(newValue.restaurantId);
		const restaurant = await restaurantRef.get();
		const tokens = restaurant.data().fcmTokens || [];

		if (tokens.length === 0) return null;

		const message = {
			notification: {
				title: 'Low Stock Alert',
				body: `${newValue.name} is running low. Only ${newValue.stock} left in stock.`,
			},
			tokens: tokens,
		};

		try {
			await admin.messaging().sendMulticast(message);
			console.log('Low stock notification sent successfully');
		} catch (error) {
			console.error('Error sending low stock notification:', error);
		}
		return null;
	}
);
// Update restaurant's average rating when a new review is added
exports.updateRestaurantRating = onDocumentCreated(
	'reviews/{reviewId}',
	async (event) => {
		const review = event.data.data();
		if (!review.restaurantId) return null;

		const restaurantRef = admin
			.firestore()
			.collection('restaurants')
			.doc(review.restaurantId);
		const reviewsSnapshot = await admin
			.firestore()
			.collection('reviews')
			.where('restaurantId', '==', review.restaurantId)
			.get();

		const reviews = reviewsSnapshot.docs.map((doc) => doc.data().rating);
		const averageRating =
			reviews.length > 0
				? reviews.reduce((a, b) => a + b, 0) / reviews.length
				: 0;

		try {
			await restaurantRef.update({
				rating: averageRating,
				totalRatings: reviews.length,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			console.log('Restaurant rating updated successfully');
		} catch (error) {
			console.error('Error updating restaurant rating:', error);
		}
		return null;
	}
);
