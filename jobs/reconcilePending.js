const mongoose = require('mongoose');
const db = require('../db');
const TransactionModel = require('../models/transaction');
const { PaystackProvider } = require('../services/payment/paystack.provider');
const {
  fulfillSuccessfulCredit,
  markTransactionFailed,
} = require('../services/payment/creditFulfillment');

/** Avoid racing a user who is still on the checkout page (in-process cron is coarse). */
const RECONCILE_MIN_AGE_MS = 60 * 1000;

/**
 * Polls Paystack for truth on stale pending rows. Complements webhooks.
 * Alternative: run this file on a schedule via OS crontab instead of node-cron in the API.
 */
async function runReconcileOnce() {
  const cutoff = new Date(Date.now() - RECONCILE_MIN_AGE_MS);
  const pending = await TransactionModel.find({
    status: 'pending',
    provider: 'paystack',
    created_at: { $lt: cutoff },
  }).limit(50);

  const paystack = new PaystackProvider();

  for (const tx of pending) {
    try {
      const { paystackStatus } = await paystack.verifyTransaction(tx._id);

      if (paystackStatus === 'success') {
        await fulfillSuccessfulCredit(tx._id);
      } else if (
        paystackStatus === 'failed' ||
        paystackStatus === 'abandoned'
      ) {
        await markTransactionFailed(tx._id);
      }
    } catch (err) {
      console.error('Reconcile error', tx._id, err.message);
    } finally {
      await TransactionModel.updateOne(
        { _id: tx._id },
        {
          $set: { lastReconciledAt: new Date() },
          $inc: { reconcileAttempts: 1 },
        }
      );
    }
  }
}

module.exports = { runReconcileOnce };

if (require.main === module) {
  db.connect();
  mongoose.connection.once('connected', async () => {
    try {
      await runReconcileOnce();
    } catch (e) {
      console.error(e);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
    process.exit();
  });
}
