import { Pool } from 'pg';

export interface Barcode {
  id: number;
  barcode: string;
  timestamp: string;
  scanned_at: Date;
  created_at: Date;
  product_description?: string;
}

export interface Product {
  part_num: string;
  part_description: string;
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
        product_description TEXT,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add product_description column if it doesn't exist (for existing tables)
    try {
      await client.query(`
        ALTER TABLE barcodes
        ADD COLUMN IF NOT EXISTS product_description TEXT
      `);
    } catch (alterError) {
      // Column might already exist, ignore error
      console.log('product_description column already exists or could not be added');
    }

    console.log('Barcodes table created successfully');
  } catch (error) {
    console.error('Error creating barcodes table:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function createProductsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        part_num VARCHAR(255) PRIMARY KEY,
        part_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Products table created successfully');
  } catch (error) {
    console.error('Error creating products table:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getProduct(partNum: string): Promise<Product | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM products WHERE part_num = $1',
      [partNum]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addBarcode(barcode: string, timestamp?: string, productDescription?: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO barcodes (barcode, timestamp, product_description) VALUES ($1, $2, $3) RETURNING *',
      [barcode, timestamp || new Date().toISOString(), productDescription]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding barcode:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addProduct(partNum: string, partDescription: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO products (part_num, part_description) VALUES ($1, $2) ON CONFLICT (part_num) DO UPDATE SET part_description = $2 RETURNING *',
      [partNum, partDescription]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function bulkInsertProducts(products: { partNum: string; partDescription: string }[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const product of products) {
      await client.query(
        'INSERT INTO products (part_num, part_description) VALUES ($1, $2) ON CONFLICT (part_num) DO UPDATE SET part_description = $2',
        [product.partNum, product.partDescription]
      );
    }

    await client.query('COMMIT');
    return { success: true, count: products.length };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk inserting products:', error);
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
