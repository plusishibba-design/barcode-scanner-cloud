'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [sessionScans, setSessionScans] = useState(0);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const sendBarcode = async (barcode: string) => {
    try {
      const response = await fetch('/api/barcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionScans((prev) => prev + 1);
        showMessage(`✅ 保存成功: ${barcode}`, 'success');

        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        setTimeout(() => {
          if (scanning) {
            showMessage('📷 スキャン中...', 'info');
          }
        }, 2000);

        return true;
      } else {
        showMessage(`❌ エラー: ${data.error}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('Send barcode error:', error);
      showMessage('❌ サーバーに接続できません', 'error');
      return false;
    }
  };

  const startScanning = async () => {
    try {
      showMessage('📷 カメラを起動中...', 'info');

      // Initialize Html5Qrcode if not already created
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          console.log('Barcode detected:', decodedText);
          await sendBarcode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (these are frequent and expected)
          console.debug('Scan error:', errorMessage);
        }
      );

      setScanning(true);
      showMessage('📷 スキャン中...', 'info');
    } catch (error: any) {
      console.error('Start scanning error:', error);
      showMessage(`❌ カメラの起動に失敗: ${error.message || error}`, 'error');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (!html5QrCodeRef.current) {
      console.warn('No scanner to stop');
      return;
    }

    try {
      await html5QrCodeRef.current.stop();
      setScanning(false);
      showMessage('⏸️ スキャンを停止しました', 'info');
    } catch (error: any) {
      console.error('Stop scanning error:', error);
      showMessage(`❌ 停止エラー: ${error.message || error}`, 'error');
      setScanning(false);
    }
  };

  const messageColors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">バーコードスキャナー</h1>
          <p>カメラでバーコードを読み取ります</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-5">
          {message && (
            <div className={`p-4 rounded-lg border mb-4 text-center font-semibold ${messageColors[messageType]}`}>
              {message}
            </div>
          )}

          <div
            id="reader"
            className={`rounded-lg overflow-hidden mb-4 ${!scanning && 'hidden'}`}
            style={{ minHeight: scanning ? '300px' : '0' }}
          />

          <div className="space-y-3">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                📷 スキャン開始
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                ⏸️ スキャン停止
              </button>
            )}

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              📊 ダッシュボードへ
            </button>
          </div>

          {sessionScans > 0 && (
            <div className="mt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{sessionScans}</div>
              <div className="text-sm text-gray-600 mt-1">今回のセッション</div>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-2">💡 ヒント:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>カメラの許可が必要です</li>
            <li>バーコードを画面中央に合わせてください</li>
            <li>明るい場所でスキャンしてください</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
