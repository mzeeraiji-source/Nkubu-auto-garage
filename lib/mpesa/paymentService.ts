/**
 * Payment Service
 * Handles payment transactions, verification, and database operations
 */

import { mpesaClient } from './mpesaClient';
import { supabase } from '../supabase';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  phoneNumber: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  mpesaReceiptNumber?: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  resultCode?: number;
  resultDesc?: string;
  createdAt: Date;
  updatedAt: Date;
}

class PaymentService {
  /**
   * Initiate M-Pesa payment
   */
  async initiatePayment(
    invoiceId: string,
    amount: number,
    phoneNumber: string,
    accountReference: string,
    description: string
  ): Promise<{
    success: boolean;
    checkoutRequestId?: string;
    merchantRequestId?: string;
    error?: string;
  }> {
    try {
      // Validate input
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!phoneNumber || phoneNumber.length < 9) {
        throw new Error('Invalid phone number');
      }

      // Create payment record in database
      const callbackUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/mpesa/callback`;

      const stkResponse = await mpesaClient.initiateStkPush(
        phoneNumber,
        amount,
        accountReference,
        description,
        callbackUrl
      );

      // Store payment in database
      const { error: dbError } = await supabase.from('payments').insert({
        invoiceId,
        amount,
        phoneNumber,
        status: 'pending',
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        resultCode: parseInt(stkResponse.ResponseCode),
        resultDesc: stkResponse.ResponseDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return {
        success: true,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
      };
    }
  }

  /**
   * Query payment status
   */
  async queryPaymentStatus(
    checkoutRequestId: string,
    merchantRequestId: string
  ): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const statusResponse = await mpesaClient.querySTKPushStatus(
        checkoutRequestId,
        merchantRequestId
      );

      let status = 'pending';
      if (statusResponse.resultCode === 0) {
        status = 'completed';
      } else if (statusResponse.resultCode === 1 || statusResponse.resultCode === 2) {
        status = 'failed';
      }

      // Update database
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          resultCode: statusResponse.resultCode,
          resultDesc: statusResponse.resultDesc,
          updatedAt: new Date(),
        })
        .eq('checkoutRequestId', checkoutRequestId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error('Payment query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query payment status',
      };
    }
  }

  /**
   * Process M-Pesa callback
   */
  async processCallback(payload: any): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const callbackData = mpesaClient.processCallback(payload);

      if (callbackData.success) {
        // Update payment record with successful details
        const { data, error } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
            resultCode: callbackData.resultCode,
            resultDesc: callbackData.resultDesc,
            updatedAt: new Date(),
          })
          .eq('checkoutRequestId', callbackData.checkoutRequestId)
          .select('id')
          .single();

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Update invoice status to paid
        if (data) {
          const payment = data as Payment;
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paidAt: new Date(),
              paymentMethod: 'mpesa',
            })
            .eq('id', payment.invoiceId);
        }

        return {
          success: true,
          paymentId: data?.id,
        };
      } else {
        // Update payment record with failure details
        const { error } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            resultCode: callbackData.resultCode,
            resultDesc: callbackData.resultDesc,
            updatedAt: new Date(),
          })
          .eq('checkoutRequestId', callbackData.checkoutRequestId);

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        return {
          success: false,
          error: callbackData.resultDesc,
        };
      }
    } catch (error) {
      console.error('Callback processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process callback',
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      return data as Payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  /**
   * Get payments by invoice ID
   */
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoiceId', invoiceId)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return [];
      }

      return (data || []) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(dateFrom: Date, dateTo: Date): Promise<{
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalAmount: number;
    successRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('status, amount')
        .gte('createdAt', dateFrom)
        .lte('createdAt', dateTo);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const payments = (data || []) as Payment[];
      const successful = payments.filter((p) => p.status === 'completed').length;
      const failed = payments.filter((p) => p.status === 'failed').length;
      const totalAmount = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalTransactions: payments.length,
        successfulTransactions: successful,
        failedTransactions: failed,
        totalAmount,
        successRate: payments.length > 0 ? (successful / payments.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0,
        successRate: 0,
      };
    }
  }
}

export const paymentService = new PaymentService();
