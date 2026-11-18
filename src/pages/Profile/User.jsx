import { useContext, useState } from 'react';
import { AuthContext } from '../Auth/Authprovider';
import { Mail, Phone, MapPin, ShieldCheck, ChevronDown } from 'lucide-react';

const InfoRow = ({ icon, iconBg, label, value }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
    <div className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
    </div>
  </div>
);

const AccountTypeRow = ({ value }) => (
  <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
      <ShieldCheck className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Account Type</p>
      <p className="text-sm text-purple-700 font-semibold">{value || 'Standard User'}</p>
    </div>
  </div>
);

const User = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="w-full lg:w-[320px] border rounded-xl p-4">
        <p className="text-center text-gray-500 text-sm">No user data</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-full lg:w-[320px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Desktop ──────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-24" />
        <div className="px-6 pb-6">
          <div className="flex justify-center -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
              {getInitials(user.name)}
            </div>
          </div>
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{user.name || 'Customer'}</h2>
            <div className="flex items-center justify-center gap-1.5 text-slate-500">
              <Mail className="w-4 h-4" />
              <p className="text-sm">{user.email || 'No email'}</p>
            </div>
          </div>
          <div className="border-t border-slate-100 mb-4" />
          <div className="space-y-2">
            <InfoRow icon={<Phone className="w-4 h-4" />}  iconBg="bg-blue-100 text-blue-600"       label="Phone"   value={user.phone   || 'Not provided'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} iconBg="bg-emerald-100 text-emerald-600" label="Address" value={user.address || 'Not provided'} />
            <AccountTypeRow value={user.atype} />
          </div>
        </div>
      </div>

      {/* ── Mobile ───────────────────────────────────────── */}
      <div className="lg:hidden">

        {/* Always visible: avatar + name + email + toggle button */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name || 'Customer'}</p>
            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <p className="text-xs truncate">{user.email || 'No email'}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Collapsible details */}
        <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
              <InfoRow icon={<Phone className="w-4 h-4" />}  iconBg="bg-blue-100 text-blue-600"       label="Phone"   value={user.phone   || 'Not provided'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} iconBg="bg-emerald-100 text-emerald-600" label="Address" value={user.address || 'Not provided'} />
              <AccountTypeRow value={user.atype} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default User;