/**
 * PostHog Analytics Service
 * Tracks user behavior and product analytics
 */

import { posthog } from 'posthog-js';

class PostHogService {
  /**
   * Initialize PostHog
   */
  static initialize() {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        enabled: process.env.NODE_ENV === 'production',
      });
    }
  }

  /**
   * Track custom event
   */
  static trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties);
    }
  }

  /**
   * Set user properties
   */
  static setUserProperties(userId: string, properties: Record<string, any>) {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties);
    }
  }

  /**
   * Track page view
   */
  static trackPageView(pageName: string) {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_name: pageName,
      });
    }
  }

  /**
   * Track service booking
   */
  static trackServiceBooking(serviceId: string, serviceName: string, amount: number) {
    this.trackEvent('service_booked', {
      service_id: serviceId,
      service_name: serviceName,
      amount,
    });
  }

  /**
   * Track payment
   */
  static trackPayment(paymentId: string, amount: number, method: string) {
    this.trackEvent('payment_initiated', {
      payment_id: paymentId,
      amount,
      method,
    });
  }

  /**
   * Track user signup
   */
  static trackSignup(userId: string, email: string) {
    this.trackEvent('user_signup', {
      user_id: userId,
      email,
    });
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(featureName: string, duration?: number) {
    this.trackEvent('feature_used', {
      feature_name: featureName,
      duration_ms: duration,
    });
  }

  /**
   * Reset analytics
   */
  static reset() {
    if (typeof window !== 'undefined') {
      posthog.reset();
    }
  }
}

export default PostHogService;