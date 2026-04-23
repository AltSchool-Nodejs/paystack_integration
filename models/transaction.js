const shortid = require('shortid');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  created_at: { type: Date, default: new Date() },
  amount: { type: Number, required: 0 },
  type: { type: String, required: true, enum: ['credit', 'debit'] },
  walletId: { type: String, required: true, ref: 'wallets' },
  status: { type: String, required: true, enum: ['pending', 'success', 'failed'], default: 'pending' },
  provider: { type: String, default: 'paystack' },
  lastReconciledAt: { type: Date },
  reconcileAttempts: { type: Number, default: 0 },
});

const TransactionModel = mongoose.model('transaction', TransactionSchema);

module.exports = TransactionModel;