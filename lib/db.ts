import { sql } from '@vercel/postgres';

export interface Barcode {
  id: number;
  barcode: string;
  timestamp: string;
  scanned_at: Date;
  created_at: Date;
}

export async function createBarcodesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS barcodes (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(255) NOT NULL,
        timestamp VARCHAR(50),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Barcodes table created successfully');
  } catch (error) {
    console.error('Error creating barcodes table:', error);
    throw error;
  }
}

export async function addBarcode(barcode: string, timestamp?: string) {
  try {
    const result = await sql`
      INSERT INTO barcodes (barcode, timestamp)
      VALUES (${barcode}, ${timestamp || new Date().toISOString()})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error adding barcode:', error);
    throw error;
  }
}

export async function getAllBarcodes() {
  try {
    const result = await sql`
      SELECT * FROM barcodes
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting barcodes:', error);
    throw error;
  }
}

export async function getBarcodeStats() {
  try {
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM barcodes
    `;

    const todayResult = await sql`
      SELECT COUNT(*) as today FROM barcodes
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    return {
      total: parseInt(totalResult.rows[0].total),
      today: parseInt(todayResult.rows[0].today),
    };
  } catch (error) {
    console.error('Error getting barcode stats:', error);
    throw error;
  }
}
