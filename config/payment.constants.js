/**
 * Non-secret payment integration constants.
 * Paystack amounts are sent in kobo (1 Naira = 100 kobo).
 */
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_INITIALIZE_PATH = '/transaction/initialize';

const paystackVerifyPath = (reference) =>
  `/transaction/verify/${encodeURIComponent(reference)}`;

const KOBO_MULTIPLIER = 100;

const WEBHOOK_EVENTS = {
  CHARGE_SUCCESS: 'charge.success',
  CHARGE_FAILED: 'charge.failed',
};

module.exports = {
  PAYSTACK_BASE_URL,
  PAYSTACK_INITIALIZE_PATH,
  paystackVerifyPath,
  KOBO_MULTIPLIER,
  WEBHOOK_EVENTS,
};
