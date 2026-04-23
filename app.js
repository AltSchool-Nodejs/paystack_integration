const express = require('express');
const cron = require('node-cron');
const db = require('./db');
const TransactionModel = require('./models/transaction');
const { initiateCreditPayment } = require('./services/payment/initiateCredit');
const { createPaymentProvider } = require('./services/payment/factory');
const {
  fulfillSuccessfulCredit,
  markTransactionFailed,
} = require('./services/payment/creditFulfillment');
const { runReconcileOnce } = require('./jobs/reconcilePending');

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

db.connect();

// Production often runs reconciliation in a separate worker; in-process cron is for teaching demos.
cron.schedule('*/5 * * * *', () => {
  runReconcileOnce().catch((err) => console.error('reconcile cron', err));
});

app.get('/', (req, res) => {
  const name = req.query.name || 'World';
  res.send(`Welcome To Paystack Integration, I see you ${name}`);
});

app.post('/initiate_transaction', async (req, res) => {
  try {
    if (!req.body.amountInNaira || !req.body.email) {
      return res.status(400).json({
        message: 'Invalid request, add amountInNaira and/or email',
      });
    }

    const amount = Number(req.body.amountInNaira);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amountInNaira' });
    }

    const { paystackResponse } = await initiateCreditPayment({
      amount,
      email: req.body.email,
    });

    return res.json(paystackResponse);
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

app.get('/generate_url', async (req, res) => {
  if (!req.query.amount || !req.query.email) {
    return res.status(400).json({
      message: 'Invalid request, add amount and/or email',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.query.email)) {
    return res.status(400).json({
      message: 'Invalid email',
    });
  }

  const amount = Number(req.query.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const { init } = await initiateCreditPayment({
      amount,
      email: req.query.email,
    });
    return res.json({
      url: init.authorizationUrl,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Something went wrong' });
  }
});

app.get('/paystack/info', async (req, res) => {
  return res.json({
    message: 'Transaction successful',
  });
});

app.post('/stripe/callback', async (req, res) => {
  const provider = createPaymentProvider('stripe');
  return res.json({
    message: 'Stripe callback received',
  });
});

app.post('/paystack/success', async (req, res) => {
  return res.json({
    message: 'Successfully processed payment',
  });
});

app.post('/paystack/callback', async (req, res) => {
  const body = req.body;
  const paystack = createPaymentProvider('paystack');
  const normalized = paystack.normalizeWebhookPayload(body);

  if (!normalized.reference) {
    return res.status(400).json({ message: 'Invalid webhook payload' });
  }

  // ensure the transaction is pending
  const transaction = await TransactionModel.findOne({
    _id: normalized.reference,
    status: 'pending',
  });

  if (!transaction) {
    console.log('Transaction not found');
    return res.status(404).json({
      message: 'Transaction not found',
    });
  }

  console.log('Transaction found', normalized.reference);

  // routing
  if (normalized.succeeded) {
    const result = await fulfillSuccessfulCredit(normalized.reference);
    if (!result.applied) {
      console.log('Duplicate or late success webhook; already finalized');
    }
  }

  if (normalized.failed) {
    await markTransactionFailed(normalized.reference);
  }

  return res.status(200).json({
    message: 'Callback received',
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
