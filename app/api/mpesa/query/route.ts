import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/mpesa/paymentService';

/**
 * POST /api/mpesa/query
 * Query payment status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkoutRequestId, merchantRequestId } = body;

    if (!checkoutRequestId || !merchantRequestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await paymentService.queryPaymentStatus(
      checkoutRequestId,
      merchantRequestId
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
    console.error('Query Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
