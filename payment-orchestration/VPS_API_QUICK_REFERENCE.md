# VPS API Quick Reference
## Store Order Implementation

Quick reference for implementing store order support in your VPS API.

---

## Key Changes Summary

### 1. Commission Calculation (`routes/commission.js`)

**Store Orders**:
- ❌ NO vendor commission
- ✅ Agent commission (15% of delivery fee)
- ✅ Platform revenue = orderValue - agentCommission

**Restaurant Orders**:
- ✅ Vendor commission (Tier 1: 7.5%, Tier 2: 3%)
- ✅ Agent commission (15% of delivery fee)
- ✅ Platform revenue = vendorCommission + (deliveryFee - agentCommission)

### 2. Vendor Payout (`routes/payouts.js`)

**Store Orders**:
- ❌ Reject vendor payout requests
- Return 400 error: "Store orders do not have vendor payouts"

**Restaurant Orders**:
- ✅ Process vendor payout normally

### 3. Agent Payout (`routes/payouts.js`)

**Both Order Types**:
- ✅ Process agent payout the same way
- Agent commission = 15% of delivery fee

---

## Request Body Examples

### Store Order Commission Request
```json
{
  "orderId": "order_123",
  "orderValue": 10000,
  "deliveryFee": 500,
  "vendorId": null,
  "storeId": "store_456",
  "agentId": null,
  "isStoreOrder": true
}
```

### Restaurant Order Commission Request
```json
{
  "orderId": "order_123",
  "orderValue": 10000,
  "deliveryFee": 500,
  "vendorId": "restaurant_456",
  "storeId": null,
  "agentId": null,
  "isStoreOrder": false
}
```

---

## Transaction Ledger Structure

### Store Order Ledger
```javascript
{
  orderId: "order_123",
  storeId: "store_456",
  vendorId: null,
  vendorCommission: null,  // No vendor commission
  agentCommission: {
    agentShare: 75,
    commissionRate: 0.15
  },
  platformRevenue: {
    vendorCommission: 0,
    deliveryFeeRemainder: 425,
    totalRevenue: 9925  // orderValue - agentCommission
  },
  payoutStatus: {
    vendor: {
      status: "not_applicable"  // Stores don't get payouts
    },
    agent: {
      status: "pending"
    }
  }
}
```

### Restaurant Order Ledger
```javascript
{
  orderId: "order_123",
  vendorId: "restaurant_456",
  storeId: null,
  vendorCommission: {
    tier: 1,
    commissionRate: 0.075,
    totalCommission: 750,
    vendorShare: 9250
  },
  agentCommission: {
    agentShare: 75,
    commissionRate: 0.15
  },
  platformRevenue: {
    vendorCommission: 750,
    deliveryFeeRemainder: 425,
    totalRevenue: 1175
  },
  payoutStatus: {
    vendor: {
      status: "pending"
    },
    agent: {
      status: "pending"
    }
  }
}
```

---

## Code Snippets

### Check if Store Order
```javascript
const isStoreOrder = isStoreOrder || (storeId && !vendorId);
```

### Calculate Store Order Commission
```javascript
if (isStoreOrder) {
  const agentCommission = Math.round(deliveryFee * 0.15);
  const platformRevenue = orderValue - agentCommission;
  // No vendor commission
}
```

### Reject Store Order Vendor Payout
```javascript
if (orderData.storeId && !orderData.vendorId) {
  return res.status(400).json({
    success: false,
    error: 'Store orders do not have vendor payouts',
    code: 'INVALID_ORDER_TYPE'
  });
}
```

---

## Testing Commands

### Test Store Order
```bash
curl -X POST https://kwuo.gobuyme.shop/api/calculate-commission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","orderValue":10000,"deliveryFee":500,"storeId":"store_1","isStoreOrder":true}'
```

### Test Restaurant Order
```bash
curl -X POST https://kwuo.gobuyme.shop/api/calculate-commission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","orderValue":10000,"deliveryFee":500,"vendorId":"restaurant_1","isStoreOrder":false}'
```

---

**See `VPS_API_IMPLEMENTATION_GUIDE.md` for complete implementation details.**

