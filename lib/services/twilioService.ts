/**
 * Twilio Service
 * Handles SMS and WhatsApp notifications
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured');
}

const client = twilio(accountSid, authToken);

export interface NotificationPayload {
  to: string;
  message: string;
  type?: 'sms' | 'whatsapp';
}

class TwilioService {
  /**
   * Send SMS notification
   */
  async sendSMS(phoneNumber: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!twilioPhoneNumber) {
        throw new Error('Twilio phone number not configured');
      }

      const msg = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: msg.sid,
      };
    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(phoneNumber: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!twilioWhatsAppNumber) {
        throw new Error('Twilio WhatsApp number not configured');
      }

      const msg = await client.messages.create({
        body: message,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${phoneNumber}`,
      });

      return {
        success: true,
        messageId: msg.sid,
      };
    } catch (error) {
      console.error('WhatsApp Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Send service status update
   */
  async sendServiceUpdate(
    phoneNumber: string,
    serviceName: string,
    status: string,
    type: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const message = `Service Update: Your ${serviceName} is now ${status}. Thank you for choosing Nkubu Auto Garage!`;
    
    if (type === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    phoneNumber: string,
    amount: number,
    dueDate: string,
    type: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const message = `Payment Reminder: KES ${amount} is due on ${dueDate}. Pay now at Nkubu Auto Garage.`;
    
    if (type === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(
    phoneNumber: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string,
    type: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const message = `Appointment Confirmed: ${serviceName} on ${appointmentDate} at ${appointmentTime}. See you soon!`;
    
    if (type === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }
}

export const twilioService = new TwilioService();
