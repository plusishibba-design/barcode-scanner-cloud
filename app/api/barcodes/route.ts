import { NextRequest, NextResponse } from 'next/server';
import { addBarcode, getAllBarcodes, createBarcodesTable } from '@/lib/db';

// Initialize database table
createBarcodesTable().catch(console.error);

export async function GET() {
  try {
    const barcodes = await getAllBarcodes();
    return NextResponse.json({ success: true, barcodes });
  } catch (error) {
    console.error('GET /api/barcodes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch barcodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, timestamp } = body;

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Barcode is required' },
        { status: 400 }
      );
    }

    const result = await addBarcode(barcode, timestamp);

    return NextResponse.json({
      success: true,
      message: 'Barcode saved successfully',
      data: result,
    });
  } catch (error) {
    console.error('POST /api/barcodes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save barcode' },
      { status: 500 }
    );
  }
}
