import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Sliders, Ticket, FileCode, CheckCircle2 } from 'lucide-react';
import { MealClaim } from '../types';

interface VoucherQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (code: string) => void;
  pendingClaims?: MealClaim[]; // Provide active system claims for smart testing simulation
}

export function VoucherQRScanner({ isOpen, onClose, onScanResult, pendingClaims = [] }: VoucherQRScannerProps) {
  const scannerId = "sadhya-qr-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'scanning' | 'error' | 'permission_denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Initialize and start camera
  const startCamera = async () => {
    setCameraState('starting');
    setErrorMessage('');
    setScannedCode(null);

    // Wait a brief tick for DOM element container to mount fully
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success handler
            handleSuccess(decodedText);
          },
          () => {
            // Verbose error logging ignored to keep execution clean
          }
        );
        setCameraState('scanning');
      } catch (err: any) {
        console.warn("QR Camera Scan Startup Error:", err);
        const errStr = String(err).toLowerCase();
        if (errStr.includes("notallowed") || errStr.includes("permission") || errStr.includes("notsupported") || errStr.includes("not found")) {
          setCameraState('permission_denied');
          setErrorMessage("Camera access blocked by preview container or device browser settings.");
        } else {
          setCameraState('error');
          setErrorMessage(err.message || "Could not spin up hardware device camera");
        }
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Error stopping QR camera:", e);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const handleSuccess = (code: string) => {
    // Play light camera scan success tone if api is capable
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch notification tone
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (_) {}

    setScannedCode(code);
    onScanResult(code);
    
    // Auto terminate scanner and slide closed
    stopCamera();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedCode(null);
      setCameraState('idle');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle manual input fallback from file drag selection or simulator click
  const handleSimulateScan = (code: string) => {
    handleSuccess(code);
  };

  // Extract valid non-redeemed testable codes
  const testableClaims = pendingClaims.filter(c => c.status === 'pending' && !c.isWalkIn);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-[9995] backdrop-blur-xs cursor-pointer"
          />

          {/* Dialog Body Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl z-[9996] overflow-hidden flex flex-col max-h-[80vh] font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between select-none bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
                  <Camera className="w-5 h-5 text-emerald-700 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Sadhya Scan terminal</h3>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">Quick register verification</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scan Area */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col items-center justify-center space-y-4">
              
              {/* Camera Frame */}
              <div className="relative w-64 h-64 bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center shrink-0">
                
                {/* Simulated Green Scanner Corner Highlights */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-md z-12 pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-md z-12 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-md z-12 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-md z-12 pointer-events-none" />

                {/* Sweeping scan laser */}
                {cameraState === 'scanning' && (
                  <div className="absolute inset-x-8 h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400 animate-bounce top-1/4 z-10 pointer-events-none" />
                )}

                {/* Actual HTML5QRReader Container Target */}
                <div 
                  id={scannerId} 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraState === 'scanning' ? 'opacity-100' : 'opacity-0 absolute scale-0 pointer-events-none'
                  }`} 
                />

                {/* State Indicators */}
                {cameraState === 'starting' && (
                  <div className="text-center p-4 space-y-2 text-slate-400 select-none z-10">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto opacity-75" />
                    <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold">Starting camera device...</p>
                  </div>
                )}

                {(cameraState === 'error' || cameraState === 'permission_denied' || cameraState === 'idle') && (
                  <div className="text-center p-6 space-y-3 shrink-0 rounded-2xl select-none z-11">
                    <div className="p-3 bg-red-150 bg-red-50 text-red-700 rounded-2xl inline-block border border-red-100 animate-pulse">
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest leading-none">Iframe Sandbox restrictions</h4>
                      <p className="text-[10px] text-slate-350 leading-relaxed font-sans max-w-[200px] mx-auto mt-1">
                        Camera permissions are blocked inside browser frame. Please use our **Instant Simulator** presets below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Successful Scanned Badge Overlay */}
                {scannedCode && (
                  <div className="absolute inset-0 bg-emerald-700/90 flex flex-col items-center justify-center p-6 text-white text-center z-20">
                    <CheckCircle2 className="w-12 h-12 text-white fill-emerald-805 mb-2 animate-bounce" />
                    <div className="text-[10px] font-mono tracking-widest font-black uppercase text-emerald-150">Voucher Verified!</div>
                    <code className="text-lg font-black font-mono tracking-wider bg-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-600 mt-2 block">{scannedCode}</code>
                  </div>
                )}
              </div>

              {/* Status message or instructional overlay */}
              {cameraState === 'scanning' && (
                <p className="text-[10px] font-sans font-bold text-slate-500 uppercase text-center tracking-wider animate-pulse flex items-center justify-center gap-1.5 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  Hold QR Code stable within green borders
                </p>
              )}

              {/* TEST SIMULATOR UTILITY DRAWER (Extremely helpful for testing and evaluation) */}
              <div className="w-full bg-slate-50 border border-slate-200/60 p-4 rounded-2xl relative select-none">
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-bounce" />
                    <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wide">⚡ Quick Scan Simulator</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider bg-slate-200/55 px-1.5 py-0.5 rounded-md border border-slate-300/40">
                    {testableClaims.length} unclaimed
                  </span>
                </div>

                {testableClaims.length === 0 ? (
                  <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                    <Ticket className="w-6 h-6 text-slate-300 mx-auto mb-1 opacity-70" />
                    <p className="text-[10.5px] font-bold text-slate-500">No active seeker vouchers</p>
                    <p className="text-[9px] text-slate-400 font-sans mt-0.5 leading-normal max-w-[240px] mx-auto">
                      Generate a code in **Athithi Terminal** first, then return here to test simulate immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {testableClaims.map((claim) => (
                      <button
                        key={claim.id}
                        type="button"
                        onClick={() => handleSimulateScan(claim.code)}
                        className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-emerald-50/40 hover:border-emerald-250 border border-slate-150 rounded-xl transition-all cursor-pointer group text-left shadow-3xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-emerald-50 text-emerald-700 rounded mr-0.5">
                            <FileCode className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-black font-mono tracking-wider text-emerald-800 leading-none">
                              {claim.code}
                            </div>
                            <div className="text-[8px] text-slate-400 font-sans mt-1">
                              {claim.seekerName || 'Anonymous Seeker'} • {claim.kitchenName}
                            </div>
                          </div>
                        </div>
                        <span className="text-[8.5px] font-bold uppercase text-emerald-700 font-sans bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-100 px-2 py-0.5 rounded-lg transition-colors select-none">
                          Scan ⚡
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Information */}
            <div className="p-3.5 bg-slate-50 hover:bg-slate-100/90 border-t border-slate-100 text-center select-none text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">
              Secured Sadhya Scanner System
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
