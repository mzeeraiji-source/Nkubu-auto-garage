/**
 * Mailgun Service
 * Handles email notifications and invoicing
 */

import mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@nkubu-garage.com';

if (!mailgunApiKey || !mailgunDomain) {
  console.warn('Mailgun credentials not configured');
}

const mg = mailgun(FormData).client({
  username: 'api',
  key: mailgunApiKey || '',
});

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
}

class MailgunService {
  /**
   * Send email
   */
  async sendEmail(payload: EmailPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!mailgunDomain) {
        throw new Error('Mailgun domain not configured');
      }

      const messageData = {
        from: mailgunFromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        ...(payload.cc && { cc: payload.cc }),
        ...(payload.bcc && { bcc: payload.bcc }),
      };

      const response = await mg.messages.create(mailgunDomain, messageData);

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      console.error('Email Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoice(
    customerEmail: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    items: Array<{ description: string; quantity: number; price: number }>
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>KES ${item.price.toFixed(2)}</td>
        <td>KES ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <h2>Invoice ${invoiceNumber}</h2>
      <p>Dear ${customerName},</p>
      <p>Please find your invoice details below:</p>
      <table border="1" cellpadding="10">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <h3>Total Amount: KES ${amount.toFixed(2)}</h3>
      <p>Due Date: ${dueDate}</p>
      <p>Please pay via M-Pesa or bank transfer.</p>
      <p>Thank you for your business!</p>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} from Nkubu Auto Garage`,
      html,
    });
  }

  /**
   * Send receipt email
   */
  async sendReceipt(
    customerEmail: string,
    customerName: string,
    receiptNumber: string,
    amount: number,
    paymentMethod: string,
    items: Array<{ description: string; price: number }>
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td>${item.description}</td>
        <td>KES ${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <h2>Payment Receipt</h2>
      <p>Dear ${customerName},</p>
      <p>Thank you for your payment. Here is your receipt:</p>
      <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
      <table border="1" cellpadding="10">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <h3>Total Paid: KES ${amount.toFixed(2)}</h3>
      <p>Payment Method: ${paymentMethod}</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      <p>Thank you for choosing Nkubu Auto Garage!</p>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Receipt ${receiptNumber} from Nkubu Auto Garage`,
      html,
    });
  }

  /**
   * Send service completion email
   */
  async sendServiceCompletion(
    customerEmail: string,
    customerName: string,
    serviceName: string,
    totalCost: number
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const html = `
      <h2>Service Completed</h2>
      <p>Dear ${customerName},</p>
      <p>Your ${serviceName} has been successfully completed!</p>
      <p><strong>Total Cost:</strong> KES ${totalCost.toFixed(2)}</p>
      <p>Your vehicle is ready for pickup. Thank you for choosing Nkubu Auto Garage!</p>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `${serviceName} Completed - Nkubu Auto Garage`,
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(customerEmail: string, customerName: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const html = `
      <h2>Welcome to Nkubu Auto Garage!</h2>
      <p>Dear ${customerName},</p>
      <p>Welcome to our automotive service center. We're excited to have you as a customer.</p>
      <p>With our modern facilities and expert technicians, we're committed to providing you with the best service.</p>
      <p>Feel free to reach out if you have any questions or need to schedule a service.</p>
      <p>Best regards,<br>Nkubu Auto Garage Team</p>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: 'Welcome to Nkubu Auto Garage',
      html,
    });
  }
}

export const mailgunService = new MailgunService();
