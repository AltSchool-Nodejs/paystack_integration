/**
 * Teaching stub: swap for Stripe Checkout Session / PaymentIntent flow when ready.
 * See https://stripe.com/docs/api/checkout/sessions and PaymentIntents.
 */
class StripeProvider {
  async initializeTransaction() {
    throw new Error(
      'StripeProvider.initializeTransaction is a teaching stub — implement Checkout Session or PaymentIntent.'
    );
  }

  async verifyTransaction() {
    throw new Error(
      'StripeProvider.verifyTransaction is a teaching stub — implement e.g. payment_intents.retrieve.'
    );
  }

  normalizeWebhookPayload() {
    return {
      reference: undefined,
      event: undefined,
      succeeded: false,
      failed: false,
    };
  }
}

module.exports = { StripeProvider };
