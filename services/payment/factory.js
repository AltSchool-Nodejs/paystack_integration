const { PaystackProvider } = require('./paystack.provider');
const { StripeProvider } = require('./stripe.provider');

/**
 * @param {string} [providerName] explicit provider (e.g. from Transaction.provider); defaults to env
 */
function createPaymentProvider(providerName) {
  const name = (
    providerName ||
    process.env.PAYMENT_PROVIDER ||
    'paystack'
  ).toLowerCase();

  if (name === 'stripe') {
    return new StripeProvider();
  }

  return new PaystackProvider();
}

module.exports = { createPaymentProvider };
