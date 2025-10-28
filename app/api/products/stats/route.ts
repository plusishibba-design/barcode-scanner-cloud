import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // 製品マスターの総件数を取得
      const result = await client.query('SELECT COUNT(*) as total FROM products');
      const total = parseInt(result.rows[0].total);

      return NextResponse.json({
        success: true,
        total,
        message: `${total} products in database`,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Get product stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get product stats',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
