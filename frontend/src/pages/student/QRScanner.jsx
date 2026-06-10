import React, { useState } from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const startScan = () => {
    setScanning(true);
    // Mock successful scan after 2.5 seconds
    setTimeout(async () => {
      try {
        await axios.post('/queues/join', {
            resourceType: 'washroom',
            resourceId: 1 // Simulated washroom ID 1
        });
        toast.success('QR Scanned! Successfully joined Washroom 1 queue.');
        navigate('/');
      } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to join queue via QR');
      } finally {
          setScanning(false);
      }
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">QR Code Scanner</h2>
        <p className="text-gray-400">Scan codes located outside washrooms to join instantly</p>
      </div>

      <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px]">
        {scanning ? (
          <div className="relative w-64 h-64 bg-dark-900 border-2 border-primary-500/50 rounded-3xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-500/10 animate-pulse"></div>
            <ScanLine size={64} className="text-primary-400 animate-bounce" />
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 bg-dark-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <QrCode size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Ready to Scan</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-sm">
              Point your camera at the QR code on the washroom or washing machine door.
            </p>
            <button 
              onClick={startScan}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(14,165,233,0.3)]"
            >
              Start Camera Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
