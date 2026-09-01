# Third-Party Integrations Guide

This document outlines all the third-party services integrated into Nkubu Auto Garage.

## Payment & Financial

### M-Pesa (M-Pesa Integration)
- **Purpose**: Accept mobile payments from customers
- **Files**: `lib/mpesa/mpesaClient.ts`, `lib/mpesa/paymentService.ts`
- **API Routes**: `/api/mpesa/initiate`, `/api/mpesa/callback`, `/api/mpesa/query`
- **Features**:
  - STK Push for payment initiation
  - Payment status queries
  - Callback handling
  - Transaction history

## Communication

### Firebase Cloud Messaging
- **Purpose**: Send push notifications to mobile app users
- **File**: `lib/services/firebaseService.ts`
- **Features**:
  - Service status updates
  - Appointment reminders
  - Payment notifications
  - Device token management

### Twilio
- **Purpose**: SMS and WhatsApp notifications
- **File**: `lib/services/twilioService.ts`
- **Features**:
  - SMS notifications
  - WhatsApp messages
  - Service updates
  - Payment reminders
  - Appointment confirmations

### Mailgun
- **Purpose**: Email notifications and invoicing
- **File**: `lib/services/mailgunService.ts`
- **Features**:
  - Invoice emails
  - Receipt emails
  - Service completion notifications
  - Welcome emails

### Crisp Chat
- **Purpose**: Live customer support chat
- **File**: `lib/services/crispChat.ts`
- **Features**:
  - Live chat widget
  - Customer support tickets
  - Chat history

## Analytics & Monitoring

### PostHog
- **Purpose**: Product analytics and user behavior tracking
- **File**: `lib/services/posthogService.ts`
- **Features**:
  - Event tracking
  - User properties
  - Page view tracking
  - Feature usage tracking
  - Conversion tracking

### Sentry
- **Purpose**: Error tracking and exception reporting
- **File**: `lib/services/sentry.ts`
- **Features**:
  - Exception capture
  - Error reporting
  - User context
  - Breadcrumb tracking
  - Performance monitoring

## Media Management

### Cloudinary
- **Purpose**: Image hosting and optimization
- **File**: `lib/services/cloudinaryService.ts`
- **Features**:
  - Vehicle image uploads
  - Image optimization
  - CDN delivery
  - Image deletion

## Location Services

### Google Maps
- **Purpose**: Location services and distance calculation
- **File**: `lib/services/googleMapsService.ts`
- **Features**:
  - Garage location finder
  - Distance calculation
  - Route planning
  - Customer proximity

## Security

### Snyk
- **Purpose**: Dependency vulnerability scanning
- **File**: `lib/services/snykService.ts`
- **Features**:
  - Vulnerability detection
  - Dependency scanning
  - Security reports

## Environment Variables

All required environment variables are listed in `.env.example`. Copy this file to `.env.local` and fill in your credentials.

## Setup Instructions

### 1. M-Pesa
1. Register at Safaricom Developer Portal
2. Get Consumer Key, Consumer Secret, and Passkey
3. Add credentials to `.env.local`

### 2. Firebase
1. Create Firebase project
2. Generate service account key
3. Add credentials to `.env.local`

### 3. Twilio
1. Create Twilio account
2. Get Account SID, Auth Token, and phone numbers
3. Add credentials to `.env.local`

### 4. Mailgun
1. Create Mailgun account
2. Get API Key and Domain
3. Add credentials to `.env.local`

### 5. PostHog
1. Create PostHog account
2. Get API Key and Host URL
3. Add credentials to `.env.local`

### 6. Sentry
1. Create Sentry account
2. Create project and get DSN
3. Add credentials to `.env.local`

### 7. Crisp
1. Create Crisp account
2. Get Website ID
3. Add credentials to `.env.local`

### 8. Cloudinary
1. Create Cloudinary account
2. Get Cloud Name, API Key, and API Secret
3. Add credentials to `.env.local`

### 9. Google Maps
1. Create Google Cloud project
2. Enable Maps APIs
3. Get API Key
4. Add credentials to `.env.local`

## Usage Examples

### Initiating Payment
```typescript
import { paymentService } from '@/lib/mpesa/paymentService';

const result = await paymentService.initiatePayment(
  'INV-001',
  5000,
  '+254712345678',
  'Garage Service',
  'Oil change and inspection'
);
```

### Sending SMS
```typescript
import { twilioService } from '@/lib/services/twilioService';

await twilioService.sendSMS(
  '+254712345678',
  'Your service is ready for pickup!'
);
```

### Sending Email
```typescript
import { mailgunService } from '@/lib/services/mailgunService';

await mailgunService.sendInvoice(
  'customer@example.com',
  'John Doe',
  'INV-001',
  5000,
  '2024-12-31',
  [{description: 'Oil Change', quantity: 1, price: 2000}]
);
```

### Tracking Events
```typescript
import PostHogService from '@/lib/services/posthogService';

PostHogService.trackServiceBooking('SVC-001', 'Oil Change', 2000);
```

### Capturing Errors
```typescript
import { captureException } from '@/lib/services/sentry';

try {
  // code
} catch (error) {
  captureException(error as Error, { context: 'payment' });
}
```

## Support

For issues with any integration, refer to the official documentation of each service.