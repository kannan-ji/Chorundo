import { motion, useAnimation } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { User, ChevronRight, Check } from 'lucide-react';

interface SwipeButtonProps {
  onSwipe: () => void;
  disabled?: boolean;
  label: string;
  disabledLabel?: string;
}

export function SwipeButton({ onSwipe, disabled = false, label, disabledLabel }: SwipeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const controls = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const thumbWidth = 44; // h-11 w-11 is 44px
  const maxDragX = Math.max(0, sliderWidth - thumbWidth - 12); // p-1.5 is 6px on each side, so 12px total margin

  useEffect(() => {
    if (containerRef.current) {
      setSliderWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setSliderWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state if disabled triggers dynamically
  useEffect(() => {
    if (disabled) {
      controls.set({ x: 0 });
      setIsSuccess(false);
    }
  }, [disabled, controls]);

  const handleDragEnd = async (_event: any, info: any) => {
    if (disabled || isSuccess) return;

    // Check if user swiped past 80% of width
    if (info.offset.x >= maxDragX * 0.8) {
      setIsSuccess(true);
      // Snap to the end smoothly
      await controls.start({ x: maxDragX, transition: { type: 'spring', stiffness: 350, damping: 25 } });
      onSwipe();
      
      // Reset back to starting position after a delay for successive logs
      setTimeout(() => {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }).then(() => {
          setIsSuccess(false);
        });
      }, 1800);
    } else {
      // Snap back to start immediately
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-14 rounded-2xl relative flex items-center p-1.5 overflow-hidden transition-all duration-300 select-none ${
        disabled 
          ? 'bg-slate-100 border border-slate-200/80 text-slate-400' 
          : 'bg-slate-900 border border-slate-800 text-white shadow-lg shadow-slate-200/60'
      }`}
    >
      {/* Centered Instructions text placeholder */}
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black uppercase tracking-widest pointer-events-none select-none text-center px-12 leading-none">
        {disabled ? (
          <span className="text-slate-400">{disabledLabel || 'No Prepaid Meals Available'}</span>
        ) : isSuccess ? (
          <span className="text-emerald-400 animate-pulse flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> Logging Walk-In...
          </span>
        ) : (
          <span className="opacity-90 flex items-center gap-1.5 text-slate-350">
            {label}
            <ChevronRight className="w-3 h-3 animate-pulse text-emerald-400 shrink-0" />
          </span>
        )}
      </div>

      {/* Interactive Draggable handle */}
      {!disabled && (
        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: maxDragX }}
          dragElastic={0.06}
          dragMomentum={false}
          animate={controls}
          onDragEnd={handleDragEnd}
          className={`h-11 w-11 rounded-xl flex items-center justify-center cursor-pointer cursor-grab active:cursor-grabbing transition-colors z-10 select-none ${
            isSuccess 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'bg-white text-slate-900 hover:bg-slate-50 shadow-md border border-slate-200'
          }`}
        >
          {isSuccess ? (
            <Check className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <User className="w-4.5 h-4.5 text-slate-800" />
          )}
        </motion.div>
      )}
    </div>
  );
}
