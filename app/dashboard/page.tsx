'use client';

import { useState, useEffect } from 'react';

interface Barcode {
  id: number;
  barcode: string;
  timestamp: string;
  scanned_at: string;
  created_at: string;
}

export default function DashboardPage() {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBarcodes();
  }, []);

  const loadBarcodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/barcodes');
      const data = await response.json();

      if (data.success) {
        setBarcodes(data.barcodes);
        setError('');
      } else {
        setError('データの読み込みに失敗しました');
      }
    } catch (err) {
      console.error('Load barcodes error:', err);
      setError('サーバーに接続できません');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const todayCount = barcodes.filter((b) => {
    const today = new Date().toDateString();
    const barcodeDate = new Date(b.created_at).toDateString();
    return today === barcodeDate;
  }).length;

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-black">Dashboard</h1>
          <p className="text-gray-600">View scanned products</p>
        </div>

        <div className="bg-white border-2 border-black p-6 mb-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Scan History</h2>
            <button
              onClick={loadBarcodes}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 border-2 border-black transition-all"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-black text-white border-2 border-black p-4 mb-4 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-2 border-black p-6">
              <div className="text-4xl font-bold text-black">{barcodes.length}</div>
              <div className="text-sm mt-2 text-gray-600">Total Scans</div>
            </div>
            <div className="bg-black text-white border-2 border-black p-6">
              <div className="text-4xl font-bold">{todayCount}</div>
              <div className="text-sm mt-2">Today's Scans</div>
            </div>
            <div className="bg-white border-2 border-black p-6">
              <div className="text-2xl font-bold text-black font-mono">{barcodes.length > 0 ? barcodes[0].barcode : '-'}</div>
              <div className="text-sm mt-2 text-gray-600">Latest Scan</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : barcodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No data yet</div>
          ) : (
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-black text-white">
                    <th className="text-left p-3 font-semibold">Product Number</th>
                    <th className="text-left p-3 font-semibold">Product Name</th>
                    <th className="text-left p-3 font-semibold">Scan Time</th>
                  </tr>
                </thead>
                <tbody>
                  {barcodes.slice(0, 100).map((barcode) => (
                    <tr key={barcode.id} className="border-b border-gray-300 hover:bg-gray-100">
                      <td className="p-3 font-mono font-bold text-black">{barcode.barcode}</td>
                      <td className="p-3 text-black">
                        {(barcode as any).product_description || (
                          <span className="text-gray-400 italic">No product info</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 text-sm">{formatDate(barcode.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => (window.location.href = '/scanner')}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 border-2 border-black transition-all"
            >
              Back to Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
