/**
 * Firebase Service
 * Handles push notifications, cloud messaging, and real-time database operations
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
  console.warn('Firebase credentials not fully configured');
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  deviceToken: string;
}

class FirebaseService {
  /**
   * Send push notification to device
   */
  async sendPushNotification(notification: PushNotification): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        token: notification.deviceToken,
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('Push notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send push notification',
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(
    deviceTokens: string[],
    notification: Omit<PushNotification, 'deviceToken'>
  ): Promise<{
    success: boolean;
    successCount?: number;
    failureCount?: number;
    error?: string;
  }> {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      };

      const response = await admin.messaging().sendMulticast({
        ...message,
        tokens: deviceTokens,
      });

      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Multicast notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send multicast notification',
      };
    }
  }

  /**
   * Send service status notification
   */
  async sendServiceStatusNotification(
    deviceToken: string,
    serviceName: string,
    status: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    return this.sendPushNotification({
      title: 'Service Status Update',
      body: `Your ${serviceName} is now ${status}`,
      data: {
        type: 'service_status',
        serviceName,
        status,
      },
      deviceToken,
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    deviceToken: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    return this.sendPushNotification({
      title: 'Appointment Reminder',
      body: `Your ${serviceName} appointment is on ${appointmentDate} at ${appointmentTime}`,
      data: {
        type: 'appointment_reminder',
        appointmentDate,
        appointmentTime,
        serviceName,
      },
      deviceToken,
    });
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(
    deviceToken: string,
    amount: number,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const statusMessages = {
      pending: `Payment of KES ${amount} is pending`,
      completed: `Payment of KES ${amount} has been received`,
      failed: `Payment of KES ${amount} failed. Please try again.`,
    };

    return this.sendPushNotification({
      title: 'Payment Update',
      body: statusMessages[status],
      data: {
        type: 'payment',
        amount: amount.toString(),
        status,
      },
      deviceToken,
    });
  }

  /**
   * Store user device token
   */
  async storeDeviceToken(userId: string, deviceToken: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userId).update({
        deviceTokens: admin.firestore.FieldValue.arrayUnion(deviceToken),
        lastUpdated: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Device token storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store device token',
      };
    }
  }

  /**
   * Get user device tokens
   */
  async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      const db = admin.firestore();
      const doc = await db.collection('users').doc(userId).get();

      if (doc.exists) {
        return (doc.data()?.deviceTokens as string[]) || [];
      }

      return [];
    } catch (error) {
      console.error('Get device tokens error:', error);
      return [];
    }
  }

  /**
   * Remove device token
   */
  async removeDeviceToken(userId: string, deviceToken: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userId).update({
        deviceTokens: admin.firestore.FieldValue.arrayRemove(deviceToken),
      });

      return { success: true };
    } catch (error) {
      console.error('Remove device token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove device token',
      };
    }
  }
}

export const firebaseService = new FirebaseService();
