import { NextRequest, NextResponse } from 'next/server';
import { createProductsTable, bulkInsertProducts } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // テーブル作成
    await createProductsTable();

    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid products data' },
        { status: 400 }
      );
    }

    // 製品データを一括挿入
    const result = await bulkInsertProducts(products);

    return NextResponse.json({
      success: true,
      message: `${result.count} products imported successfully`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Import products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import products',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
