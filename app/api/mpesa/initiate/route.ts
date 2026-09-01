import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/mpesa/paymentService';

/**
 * POST /api/mpesa/initiate
 * Initiates M-Pesa STK push for payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, amount, phoneNumber, accountReference, description } = body;

    // Validate required fields
    if (!invoiceId || !amount || !phoneNumber || !accountReference || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await paymentService.initiatePayment(
      invoiceId,
      amount,
      phoneNumber,
      accountReference,
      description
    );

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
