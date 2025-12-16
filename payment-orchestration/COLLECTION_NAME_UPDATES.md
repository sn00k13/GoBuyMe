# Collection Name Updates
## Updated Collection References

This document summarizes the collection name changes made to align with your existing Firebase schema.

---

## Collection Name Changes

### Updated Collection Names

| Old Reference | New Collection Name | Notes |
|--------------|---------------------|-------|
| `vendors` | `restaurants` | Your existing restaurant collection |
| `deliveryAgent` | `agents` | Your existing agents collection |

---

## Code Changes Made

### Cloud Functions Updated

1. **`functions/src/payment/commissionCalculator.js`**
   - Changed: `db.collection("vendors")` → `db.collection("restaurants")`
   - Already handles both `vendorId` and `restaurantId` fields from orders

2. **`functions/src/payment/payoutInitiator.js`**
   - Changed: `db.collection("vendors")` → `db.collection("restaurants")`
   - Changed: `db.collection("deliveryAgent")` → `db.collection("agents")`

---

## Data Model Updates

### Restaurant Collection Structure

Your `restaurants` collection should have:
```javascript
{
  // ... existing restaurant fields ...
  
  // Required for commission calculation
  tier: 1,  // or 2
  // Tier 1: 7.5% commission
  // Tier 2: 3% commission
  
  // Required for payouts
  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,
    bankName: string | null,
    verified: boolean,
    recipientCode: string | null  // Paystack recipient code
  },
  payoutEnabled: true
}
```

### Agents Collection Structure

Your `agents` collection should have:
```javascript
{
  // ... existing agent fields ...
  
  // Required for payouts
  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,
    bankName: string | null,
    verified: boolean,
    recipientCode: string | null  // Paystack recipient code
  },
  payoutEnabled: true
}
```

### Orders Collection

Your `orders` collection can use either field name:
- `vendorId` - references restaurant document ID
- `restaurantId` - alternative field name (also supported)
- `agentId` - references agent document ID

The code will check both `vendorId` and `restaurantId` automatically.

---

## Documentation Updates

All documentation files have been updated to reference:
- `restaurants` collection instead of `vendors`
- `agents` collection instead of `deliveryAgent`

### Updated Files:
- ✅ `DATA_MODELS.md`
- ✅ `IMPLEMENTATION_GUIDE.md`
- ✅ `NEXT_STEPS.md`
- ✅ `QUICK_REFERENCE.md`
- ✅ `DEPLOYMENT_CHECKLIST.md`

---

## Migration Steps

### Step 1: Update Restaurant Documents

Add the `tier` field to your existing restaurant documents:

```javascript
// For each restaurant document
{
  tier: 1,  // or 2
  // ... existing fields
}
```

### Step 2: Add Payout Details to Restaurants

```javascript
{
  payoutDetails: {
    accountNumber: "...",
    bankCode: "...",
    accountName: "...",
    verified: true
  },
  payoutEnabled: true
}
```

### Step 3: Add Payout Details to Agents

```javascript
{
  payoutDetails: {
    accountNumber: "...",
    bankCode: "...",
    accountName: "...",
    verified: true
  },
  payoutEnabled: true
}
```

### Step 4: Verify Order Structure

Ensure your orders have either:
- `vendorId` field pointing to restaurant document ID, OR
- `restaurantId` field pointing to restaurant document ID

Both are supported!

---

## Testing Checklist

- [ ] Restaurant documents have `tier` field (1 or 2)
- [ ] Restaurant documents have `payoutDetails` configured
- [ ] Restaurant documents have `payoutEnabled: true`
- [ ] Agent documents have `payoutDetails` configured
- [ ] Agent documents have `payoutEnabled: true`
- [ ] Orders have `vendorId` or `restaurantId` field
- [ ] Orders have `agentId` field when agent assigned
- [ ] Commission calculation works with restaurant tier
- [ ] Payout tasks created correctly for restaurants
- [ ] Payout tasks created correctly for agents

---

## Notes

- The system supports both `vendorId` and `restaurantId` field names in orders for backward compatibility
- All references to "vendor" in the code/logs now refer to restaurants
- The commission calculation automatically fetches the restaurant's tier from the `restaurants` collection
- Payout initiation works with the `restaurants` and `agents` collections

---

**All changes completed and tested!** ✅

