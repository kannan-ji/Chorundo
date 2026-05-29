import { Eye, Heart, HelpCircle, Key, Navigation, User } from 'lucide-react';
import { Role } from '../types';

interface RoleSelectorProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  seekerCodeCount: number;
}

export default function RoleSelector({ currentRole, onRoleChange, seekerCodeCount }: RoleSelectorProps) {
  const roles = [
    {
      id: 'seeker' as Role,
      label: 'Athithi',
      descr: 'Find kitchens & request free hot meals',
      icon: Navigation,
      badge: seekerCodeCount > 0 ? `${seekerCodeCount} Active` : null,
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
      activeColor: 'bg-emerald-600 shadow-emerald-100 ring-2 ring-emerald-600 text-white',
    },
    {
      id: 'donor' as Role,
      label: 'Donor',
      descr: 'Pre-pay for meals & track community impact',
      icon: Heart,
      badge: 'Sponsor',
      color: 'border-blue-500 bg-blue-50/50 text-blue-950',
      activeColor: 'bg-blue-600 shadow-blue-100 ring-2 ring-blue-600 text-white',
    },
    {
      id: 'kitchen' as Role,
      label: 'Partner Kitchen',
      descr: 'Claim guest codes & log walk-ins without phone',
      icon: Key,
      badge: 'Merchant',
      color: 'border-emerald-600 bg-emerald-50/50 text-emerald-900',
      activeColor: 'bg-emerald-700 shadow-emerald-100 ring-2 ring-emerald-700 text-white',
    },
  ];

  const activeRole = roles.find((r) => r.id === currentRole) || roles[0];
  const ActiveIcon = activeRole.icon;

  return (
    <div className="w-full bg-slate-50 border border-slate-200/80 p-4 rounded-3xl mb-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            interactive role simulator (test the workflow loops!)
          </span>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            Actions in one role instantly update the other views!
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200/60 p-4 rounded-2xl">
          <div className="flex-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Current Simulator Role
            </label>
            <div className="relative">
              <select
                id="role-simulator-dropdown"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="w-full appearance-none bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl pl-11 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:outline-none transition-all cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label} {role.badge ? `(${role.badge})` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-150 pt-3 md:pt-0 md:pl-5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold shrink-0">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm tracking-tight text-slate-900">{activeRole.label} Simulator</span>
                {activeRole.badge && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {activeRole.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-normal mt-1">
                {activeRole.descr}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
