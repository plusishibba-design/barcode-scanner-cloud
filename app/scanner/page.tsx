'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [sessionScans, setSessionScans] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ barcode: string; timestamp: number } | null>(null);

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

  const sendBarcode = async (barcode: string, isFromCamera: boolean = false) => {
    // カメラからのスキャンの場合、1秒以内の同じバーコードは無視
    if (isFromCamera) {
      const now = Date.now();
      if (
        lastScannedRef.current &&
        lastScannedRef.current.barcode === barcode &&
        now - lastScannedRef.current.timestamp < 1000
      ) {
        console.log('Same barcode within 1 second, ignoring');
        return false;
      }
      lastScannedRef.current = { barcode, timestamp: now };
    }

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

        // 画面全体を緑色にフラッシュ
        setFlashSuccess(true);
        setTimeout(() => setFlashSuccess(false), 300);

        // バイブレーション
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // より強い振動パターン
        }

        // 音を鳴らす
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800; // 高めの音
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (audioError) {
          console.log('Audio not supported:', audioError);
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
        qrbox: { width: 300, height: 150 }, // 1Dバーコード用に横長に変更
        aspectRatio: 2.0, // 横長の比率
        formatsToSupport: [
          // 1Dバーコードを優先
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE, // QRコードも対応
        ],
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          console.log('Barcode detected:', decodedText);
          await sendBarcode(decodedText, true); // カメラからのスキャンであることを示す
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      showMessage('❌ バーコードを入力してください', 'error');
      return;
    }

    showMessage('⏳ 送信中...', 'info');
    const success = await sendBarcode(manualInput.trim());
    if (success) {
      setManualInput('');
    }
  };

  const messageColors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5 transition-all duration-300 ${flashSuccess ? 'ring-8 ring-green-400' : ''}`}>
      {/* 成功時の全画面フラッシュオーバーレイ */}
      {flashSuccess && (
        <div className="fixed inset-0 bg-green-500 opacity-30 pointer-events-none z-50 animate-pulse" />
      )}

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
            style={{
              minHeight: scanning ? '400px' : '0',
              width: '100%',
              display: scanning ? 'block' : 'none',
            }}
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

          {/* 手動入力セクション */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">
              ✏️ 手動入力（テスト用）
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="バーコード番号を入力"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              />
              <button
                type="submit"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                💾 手動で保存
              </button>
            </form>
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
