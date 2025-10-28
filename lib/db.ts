import { Pool } from 'pg';

export interface Barcode {
  id: number;
  barcode: string;
  timestamp: string;
  scanned_at: Date;
  created_at: Date;
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function createBarcodesTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS barcodes (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(255) NOT NULL,
        timestamp VARCHAR(50),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Barcodes table created successfully');
  } catch (error) {
    console.error('Error creating barcodes table:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addBarcode(barcode: string, timestamp?: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO barcodes (barcode, timestamp) VALUES ($1, $2) RETURNING *',
      [barcode, timestamp || new Date().toISOString()]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding barcode:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllBarcodes() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM barcodes ORDER BY created_at DESC LIMIT 1000'
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting barcodes:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getBarcodeStats() {
  const client = await pool.connect();
  try {
    const totalResult = await client.query('SELECT COUNT(*) as total FROM barcodes');
    const todayResult = await client.query(
      "SELECT COUNT(*) as today FROM barcodes WHERE DATE(created_at) = CURRENT_DATE"
    );

    return {
      total: parseInt(totalResult.rows[0].total),
      today: parseInt(todayResult.rows[0].today),
    };
  } catch (error) {
    console.error('Error getting barcode stats:', error);
    throw error;
  } finally {
    client.release();
  }
}
