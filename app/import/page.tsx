'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [productCount, setProductCount] = useState<number | null>(null);

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
    success: 'bg-white text-black border-2 border-black',
    error: 'bg-black text-white border-2 border-black',
    info: 'bg-gray-100 text-black border-2 border-gray-300',
  };

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-black">Import Product Master</h1>
          <p className="text-gray-600">Load product data from CSV file</p>
        </div>

        <div className="bg-white border-2 border-black p-6 mb-5">
          {message && (
            <div className={`p-4 border mb-4 text-center font-semibold ${messageColors[messageType]}`}>
              {message}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-black font-semibold mb-2">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none"
              disabled={loading}
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </div>
            )}
          </div>

          <div className="bg-gray-50 border-2 border-black p-4 mb-6">
            <p className="font-semibold text-black mb-2">CSV Format:</p>
            <pre className="text-sm text-black bg-white p-3 border-2 border-black font-mono">
{`PartNum,PartDescription
00-001,WH-PAL 5mm BL -Bulk Otsuka
100-V001,VN WH-A 5mm PIKACHU YELLOW 1P`}
            </pre>
          </div>

          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 border-2 border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Start Import'}
          </button>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => (window.location.href = '/scanner')}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 border-2 border-black transition-all"
            >
              Scanner
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 border-2 border-black transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 text-black text-sm">
          <p className="font-semibold mb-2">Instructions:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>CSV format: PartNum,PartDescription</li>
            <li>First row is header (will be skipped)</li>
            <li>Existing product numbers will be updated</li>
            <li>Product names will appear when scanning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
