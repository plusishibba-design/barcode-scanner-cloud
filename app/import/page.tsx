'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('❌ ファイルを選択してください');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('⏳ CSVを読み込み中...');
    setMessageType('info');

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const products = [];

      // ヘッダー行をスキップ
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [partNum, partDescription] = line.split(',');
        if (partNum && partDescription) {
          products.push({
            partNum: partNum.trim(),
            partDescription: partDescription.trim(),
          });
        }
      }

      setMessage(`⏳ ${products.length}件の製品をインポート中...`);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.count}件の製品をインポートしました`);
        setMessageType('success');
        setFile(null);
      } else {
        setMessage(`❌ エラー: ${data.error}`);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ エラー: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const messageColors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 p-5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">製品マスターインポート</h1>
          <p>CSVファイルから製品情報を読み込みます</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-5">
          {message && (
            <div className={`p-4 rounded-lg border mb-4 text-center font-semibold ${messageColors[messageType]}`}>
              {message}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">CSVファイルを選択</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              disabled={loading}
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                選択中: {file.name}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-700 mb-2">📋 CSV形式:</p>
            <pre className="text-sm text-gray-600 bg-white p-3 rounded border">
{`PartNum,PartDescription
00-001,WH-PAL 5mm BL -Bulk Otsuka
100-V001,VN WH-A 5mm PIKACHU YELLOW 1P`}
            </pre>
          </div>

          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? '⏳ インポート中...' : '📥 インポート開始'}
          </button>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => (window.location.href = '/scanner')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              📷 スキャナーへ
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              📊 ダッシュボードへ
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-2">💡 使い方:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>CSV形式: PartNum,PartDescription</li>
            <li>1行目はヘッダー（スキップされます）</li>
            <li>既存の製品番号は上書きされます</li>
            <li>インポート後、スキャン時に製品名が表示されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
