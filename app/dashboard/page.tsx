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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
          <p>スキャンしたバーコードを表示</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">スキャン履歴</h2>
            <button
              onClick={loadBarcodes}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              更新
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 border border-red-300 p-4 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white">
              <div className="text-4xl font-bold">{barcodes.length}</div>
              <div className="text-sm mt-2 opacity-90">総スキャン数</div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white">
              <div className="text-4xl font-bold">{todayCount}</div>
              <div className="text-sm mt-2 opacity-90">今日のスキャン</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white">
              <div className="text-4xl font-bold">{barcodes.length > 0 ? barcodes[0].barcode : '-'}</div>
              <div className="text-sm mt-2 opacity-90">最新のバーコード</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : barcodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">まだデータがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">バーコード</th>
                    <th className="text-left p-3 font-semibold text-gray-700">スキャン日時</th>
                  </tr>
                </thead>
                <tbody>
                  {barcodes.slice(0, 100).map((barcode) => (
                    <tr key={barcode.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-800">{barcode.barcode}</td>
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
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              スキャナーへ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
