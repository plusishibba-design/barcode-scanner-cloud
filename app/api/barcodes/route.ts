import { NextRequest, NextResponse } from 'next/server';
import { addBarcode, getAllBarcodes, createBarcodesTable, getProduct } from '@/lib/db';

export async function GET() {
  try {
    // Ensure table exists before querying
    await createBarcodesTable();

    const barcodes = await getAllBarcodes();
    return NextResponse.json({ success: true, barcodes });
  } catch (error: any) {
    console.error('GET /api/barcodes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch barcodes',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure table exists before inserting
    await createBarcodesTable();

    const body = await request.json();
    const { barcode, timestamp } = body;

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Barcode is required' },
        { status: 400 }
      );
    }

    // 製品マスターから製品情報を取得
    let productDescription: string | undefined;
    try {
      const product = await getProduct(barcode);
      if (product) {
        productDescription = product.part_description;
      }
    } catch (error) {
      console.log('Product not found in master data:', barcode);
    }

    const result = await addBarcode(barcode, timestamp, productDescription);

    return NextResponse.json({
      success: true,
      message: 'Barcode saved successfully',
      data: result,
      productDescription,
    });
  } catch (error: any) {
    console.error('POST /api/barcodes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save barcode',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
