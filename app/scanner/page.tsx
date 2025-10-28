'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';

type ScanMode = 'barcode' | 'ocr';

export default function ScannerPage() {
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [sessionScans, setSessionScans] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedData, setScannedData] = useState<{ barcode: string; productName?: string; time: string } | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ barcode: string; timestamp: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ocrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
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

        // Stop scanning if from camera
        if (isFromCamera) {
          await stopScanning();
        }

        // Show modal with scan result
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setScannedData({
          barcode,
          productName: data.productDescription,
          time: timeString
        });
        setShowModal(true);

        // Flash and vibration
        setFlashSuccess(true);
        setTimeout(() => setFlashSuccess(false), 300);

        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        // Play sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (audioError) {
          console.log('Audio not supported:', audioError);
        }

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
    if (scanMode === 'barcode') {
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
    } else {
      // OCR mode
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
        ocrIntervalRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setScanning(false);
      showMessage('⏸️ スキャンを停止しました', 'info');
    }
  };

  const validateProductNumber = (text: string): string | null => {
    // XX-XXX形式を検出（2桁-3桁）
    const pattern = /\b(\d{2})-(\d{3})\b/g;
    const matches = text.match(pattern);

    if (matches && matches.length > 0) {
      return matches[0]; // 最初にマッチした製品番号を返す
    }
    return null;
  };

  const startOcrScanning = async () => {
    try {
      showMessage('📷 カメラを起動中...', 'info');

      // 先にscanningをtrueにしてビデオ要素をレンダリング
      setScanning(true);

      // 少し待ってからビデオ要素にアクセス
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (!videoRef.current) {
        showMessage('❌ ビデオ要素が見つかりません', 'error');
        setScanning(false);
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      showMessage('🔍 OCRスキャン中...', 'info');

      // Tesseract worker を作成
      const worker = await createWorker('eng', 1, {
        logger: (m) => console.log(m),
      });

      // 1秒ごとにOCR処理を実行
      ocrIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // ビデオフレームをキャンバスに描画
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // OCR実行
          const { data } = await worker.recognize(canvas);
          console.log('OCR結果:', data.text);

          // XX-XXX形式の製品番号を検出
          const productNumber = validateProductNumber(data.text);

          if (productNumber) {
            console.log('製品番号検出:', productNumber);
            await sendBarcode(productNumber, true);
          }
        } catch (error) {
          console.error('OCR error:', error);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Start OCR scanning error:', error);
      showMessage(`❌ カメラの起動に失敗: ${error.message || error}`, 'error');
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
    success: 'bg-white text-black border-2 border-black',
    error: 'bg-black text-white border-2 border-black',
    info: 'bg-gray-100 text-black border-2 border-gray-300',
  };

  return (
    <div className={`min-h-screen bg-white p-5 transition-all duration-300 ${flashSuccess ? 'ring-4 ring-black' : ''}`}>
      {/* Success flash overlay */}
      {flashSuccess && (
        <div className="fixed inset-0 bg-black opacity-10 pointer-events-none z-50" />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-black">
            {scanMode === 'barcode' ? 'Barcode Scanner' : 'OCR Reader'}
          </h1>
          <p className="text-gray-600">{scanMode === 'barcode' ? 'Scan barcodes with camera' : 'Recognize XX-XXX format product numbers'}</p>
        </div>

        <div className="bg-white border-2 border-black p-6 mb-5">
          {/* Mode toggle buttons */}
          {!scanning && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setScanMode('barcode')}
                className={`flex-1 py-3 px-4 border-2 border-black font-semibold transition-all ${
                  scanMode === 'barcode'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Barcode
              </button>
              <button
                onClick={() => setScanMode('ocr')}
                className={`flex-1 py-3 px-4 border-2 border-black font-semibold transition-all ${
                  scanMode === 'ocr'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                OCR (XX-XXX)
              </button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg border mb-4 text-center font-semibold ${messageColors[messageType]}`}>
              {message}
            </div>
          )}

          {/* バーコードスキャナー用 */}
          <div
            id="reader"
            className={`rounded-lg overflow-hidden mb-4 ${!(scanning && scanMode === 'barcode') && 'hidden'}`}
            style={{
              minHeight: scanning && scanMode === 'barcode' ? '400px' : '0',
              width: '100%',
              display: scanning && scanMode === 'barcode' ? 'block' : 'none',
            }}
          />

          {/* OCR Scanner */}
          {scanMode === 'ocr' && scanning && (
            <div className="relative overflow-hidden mb-4 border-2 border-black">
              <video
                ref={videoRef}
                className="w-full h-auto"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-4 border-black pointer-events-none" />
            </div>
          )}

          <div className="space-y-3">
            {!scanning ? (
              <button
                onClick={scanMode === 'barcode' ? startScanning : startOcrScanning}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 border-2 border-black transition-all"
              >
                {scanMode === 'barcode' ? 'Start Scanning' : 'Start OCR'}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 border-2 border-black transition-all"
              >
                Stop Scanning
              </button>
            )}

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 border-2 border-black transition-all"
            >
              Dashboard
            </button>
          </div>

          {/* Manual Input */}
          <div className="mt-6 pt-6 border-t-2 border-black">
            <h3 className="text-lg font-semibold text-black mb-3 text-center">
              Manual Input (Test)
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter product number"
                className="w-full px-4 py-3 border-2 border-black focus:outline-none text-lg"
              />
              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 border-2 border-black transition-all"
              >
                Save Manually
              </button>
            </form>
          </div>

          {sessionScans > 0 && (
            <div className="mt-6 text-center">
              <div className="text-3xl font-bold text-black">{sessionScans}</div>
              <div className="text-sm text-gray-600 mt-1">Scans This Session</div>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-black p-4 text-black text-sm">
          <p className="font-semibold mb-2">Tips:</p>
          {scanMode === 'barcode' ? (
            <ul className="space-y-1 list-disc list-inside">
              <li>Camera permission required</li>
              <li>Align barcode in center of frame</li>
              <li>Scan in well-lit environment</li>
              <li>Duplicate scans ignored for 1 second</li>
            </ul>
          ) : (
            <ul className="space-y-1 list-disc list-inside">
              <li>Camera permission required</li>
              <li>Only recognizes XX-XXX format (e.g., 49-789)</li>
              <li>Keep text clear and in focus</li>
              <li>Scan in well-lit environment</li>
              <li>Recognition may take a few seconds</li>
            </ul>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showModal && scannedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div className="bg-white border-4 border-black max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-black mb-2">Scan Successful</h2>
              <p className="text-sm text-gray-600">{scannedData.time}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-2 border-black p-4">
                <div className="text-sm text-gray-600 mb-1">Product Number</div>
                <div className="text-2xl font-bold font-mono text-black">{scannedData.barcode}</div>
              </div>

              {scannedData.productName && (
                <div className="border-2 border-black p-4">
                  <div className="text-sm text-gray-600 mb-1">Product Name</div>
                  <div className="text-lg text-black">{scannedData.productName}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setScannedData(null);
                }}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 border-2 border-black transition-all"
              >
                Scan Next
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 border-2 border-black transition-all"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
