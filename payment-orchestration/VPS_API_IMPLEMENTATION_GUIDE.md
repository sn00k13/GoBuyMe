# VPS API Implementation Guide

## Store Order Support

This guide provides the exact code changes needed in your VPS API project to support store orders (no vendor payouts).

---

## 📁 Files to Update

Based on your `app.js`, you need to update these route files:

1. **`routes/commission.js`** - Update `/api/calculate-commission` endpoint
2. **`routes/payouts.js`** - Update `/api/initiate-vendor-payout` endpoint
3. **`routes/payouts.js`** - Verify `/api/initiate-agent-payout` works for both order types

---

## 1. Update `routes/commission.js`

### Current Logic (Restaurant Orders Only)

Your current code likely looks something like this:

```javascript
router.post('/calculate-commission', async (req, res) => {
	const { orderId, orderValue, deliveryFee, vendorId, agentId } = req.body;

	// Get vendor tier
	const vendorDoc = await db.collection('restaurants').doc(vendorId).get();
	const vendorData = vendorDoc.data();
	const tier = vendorData.tier || 1;

	// Calculate commissions
	const commissionRate = tier === 1 ? 0.075 : 0.03;
	const vendorCommission = Math.round(orderValue * commissionRate);
	const vendorShare = orderValue - vendorCommission;
	const agentCommission = Math.round(deliveryFee * 0.15);
	const platformRevenue = vendorCommission + (deliveryFee - agentCommission);

	// Create transaction ledger
	// ...
});
```

### Updated Logic (Restaurant + Store Orders)

```javascript
router.post('/calculate-commission', async (req, res) => {
	try {
		const {
			orderId,
			orderValue,
			deliveryFee,
			vendorId,
			storeId,
			agentId,
			isStoreOrder,
		} = req.body;

		// Determine if this is a store order
		const isStore = isStoreOrder || (storeId && !vendorId);

		// Calculate agent commission (same for both order types)
		const agentCommission = Math.round(deliveryFee * 0.15); // 15% of delivery fee
		const deliveryFeeRemainder = deliveryFee - agentCommission;

		let vendorCommission = null;
		let vendorShare = null;
		let platformRevenue = null;
		let vendorTier = null;
		let commissionRate = null;

		if (isStore) {
			// STORE ORDER: No vendor commission
			vendorCommission = 0;
			vendorShare = null; // Stores don't get payouts
			platformRevenue = orderValue - agentCommission; // Platform keeps full order minus agent commission

			console.log(`📦 Store order commission calculated for order: ${orderId}`);
		} else {
			// RESTAURANT ORDER: Calculate vendor commission
			if (!vendorId) {
				return res.status(400).json({
					success: false,
					error: 'vendorId is required for restaurant orders',
					code: 'MISSING_VENDOR_ID',
				});
			}

			// Get vendor tier
			const vendorDoc = await db.collection('restaurants').doc(vendorId).get();
			if (!vendorDoc.exists) {
				return res.status(404).json({
					success: false,
					error: 'Vendor not found',
					code: 'VENDOR_NOT_FOUND',
				});
			}

			const vendorData = vendorDoc.data();
			vendorTier = vendorData.tier || 1;
			commissionRate = vendorTier === 1 ? 0.075 : 0.03;
			vendorCommission = Math.round(orderValue * commissionRate);
			vendorShare = orderValue - vendorCommission;
			platformRevenue = vendorCommission + deliveryFeeRemainder;

			console.log(
				`🍽️ Restaurant order commission calculated for order: ${orderId}, tier: ${vendorTier}`
			);
		}

		// Create transaction ledger document
		const ledgerData = {
			orderId,
			orderValue,
			deliveryFee,
			vendorId: vendorId || null,
			storeId: storeId || null,
			agentId: agentId || null,
			isStoreOrder: isStore,
			paymentStatus: 'pending',
			currency: 'NGN',

			// Commission breakdown
			vendorCommission: isStore
				? null
				: {
						tier: vendorTier,
						commissionRate: commissionRate,
						totalCommission: vendorCommission,
						vendorShare: vendorShare,
				  },

			agentCommission: {
				agentShare: agentCommission,
				commissionRate: 0.15,
			},

			platformRevenue: {
				vendorCommission: vendorCommission || 0,
				deliveryFeeRemainder: deliveryFeeRemainder,
				totalRevenue: platformRevenue,
			},

			// Payout status
			payoutStatus: {
				vendor: {
					status: isStore ? 'not_applicable' : 'pending',
					payoutTaskId: null,
					transferId: null,
					transferCode: null,
					paidAt: null,
					failureReason: null,
				},
				agent: {
					status: 'pending',
					payoutTaskId: null,
					transferId: null,
					transferCode: null,
					paidAt: null,
					failureReason: null,
				},
			},

			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
			webhookEvents: [],
		};

		// Save to Firestore
		const ledgerRef = db.collection('transaction_ledger').doc(orderId);
		await ledgerRef.set(ledgerData);

		// Return response
		res.json({
			success: true,
			transactionLedgerId: orderId,
			commission: {
				vendorCommission: isStore
					? null
					: {
							tier: vendorTier,
							commissionRate: commissionRate,
							totalCommission: vendorCommission,
							vendorShare: vendorShare,
					  },
				agentCommission: {
					agentShare: agentCommission,
					commissionRate: 0.15,
				},
				platformRevenue: {
					vendorCommission: vendorCommission || 0,
					deliveryFeeRemainder: deliveryFeeRemainder,
					totalRevenue: platformRevenue,
				},
			},
			isStoreOrder: isStore,
		});
	} catch (error) {
		console.error('Commission calculation error:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Failed to calculate commission',
			code: 'INTERNAL_ERROR',
		});
	}
});
```

---

## 2. Update `routes/payouts.js`

### Update `/api/initiate-vendor-payout`

Add a check to reject store orders:

```javascript
router.post('/initiate-vendor-payout', async (req, res) => {
	try {
		const { orderId, transactionLedgerId } = req.body;

		// Get order from Firestore
		const orderDoc = await db.collection('orders').doc(orderId).get();
		if (!orderDoc.exists) {
			return res.status(404).json({
				success: false,
				error: 'Order not found',
				code: 'ORDER_NOT_FOUND',
			});
		}

		const orderData = orderDoc.data();

		// Check if this is a store order - stores don't get vendor payouts
		if (orderData.storeId && !orderData.vendorId) {
			return res.status(400).json({
				success: false,
				error: 'Store orders do not have vendor payouts',
				code: 'INVALID_ORDER_TYPE',
			});
		}

		// Check if vendorId exists (restaurant order)
		if (!orderData.vendorId) {
			return res.status(400).json({
				success: false,
				error: 'Order does not have a vendor',
				code: 'NO_VENDOR',
			});
		}

		// Get transaction ledger
		const ledgerDoc = await db
			.collection('transaction_ledger')
			.doc(transactionLedgerId || orderId)
			.get();
		if (!ledgerDoc.exists) {
			return res.status(404).json({
				success: false,
				error: 'Transaction ledger not found',
				code: 'LEDGER_NOT_FOUND',
			});
		}

		const ledgerData = ledgerDoc.data();

		// Check if vendor commission exists
		if (
			!ledgerData.vendorCommission ||
			ledgerData.vendorCommission.vendorShare === null
		) {
			return res.status(400).json({
				success: false,
				error: 'No vendor commission found for this order',
				code: 'NO_VENDOR_COMMISSION',
			});
		}

		// Your existing vendor payout logic here...
		// (Get vendor payout details, create payout task, etc.)
	} catch (error) {
		console.error('Vendor payout initiation error:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Failed to initiate vendor payout',
			code: 'INTERNAL_ERROR',
		});
	}
});
```

### Verify `/api/initiate-agent-payout`

This endpoint should work the same for both restaurant and store orders. No changes needed, but verify it works correctly:

```javascript
router.post('/initiate-agent-payout', async (req, res) => {
	try {
		const { orderId, transactionLedgerId, agentId } = req.body;

		// This works for both restaurant and store orders
		// Agent commission is calculated the same way (15% of delivery fee)

		// Your existing agent payout logic...
	} catch (error) {
		// Error handling...
	}
});
```

---

## 3. Update Batch Payout Processor

In `routes/payouts.js`, update the batch processor to skip store orders when processing vendor payouts:

```javascript
router.post('/process-batch-payouts', async (req, res) => {
	try {
		const { type } = req.body; // 'vendor' | 'agent' | 'all'

		// When processing vendor payouts, filter out store orders
		if (type === 'vendor' || type === 'all') {
			const vendorPayoutsQuery = db
				.collection('pending_payouts')
				.where('recipientType', '==', 'vendor')
				.where('status', '==', 'pending')
				// Add filter to exclude store orders if needed
				// You might need to check the order document to verify it's not a store order
				.get();

			// Process vendor payouts...
			// Make sure to skip any payouts for store orders
		}

		// Agent payouts work for both order types
		if (type === 'agent' || type === 'all') {
			// Process agent payouts (no changes needed)
		}
	} catch (error) {
		// Error handling...
	}
});
```

---

## 🧪 Testing

### Test Store Order Commission

```bash
curl -X POST https://kwuo.gobuyme.shop/api/calculate-commission \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_store_order_123",
    "orderValue": 10000,
    "deliveryFee": 500,
    "vendorId": null,
    "storeId": "store_456",
    "agentId": null,
    "isStoreOrder": true
  }'
```

**Expected Response**:

- `vendorCommission: null`
- `agentCommission.agentShare: 75` (15% of 500)
- `platformRevenue.totalRevenue: 9925` (10000 - 75)

### Test Restaurant Order Commission

```bash
curl -X POST https://kwuo.gobuyme.shop/api/calculate-commission \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_restaurant_order_123",
    "orderValue": 10000,
    "deliveryFee": 500,
    "vendorId": "restaurant_456",
    "storeId": null,
    "agentId": null,
    "isStoreOrder": false
  }'
```

**Expected Response**:

- `vendorCommission` with tier, commissionRate, totalCommission, vendorShare
- `agentCommission.agentShare: 75`
- `platformRevenue` with vendor commission included

### Test Vendor Payout Rejection for Store Orders

```bash
curl -X POST https://kwuo.gobuyme.shop/api/initiate-vendor-payout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "store_order_123",
    "transactionLedgerId": "store_order_123"
  }'
```

**Expected Response**: 400 error with message "Store orders do not have vendor payouts"

---

## 📋 Checklist

- [ ] Update `routes/commission.js` to handle `isStoreOrder` flag
- [ ] Skip vendor commission calculation for store orders
- [ ] Update `routes/payouts.js` to reject vendor payouts for store orders
- [ ] Verify agent payout works for both order types
- [ ] Update batch processor to handle store orders correctly
- [ ] Test with store order
- [ ] Test with restaurant order
- [ ] Verify transaction ledger structure for both order types

---

## 🔗 Reference Documentation

For complete API specifications, see:

- `payment-orchestration/API_ENDPOINTS.md` - Complete endpoint documentation
- `payment-orchestration/IMPLEMENTATION_SUMMARY.md` - React Native integration details
- `payment-orchestration/DATA_MODELS.md` - Firestore data models

---

**Status**: Ready for Implementation  
**Last Updated**: 2024-01-15
