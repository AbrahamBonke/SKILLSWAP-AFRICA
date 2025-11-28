import { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyQRCheckIn } from '../services/sessionService';

export function QRCodeGenerator({ sessionId, teacherId }) {
  const qrRef = useRef();

  const downloadQR = () => {
    const link = qrRef.current?.querySelector('canvas')?.toDataURL('image/png');
    if (link) {
      const a = document.createElement('a');
      a.href = link;
      a.download = `session-${sessionId}.png`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4 text-primary-900">Session QR Code</h3>
      <p className="text-sm text-gray-600 mb-4">Learner will scan this to check in</p>
      <div ref={qrRef} className="p-4 bg-white border-2 border-primary-500 rounded-lg">
        <QRCode
          value={JSON.stringify({
            sessionId,
            teacherId,
            timestamp: new Date().toISOString()
          })}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <button
        onClick={downloadQR}
        className="mt-4 px-6 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600"
      >
        Download QR Code
      </button>
    </div>
  );
}

export function QRCodeScanner({ onScan, sessionId, learnerId }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const startScan = () => {
    setScanning(true);
    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      true
    );

    scanner.render(
      async (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.sessionId === sessionId) {
            // Verify location (optional GPS check)
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const verified = await verifyQRCheckIn(
                    sessionId,
                    learnerId,
                    position.coords.latitude,
                    position.coords.longitude
                  );
                  if (verified) {
                    onScan(data);
                    await scanner.clear();
                    setScanning(false);
                  } else {
                    alert('Location verification failed. Try again near the session location.');
                  }
                },
                () => {
                  // No location permission, verify QR only
                  onScan(data);
                  scanner.clear();
                  setScanning(false);
                }
              );
            } else {
              onScan(data);
              await scanner.clear();
              setScanning(false);
            }
          } else {
            alert('Invalid QR code for this session');
          }
        } catch (error) {
          console.error('Invalid QR code format:', error);
        }
      },
      (error) => {
        console.error('Error scanning:', error);
      }
    );

    scannerRef.current = scanner;
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-blue-50 rounded-lg">
      {!scanning && (
        <button
          onClick={startScan}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
        >
          Scan QR Code
        </button>
      )}
      {scanning && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Point camera at QR code</p>
          <div id="qr-scanner" className="w-full max-w-xs"></div>
        </div>
      )}
    </div>
  );
}

// Default export for simpler imports
export default function QRComponent({ sessionId, onVerified, learnerId }) {
  return (
    <QRCodeScanner
      sessionId={sessionId}
      learnerId={learnerId}
      onScan={onVerified}
    />
  );
}
