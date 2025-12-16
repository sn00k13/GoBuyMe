import { getAuth } from 'firebase/auth';
import logger from '../utils/logger';

const API_BASE_URL = 'https://kwuo.gobuyme.shop/api';

// Get Firebase auth token for API calls
const getAuthToken = async () => {
	const auth = getAuth();
	if (auth.currentUser) {
		return await auth.currentUser.getIdToken();
	}
	throw new Error('User not authenticated');
};

// Generic API call function
const apiCall = async (endpoint, method = 'GET', body = null) => {
	try {
		const token = await getAuthToken();
		const headers = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		};

		const config = {
			method,
			headers,
		};

		if (body) {
			logger.apiCall(endpoint, method, body);
			config.body = JSON.stringify(body);
		}

		const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
		const data = await response.json();

		logger.apiResponse(endpoint, response.status, data);

		if (!response.ok) {
			throw new Error(data.error || `API Error: ${response.status}`);
		}

		return data;
	} catch (error) {
		logger.error(`API Call Error (${endpoint}):`, error);
		throw error;
	}
};

/**
 * Calculate commission when order is created
 * For restaurants: calculates vendor commission + agent commission + platform revenue
 * For stores: calculates only agent commission + platform revenue (no vendor payout)
 *
 * @param {Object} orderData - Order data
 * @param {string} orderData.orderId - Order ID
 * @param {number} orderData.orderValue - Order value in kobo
 * @param {number} orderData.deliveryFee - Delivery fee in kobo
 * @param {string} orderData.vendorId - Restaurant ID (if restaurant order)
 * @param {string} orderData.storeId - Store ID (if store order)
 * @param {string|null} orderData.agentId - Agent ID (optional, set when agent assigned)
 * @returns {Promise<Object>} Commission calculation result
 */
export const calculateCommission = async (orderData) => {
	const {
		orderId,
		orderValue,
		deliveryFee,
		vendorId,
		storeId,
		agentId,
		restaurantId,
	} = orderData;

	// Validate required fields
	if (!orderId) {
		throw new Error('Missing required field: orderId');
	}
	if (orderValue === undefined || orderValue === null) {
		throw new Error('Missing required field: orderValue');
	}
	if (deliveryFee === undefined || deliveryFee === null) {
		throw new Error('Missing required field: deliveryFee');
	}

	// Determine if this is a store order (no vendor payout)
	const isStoreOrder = !!storeId && !vendorId && !restaurantId;

	// Use restaurantId if provided, otherwise use vendorId (they're aliases)
	// For store orders, send empty string instead of null to satisfy backend validation
	const finalRestaurantId =
		restaurantId || vendorId || (isStoreOrder ? '' : null);

	// Build request body
	const requestBody = {
		orderId,
		orderValue, // in kobo
		deliveryFee, // in kobo
		restaurantId: finalRestaurantId, // Backend requires this field
		storeId: storeId || null, // set for store orders
		agentId: agentId || null,
		isStoreOrder, // flag to indicate store order (no vendor payout)
	};

	// Only include vendorId if it's not a store order (some APIs use this as alias)
	if (!isStoreOrder && finalRestaurantId) {
		requestBody.vendorId = finalRestaurantId;
	}

	// Log request for debugging
	logger.log('Calculating commission with data:', {
		orderId,
		orderValue,
		deliveryFee,
		restaurantId: finalRestaurantId,
		storeId: storeId || null,
		isStoreOrder,
	});

	return await apiCall('/calculate-commission', 'POST', requestBody);
};

/**
 * Initiate vendor payout when order is confirmed
 * Only for restaurant orders, not store orders
 *
 * @param {string} orderId - Order ID
 * @param {string} transactionLedgerId - Transaction ledger ID
 * @returns {Promise<Object>} Payout initiation result
 */
export const initiateVendorPayout = async (orderId, transactionLedgerId) => {
	return await apiCall('/initiate-vendor-payout', 'POST', {
		orderId,
		transactionLedgerId,
	});
};

/**
 * Initiate agent payout when order is delivered
 * Works for both restaurant and store orders
 *
 * @param {string} orderId - Order ID
 * @param {string} transactionLedgerId - Transaction ledger ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Payout initiation result
 */
export const initiateAgentPayout = async (
	orderId,
	transactionLedgerId,
	agentId
) => {
	return await apiCall('/initiate-agent-payout', 'POST', {
		orderId,
		transactionLedgerId,
		agentId,
	});
};

/**
 * Get transaction ledger for an order
 *
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Transaction ledger data
 */
export const getTransactionLedger = async (orderId) => {
	return await apiCall(`/transaction-ledger/${orderId}`, 'GET');
};

/**
 * Get pending payouts
 *
 * @param {Object} filters - Filter options
 * @param {string} filters.type - 'vendor' | 'agent' | 'all'
 * @param {string} filters.recipientId - Filter by recipient ID
 * @param {string} filters.status - Filter by status
 * @param {number} filters.limit - Number of results
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<Object>} Pending payouts data
 */
export const getPendingPayouts = async (filters = {}) => {
	const queryParams = new URLSearchParams(filters).toString();
	const endpoint = queryParams
		? `/pending-payouts?${queryParams}`
		: '/pending-payouts';
	return await apiCall(endpoint, 'GET');
};

export default {
	calculateCommission,
	initiateVendorPayout,
	initiateAgentPayout,
	getTransactionLedger,
	getPendingPayouts,
};
