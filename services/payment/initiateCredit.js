const TransactionModel = require('../../models/transaction');
const WalletModel = require('../../models/wallet');
const { createPaymentProvider } = require('./factory');

async function findOrCreateWalletByEmail(email) {
  let wallet = await WalletModel.findOne({ email });
  if (!wallet) {
    wallet = await WalletModel.create({
      balance: 0,
      email,
    });
  }
  return wallet;
}

/**
 * Creates a pending credit transaction and initializes payment with the active provider.
 * @param {{ amount: number, email: string }} params amount in major units (Naira)
 */
async function initiateCreditPayment({ amount, email }) {
  const providerName = (process.env.PAYMENT_PROVIDER || 'paystack').toLowerCase();
  const provider = createPaymentProvider(providerName);

  const wallet = await findOrCreateWalletByEmail(email);

  const transaction = await TransactionModel.create({
    amount,
    status: 'pending',
    type: 'credit',
    walletId: wallet._id,
    provider: providerName,
  });

  const init = await provider.initializeTransaction({
    amountMajor: amount,
    email,
    reference: transaction._id,
  });

  return { transaction, init, paystackResponse: init.raw };
}

module.exports = {
  findOrCreateWalletByEmail,
  initiateCreditPayment,
};
