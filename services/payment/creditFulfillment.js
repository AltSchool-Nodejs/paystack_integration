const TransactionModel = require('../../models/transaction');
const WalletModel = require('../../models/wallet');

/**
 * Idempotent: only one caller transitions pending → success and credits the wallet.
 * @param {string} reference transaction _id
 */
async function fulfillSuccessfulCredit(reference) {
  const updated = await TransactionModel.findOneAndUpdate(
    { _id: reference, status: 'pending' },
    { $set: { status: 'success' } },
    { new: true }
  );

  if (!updated) {
    return { applied: false };
  }

  const wallet = await WalletModel.findById(updated.walletId);
  if (!wallet) {
    throw new Error(`Wallet not found for transaction ${reference}`);
  }

  wallet.balance += updated.amount;
  await wallet.save();

  return { applied: true, transaction: updated };
}

/**
 * @param {string} reference transaction _id
 */
async function markTransactionFailed(reference) {
  await TransactionModel.findOneAndUpdate(
    { _id: reference, status: 'pending' },
    { $set: { status: 'failed' } }
  );
}

module.exports = {
  fulfillSuccessfulCredit,
  markTransactionFailed,
};
