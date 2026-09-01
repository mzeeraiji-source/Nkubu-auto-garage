import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/mpesa/paymentService';

/**
 * POST /api/mpesa/callback
 * Handles M-Pesa callback notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process the callback
    const result = await paymentService.processCallback(body);

    if (result.success) {
      return NextResponse.json(
        { 
          status: 'success',
          message: 'Payment processed successfully',
          paymentId: result.paymentId
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          status: 'failed',
          error: result.error
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
