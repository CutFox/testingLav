import axios from 'axios';
import crypto from 'crypto';

export async function test(params) {
  console.log('test', )
}

export class LavaPayment {
  static BASE_URL = 'https://api.lava.ru';
  
  constructor(shopId, secretKey) {
    this.shopId = shopId;
    this.secretKey = secretKey;
    // this.customFields= { 
    //       "telegramId": "userId",
    //       "product": "premium_subscription"
    //     },
    this.api = axios.create({
      baseURL: LavaPayment.BASE_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  #createSignature(data) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  async #request(endpoint, data = {}) {
    try {
      const body = { shopId: this.shopId, ...data };
      const response = await this.api.post(endpoint, body, {
        headers: {
          Signature: this.#createSignature(body)
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Lava API error [${endpoint}]:`, error.response?.data || error.message);
      throw this.#normalizeError(error);
    }
  }

  #normalizeError(error) {
    const lavaError = error.response?.data?.error_type;
    const errorMessages = {
      'invalid_signature': 'Invalid API signature',
      'insufficient_funds': 'Insufficient funds',
      'invoice_not_created': 'Invoice creation failed'
    };
    
    return new Error(errorMessages[lavaError] || 'Payment processing error');
  }

  // Payment methods
  createInvoice(data) {
    return this.#request('business/invoice/create', data);
  }

  getInvoiceStatus(invoiceId) {
    return this.#request('business/invoice/status', { invoiceId });
  }

  getAvailableTariffs() {
    return this.#request('business/invoice/get-available-tariffs');
  }

  // Payoff methods
  createPayoff(data) {
    return this.#request('business/payoff/create', data);
  }

  getPayoffInfo(orderId) {
    return this.#request('business/payoff/info', { orderId });
  }

  getPayoffTariffs() {
    return this.#request('business/payoff/get-tariffs');
  }

  // Shop methods
  getBalance() {
    return this.#request('business/shop/get-balance');
  }
}