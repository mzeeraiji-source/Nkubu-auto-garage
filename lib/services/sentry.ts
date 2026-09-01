/**
 * Sentry Error Tracking
 * Captures and reports errors and exceptions
 */

import * as Sentry from '@sentry/nextjs';

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
};

/**
 * Capture exception
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

/**
 * Capture message
 */
export const captureMessage = (message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context
 */
export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

/**
 * Set custom context
 */
export const setCustomContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * Set breadcrumb
 */
export const addBreadcrumb = (message: string, category: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
};