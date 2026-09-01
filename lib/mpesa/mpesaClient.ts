/**
 * M-Pesa API Client
 * Handles all M-Pesa payment processing and verification
 */

interface MpesaAuthResponse {
  access_token: string;
  expires_in: number;
}

interface MpesaSTKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

class MpesaClient {
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private environment: string;
  private baseUrl: string;
  private authUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';

    if (this.environment === 'production') {
      this.baseUrl = 'https://api.safaricom.co.ke';
      this.authUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    } else {
      this.baseUrl = 'https://sandbox.safaricom.co.ke';
      this.authUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    }
  }

  /**
   * Get M-Pesa access token
   */
  async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      const response = await fetch(this.authUrl, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = (await response.json()) as MpesaAuthResponse;
      return data.access_token;
    } catch (error) {
      console.error('M-Pesa Authentication Error:', error);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async initiateStkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string,
    callbackUrl: string
  ): Promise<MpesaSTKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload: MpesaSTKPushRequest = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: this.formatPhoneNumber(phoneNumber),
        PartyB: this.shortcode,
        PhoneNumber: this.formatPhoneNumber(phoneNumber),
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`STK Push failed: ${response.statusText}`);
      }

      const data = (await response.json()) as MpesaSTKPushResponse;
      return data;
    } catch (error) {
      console.error('M-Pesa STK Push Error:', error);
      throw error;
    }
  }

  /**
   * Query STK Push Status
   */
  async querySTKPushStatus(
    checkoutRequestId: string,
    merchantRequestId: string
  ): Promise<{ resultCode: number; resultDesc: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc,
      };
    } catch (error) {
      console.error('M-Pesa Query Error:', error);
      throw error;
    }
  }

  /**
   * Process callback payload and extract payment details
   */
  processCallback(payload: MpesaCallbackPayload): {
    success: boolean;
    mpesaReceiptNumber?: string;
    transactionAmount?: number;
    phoneNumber?: string;
    checkoutRequestId: string;
    merchantRequestId: string;
    resultCode: number;
    resultDesc: string;
  } {
    const callback = payload.Body.stkCallback;

    const result = {
      success: callback.ResultCode === 0,
      checkoutRequestId: callback.CheckoutRequestID,
      merchantRequestId: callback.MerchantRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
    };

    if (callback.ResultCode === 0 && callback.CallbackMetadata?.Item) {
      const items = callback.CallbackMetadata.Item;
      const itemMap = new Map(items.map((item) => [item.Name, item.Value]));

      return {
        ...result,
        mpesaReceiptNumber: String(itemMap.get('MpesaReceiptNumber')),
        transactionAmount: Number(itemMap.get('Amount')),
        phoneNumber: String(itemMap.get('PhoneNumber')),
      };
    }

    return result;
  }

  /**
   * Generate Base64 encoded password for M-Pesa
   */
  private generatePassword(timestamp: string): string {
    const data = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Generate timestamp in required format (YYYYMMDDHHmmss)
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Format phone number to 254xxxxxxxxx format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }
}

export const mpesaClient = new MpesaClient();
