import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, AlertTriangle, Heart } from 'lucide-react';

export interface PatronNotification {
  id: string;
  type: 'urgency' | 'success' | 'claim' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface DonorNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PatronNotification[];
  onMarkAllRead: () => void;
  onReadNotification: (id: string) => void;
}

export function DonorNotifications({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onReadNotification,
}: DonorNotificationsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-[9990] cursor-pointer"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Bell className="w-5 h-5 fill-emerald-100" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Notifications</h3>
                  <p className="text-[11px] font-mono text-slate-404">real-time activity logs</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* NOTIFICATIONS HUB FEED */}
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 select-none text-slate-450">
                <span className="font-mono text-[9px] font-black uppercase tracking-wider">Live System Logs</span>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-emerald-700 hover:text-emerald-900 text-[10px] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-404">
                    <Bell className="w-8 h-8 text-slate-350 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">No alerts or notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    // Accents depending on type
                    const isUnread = !item.read;
                    let bgClass = 'bg-slate-50 border-slate-200';
                    let iconEl = <Bell className="w-4 h-4 text-slate-500" />;
                    let tagLabel = 'info';
                    let tagClass = 'bg-slate-100 text-slate-707 border-slate-200';

                    if (item.type === 'urgency') {
                      bgClass = isUnread ? 'bg-red-50/70 border-red-200/80' : 'bg-white border-slate-200/80';
                      iconEl = <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />;
                      tagLabel = 'deficit alert';
                      tagClass = 'bg-red-50 text-red-700 border-red-100';
                    } else if (item.type === 'success') {
                      bgClass = isUnread ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200/80';
                      iconEl = <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />;
                      tagLabel = 'receipt';
                      tagClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    } else if (item.type === 'claim') {
                      bgClass = isUnread ? 'bg-teal-50/55 border-teal-200' : 'bg-white border-slate-200/80';
                      iconEl = <Heart className="w-4 h-4 text-teal-600 fill-teal-100" />;
                      tagLabel = 'live claim';
                      tagClass = 'bg-teal-50 text-teal-850 border-teal-100';
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => onReadNotification(item.id)}
                        className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden text-xs space-y-2 select-text cursor-pointer ${bgClass} ${
                          isUnread ? 'shadow-xs ring-1 ring-emerald-500/10' : ''
                        }`}
                      >
                        {/* Unread circle badge */}
                        {isUnread && (
                          <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        )}

                        <div className="flex items-center gap-2">
                          <div className="shrink-0">{iconEl}</div>
                          <div className="flex items-center gap-1.5 min-w-0 pr-4">
                            <h4 className="font-extrabold text-slate-800 truncate select-all">{item.title}</h4>
                            <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${tagClass}`}>
                              {tagLabel}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed font-light">{item.message}</p>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100/60 font-medium">
                          <span>Atithi Live Network</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
