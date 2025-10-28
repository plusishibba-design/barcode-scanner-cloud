import { NextRequest, NextResponse } from 'next/server';
import { createProductsTable, bulkInsertProductsWithStats } from '@/lib/db';

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

    console.log(`Starting import of ${products.length} products...`);

    // 製品データを一括挿入（統計情報付き）
    const result = await bulkInsertProductsWithStats(products);

    const message = `Import complete: ${result.inserted} new, ${result.updated} updated, ${result.skipped} skipped (Total: ${result.total})`;
    console.log(message);

    return NextResponse.json({
      success: true,
      message,
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
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
