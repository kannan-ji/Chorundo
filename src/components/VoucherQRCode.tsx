import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface VoucherQRCodeProps {
  value: string;
  size?: number;
}

export function VoucherQRCode({ value, size = 180 }: VoucherQRCodeProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [errorCode, setErrorCode] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#047857', // emerald-700
          light: '#F8FAFC', // Slate-50 background for clean compatibility
        },
      },
      (err, url) => {
        if (err) {
          console.error('QR Code Generation Error:', err);
          setErrorCode(true);
        } else {
          setQrSrc(url);
          setErrorCode(false);
        }
      }
    );
  }, [value, size]);

  if (errorCode) {
    return (
      <div className="flex items-center justify-center border border-dashed border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-[10px] uppercase font-bold tracking-wider">
        QR generation failed
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-250 border-slate-200/80 rounded-2xl relative shadow-3xs overflow-hidden w-full max-w-[210px] mx-auto select-none">
      {qrSrc ? (
        <div className="relative group">
          <img
            src={qrSrc}
            alt="Voucher QR Code"
            className="w-36 h-36 border border-emerald-100 rounded-xl bg-white shadow-2xs select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Subtle center marker or styling accents */}
          <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 rounded-full border border-slate-200/55" />
          <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 rounded-full border border-slate-200/55" />
        </div>
      ) : (
        <div className="w-36 h-36 bg-slate-100 border border-slate-200 animate-pulse rounded-xl flex items-center justify-center">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Generating...</span>
        </div>
      )}
    </div>
  );
}
