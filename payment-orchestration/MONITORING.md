# Monitoring, Logging & Alerting Configuration
## Payment Orchestration System

---

## 1. Cloud Logging Setup

### Log Structure

All payment-related functions log structured JSON for easy querying:

```javascript
{
  "severity": "INFO" | "WARNING" | "ERROR" | "CRITICAL",
  "function": "payment-orchestration",
  "component": "commission-calculator" | "payout-processor" | "webhook-handler",
  "orderId": "...",
  "transactionId": "...",
  "amount": 0,
  "currency": "NGN",
  "timestamp": "...",
  "message": "...",
  "metadata": {}
}
```

### Key Log Queries

#### Find Failed Payouts
```
resource.type="cloud_function"
jsonPayload.component="payout-processor"
jsonPayload.severity="ERROR"
jsonPayload.status="failed"
```

#### Find Payment Webhooks
```
resource.type="cloud_function"
jsonPayload.component="webhook-handler"
jsonPayload.event="charge.success"
```

#### Find Commission Calculation Errors
```
resource.type="cloud_function"
jsonPayload.component="commission-calculator"
jsonPayload.severity="ERROR"
```

---

## 2. Cloud Monitoring Metrics

### Custom Metrics to Track

#### Financial Metrics
- `total_payout_amount` (gauge) - Total amount paid out daily
- `total_commission_collected` (gauge) - Total platform commission
- `pending_payout_amount` (gauge) - Amount awaiting payout
- `failed_payout_amount` (gauge) - Amount in failed payouts

#### Performance Metrics
- `payout_processing_duration` (histogram) - Time to process batch payouts
- `commission_calculation_duration` (histogram) - Time to calculate commissions
- `webhook_processing_duration` (histogram) - Time to process webhooks

#### Volume Metrics
- `orders_per_day` (counter) - Daily order count
- `payouts_processed` (counter) - Daily payout count
- `webhooks_received` (counter) - Webhook event count

#### Error Metrics
- `payout_failure_rate` (gauge) - Percentage of failed payouts
- `webhook_failure_rate` (gauge) - Percentage of failed webhook processing
- `commission_calculation_errors` (counter) - Commission calculation failures

### Metric Collection Example

```javascript
// In Cloud Functions
const {MetricServiceClient} = require("@google-cloud/monitoring");

const metricClient = new MetricServiceClient();

async function recordMetric(metricName, value, labels = {}) {
  const projectId = process.env.GCP_PROJECT_ID;
  const projectName = metricClient.projectPath(projectId);

  const request = {
    name: projectName,
    timeSeries: [{
      metric: {
        type: `custom.googleapis.com/payment/${metricName}`,
        labels: labels,
      },
      points: [{
        interval: {
          endTime: {
            seconds: Date.now() / 1000,
          },
        },
        value: {
          doubleValue: value,
        },
      }],
    }],
  };

  await metricClient.createTimeSeries({name: projectName, timeSeries: [request.timeSeries[0]]});
}
```

---

## 3. Alerting Policies

### Critical Alerts

#### 1. High Payout Failure Rate
- **Condition**: `payout_failure_rate > 0.05` (5%)
- **Duration**: 5 minutes
- **Notification**: Email + PagerDuty/SMS
- **Severity**: CRITICAL

#### 2. Unprocessed Payouts > 48 Hours
- **Condition**: Count of `pending_payouts` with `createdAt < now - 48h` > 10
- **Duration**: 1 hour
- **Notification**: Email
- **Severity**: HIGH

#### 3. Financial Discrepancy Detected
- **Condition**: Difference between ledger and actual balance > threshold
- **Duration**: Immediate
- **Notification**: Email + Phone call
- **Severity**: CRITICAL

#### 4. Webhook Processing Failures
- **Condition**: `webhook_failure_rate > 0.10` (10%)
- **Duration**: 10 minutes
- **Notification**: Email
- **Severity**: HIGH

#### 5. Batch Payout Processor Failed
- **Condition**: Cloud Function execution failed
- **Duration**: Immediate
- **Notification**: Email + PagerDuty
- **Severity**: CRITICAL

### Warning Alerts

#### 1. Commission Calculation Errors
- **Condition**: `commission_calculation_errors > 10` per hour
- **Duration**: 15 minutes
- **Notification**: Email
- **Severity**: WARNING

#### 2. Slow Payout Processing
- **Condition**: `payout_processing_duration > 300` seconds
- **Duration**: 10 minutes
- **Notification**: Email
- **Severity**: WARNING

#### 3. Low Paystack Balance
- **Condition**: Paystack balance < expected daily payout amount
- **Duration**: 30 minutes
- **Notification**: Email
- **Severity**: WARNING

---

## 4. Error Reporting (Stackdriver Error Reporting)

### Automatic Error Detection

Cloud Functions automatically report errors to Error Reporting. Configure:

1. **Error Grouping**: Group by error message and stack trace
2. **Notification Channels**: 
   - Email for new error types
   - PagerDuty for critical errors
   - Slack for development team

### Manual Error Reporting

```javascript
const {ErrorReporting} = require("@google-cloud/error-reporting");

const errors = new ErrorReporting({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Report custom errors
errors.report(new Error("Payout processing failed"), {
  user: recipientId,
  context: {
    orderId: orderId,
    amount: amount,
  },
});
```

---

## 5. Dashboard Configuration

### Recommended Dashboard Panels

#### Financial Overview
1. **Daily Revenue** - Line chart of platform revenue
2. **Total Payouts** - Bar chart of daily payouts
3. **Commission Breakdown** - Pie chart (vendor vs agent)
4. **Pending Payouts** - Gauge showing amount awaiting payout

#### System Health
1. **Payout Success Rate** - Percentage gauge
2. **Average Processing Time** - Line chart
3. **Error Rate** - Line chart
4. **Active Orders** - Counter

#### Alert Summary
1. **Active Alerts** - Table of current alerts
2. **Alert History** - Timeline of past alerts

### Dashboard Creation Example

```bash
# Create dashboard using gcloud CLI or Cloud Console
# JSON dashboard configuration available in dashboard-config.json
```

---

## 6. Log Retention & Archival

### Retention Policy
- **Active Logs**: 30 days in Cloud Logging
- **Archived Logs**: 1 year in Cloud Storage (bucket: `payment-logs-archive`)
- **Critical Financial Logs**: 7 years (compliance requirement)

### Archival Script

```javascript
// Scheduled Cloud Function to archive logs
const {Logging} = require("@google-cloud/logging");
const {Storage} = require("@google-cloud/storage");

exports.archivePaymentLogs = functions.pubsub
    .schedule("0 2 * * *") // Daily at 2 AM
    .onRun(async (context) => {
      const logging = new Logging();
      const storage = new Storage();
      const bucket = storage.bucket("payment-logs-archive");

      // Archive logs older than 30 days
      // Implementation details...
    });
```

---

## 7. Audit Trail

### Financial Audit Logs

All financial operations are logged with:
- Timestamp
- User/Action ID
- Amount
- Reference IDs
- Status (success/failure)
- Error details (if failed)

### Audit Log Collection

```javascript
// In each payment function
await db.collection("audit_logs").add({
  eventType: "payout_processed",
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  userId: context.auth?.uid || "system",
  action: "batch_payout",
  details: {
    batchId: batchId,
    amount: totalAmount,
    recipientCount: recipientCount,
  },
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

---

## 8. Health Checks

### Endpoint Monitoring

Create HTTP health check endpoints:

```javascript
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  const checks = {
    database: false,
    paystack: false,
    timestamp: new Date().toISOString(),
  };

  // Check Firestore connection
  try {
    await db.collection("_health").doc("check").get();
    checks.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  // Check Paystack API
  try {
    const {verifyPayment} = require("./src/utils/paystack");
    // Simple API check
    checks.paystack = true;
  } catch (error) {
    console.error("Paystack health check failed:", error);
  }

  const allHealthy = checks.database && checks.paystack;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "unhealthy",
    checks: checks,
  });
});
```

---

## 9. Notification Channels Setup

### Email Notifications
- **Team Email**: payments@yourcompany.com
- **On-Call Email**: oncall-payments@yourcompany.com

### PagerDuty Integration
- **Service**: Payment Orchestration
- **Escalation Policy**: Critical alerts → On-call engineer → Engineering lead

### Slack Integration
- **Channel**: #payments-alerts
- **Webhook**: For non-critical alerts and daily summaries

---

## 10. Daily Reporting

### Automated Daily Summary

```javascript
exports.dailyPaymentSummary = functions.pubsub
    .schedule("0 9 * * *") // 9 AM daily
    .timeZone("Africa/Lagos")
    .onRun(async (context) => {
      // Query yesterday's transactions
      // Generate summary report
      // Send via email/Slack
    });
```

### Report Contents
- Total orders processed
- Total revenue (platform commission)
- Total payouts (vendors + agents)
- Success/failure rates
- Top issues/errors
- Recommendations

---

## Implementation Checklist

- [ ] Set up Cloud Monitoring custom metrics
- [ ] Configure alerting policies in Cloud Monitoring
- [ ] Set up Error Reporting with notification channels
- [ ] Create Cloud Monitoring dashboard
- [ ] Configure log retention policies
- [ ] Set up log archival to Cloud Storage
- [ ] Implement audit logging for all financial operations
- [ ] Create health check endpoints
- [ ] Configure notification channels (email, PagerDuty, Slack)
- [ ] Set up daily reporting function
- [ ] Test alerting and notification flows

