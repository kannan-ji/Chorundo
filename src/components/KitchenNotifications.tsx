import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: React.ReactNode;
}

interface KitchenNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  markAllAsRead: () => void;
  notifications: NotificationItem[];
  handleNotificationClick: (id: string) => void;
}

export function KitchenNotifications({
  isOpen,
  onClose,
  unreadCount,
  markAllAsRead,
  notifications,
  handleNotificationClick,
}: KitchenNotificationsProps) {
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
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <Bell className="w-5 h-5 fill-emerald-100 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wide">Kitchen Alerts</h3>
                  <p className="text-[10px] font-mono text-slate-400">real-time counter updates</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* NOTIFICATIONS HUB FEED */}
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 select-none text-slate-400">
                <span className="font-mono text-[9px] font-black uppercase tracking-wider">Live Register Stream</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-extrabold hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="w-8 h-8 text-slate-350 mx-auto mb-2 opacity-55" />
                    <p className="text-xs font-semibold">No alerts or notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = item.unread;
                    let bgClass = 'bg-white border-slate-200/80 hover:bg-slate-50/50';
                    let tagLabel = item.type;
                    let tagClass = 'bg-slate-100 text-slate-707 border-slate-205';

                    if (item.type === 'milestone') {
                      bgClass = isUnread ? 'bg-amber-50/40 border-amber-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                      tagLabel = 'milestone success';
                      tagClass = 'bg-amber-50 text-amber-800 border-amber-100';
                    } else if (item.type === 'donation') {
                      bgClass = isUnread ? 'bg-emerald-50/40 border-emerald-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                      tagLabel = 'community sponsor';
                      tagClass = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                    } else if (item.type === 'claim') {
                      bgClass = isUnread ? 'bg-sky-50/40 border-sky-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                      tagLabel = 'active claim';
                      tagClass = 'bg-sky-50 text-sky-850 border-sky-100';
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item.id)}
                        className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden text-xs select-text cursor-pointer ${bgClass} ${
                          isUnread ? 'shadow-3xs ring-1 ring-emerald-500/10' : ''
                        }`}
                      >
                        {/* Unread dot indicator */}
                        {isUnread && (
                          <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        )}

                        <div className="flex items-center gap-2 mb-2 select-none">
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-101">
                            {item.icon}
                          </div>
                          <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${tagClass}`}>
                            {tagLabel}
                          </span>
                          <span className="text-[9px] font-sans font-medium text-slate-400 ml-auto mr-3">
                            {item.time}
                          </span>
                        </div>

                        <h5 className={`text-[11.5px] tracking-tight ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                          {item.title}
                        </h5>
                        
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-101 mt-4 text-center select-none bg-slate-50/30 rounded-2xl p-3">
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                Sadhya Registry Terminal Secured
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
