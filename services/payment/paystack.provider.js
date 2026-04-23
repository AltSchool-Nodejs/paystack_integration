const axios = require('axios');
const {
  PAYSTACK_BASE_URL,
  PAYSTACK_INITIALIZE_PATH,
  paystackVerifyPath,
  KOBO_MULTIPLIER,
  WEBHOOK_EVENTS,
} = require('../../config/payment.constants');

class PaystackProvider {
  constructor() {
    this._authHeader = {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    };
  }

  /**
   * @param {{ amountMajor: number, email: string, reference: string }} params
   */
  async initializeTransaction({ amountMajor, email, reference }) {
    const url = `${PAYSTACK_BASE_URL}${PAYSTACK_INITIALIZE_PATH}`;
    const { data } = await axios.post(
      url,
      {
        amount: amountMajor * KOBO_MULTIPLIER,
        email,
        reference,
      },
      { headers: this._authHeader }
    );
    return {
      authorizationUrl: data.data.authorization_url,
      raw: data,
    };
  }

  /**
   * @param {string} reference
   * @returns {Promise<{ raw: object, paystackStatus: string | undefined }>}
   */
  async verifyTransaction(reference) {
    const url = `${PAYSTACK_BASE_URL}${paystackVerifyPath(reference)}`;
    const { data } = await axios.get(url, { headers: this._authHeader });
    return {
      raw: data,
      paystackStatus: data?.data?.status,
    };
  }

  /**
   * @param {object} body Paystack webhook JSON body
   */
  normalizeWebhookPayload(body) {
    const reference = body?.data?.reference;
    const event = body?.event;
    return {
      reference,
      event,
      succeeded: event === WEBHOOK_EVENTS.CHARGE_SUCCESS,
      failed: event === WEBHOOK_EVENTS.CHARGE_FAILED,
    };
  }
}

module.exports = { PaystackProvider };
