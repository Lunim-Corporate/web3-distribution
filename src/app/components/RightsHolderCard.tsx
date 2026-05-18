import React from 'react';

const RightsHolderCard = ({ holder, distributeAmount }) => {
  const initials = holder.name
    ? holder.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Preview: how much this holder will receive from the entered amount
  const willReceive = distributeAmount
    ? (Number(distributeAmount) * Number(holder.percentage) / 100)
    : 0;

  const formatUSD = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

  // Pick a gradient for the avatar based on role
  const roleColors = {
    Production: 'from-indigo-500 to-purple-600',
    Performer: 'from-pink-500 to-rose-500',
    Composer: 'from-amber-500 to-orange-500',
    Lyrics: 'from-teal-500 to-cyan-500',
    default: 'from-gray-500 to-slate-600',
  };
  const avatarGradient = roleColors[holder.role] || roleColors.default;

  return (
    <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {/* Card Header */}
      <div className="p-5 flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
            {initials}
          </div>
          <div>
            <div className="font-bold text-gray-200 group-hover:text-white transition-colors text-base leading-tight">{holder.name}</div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">{holder.role}</div>
            {holder.projectName && (
              <div className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mt-1">{holder.projectName}</div>
            )}
          </div>
        </div>
        <div className="bg-indigo-500/10 text-indigo-300 py-1.5 px-3.5 rounded-full text-xs font-black border border-indigo-400/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]">
          {holder.percentage}%
        </div>
      </div>

      {/* Revenue Bar */}
      <div className="px-5 pb-4 relative z-10">
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className={`h-full bg-gradient-to-r ${avatarGradient} rounded-full transition-all duration-500 shadow-[0_0_8px_currentColor]`}
            style={{ width: `${Math.min(holder.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-white/10 px-5 py-4 bg-black/20 mt-auto space-y-2.5 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Earned</span>
          <span className="text-sm font-black text-gray-300 font-mono tracking-tight">{formatUSD(holder.total_earned || holder.total_received || 0)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Recent Payment</span>
          <span className="text-sm font-black text-gray-300 font-mono tracking-tight">{formatUSD(holder.recent_payment || 0)}</span>
        </div>

        {willReceive > 0 && (
          <div className="flex justify-between items-center bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-400/20">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Preview Split</span>
            <span className="text-sm font-mono font-black text-emerald-300 tracking-tight">+{formatUSD(willReceive)}</span>
          </div>
        )}

        {holder.wallet_address && (
          <div className="text-[10px] text-gray-600 font-mono truncate pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {holder.wallet_address}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightsHolderCard;
