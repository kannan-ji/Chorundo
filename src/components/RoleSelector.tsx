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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.id;

            return (
              <button
                key={role.id}
                id={`role-btn-${role.id}`}
                onClick={() => onRoleChange(role.id)}
                className={`text-left p-3 rounded-2xl border-2 transition-all duration-300 flex items-start gap-3 cursor-pointer group ${
                  isActive
                    ? `${role.activeColor} border-transparent scale-[1.02]`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm tracking-tight">{role.label}</span>
                    {role.badge && (
                      <span
                        className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/30 text-white'
                            : role.id === 'seeker'
                            ? 'bg-emerald-100 text-emerald-800'
                            : role.id === 'donor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {role.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-normal ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {role.descr}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
