'use client';
import React, { useState } from 'react';
import { RightsHolderProfileModal } from './RightsHolderProfileModal';
import { toast } from 'react-hot-toast';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface RightsHolder {
  id: string;
  name: string;
  role: string;
  projectName?: string;
  percentage: number;
  total_received: number;
}

export const RightsHolderRow: React.FC<{ 
  holder: RightsHolder; 
  transactions: any[];
  onRefresh?: () => void;
}> = ({ holder, transactions, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftPercentage, setDraftPercentage] = useState(holder.percentage);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/projects/contributors/${holder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revenue_share: Number(draftPercentage) })
      });
      if (!res.ok) throw new Error('Failed to update share');
      toast.success('Allocation updated');
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to save changes');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${holder.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/projects/contributors/${holder.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove contributor');
      toast.success('Contributor removed');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to remove contributor');
      console.error(err);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white/5 rounded-2xl border border-white/5 p-5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group shadow-lg cursor-pointer"
      >
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg font-black text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer hover:scale-105 transition-transform"
          >
            {holder.name?.charAt(0)}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white truncate">{holder.name}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove();
                      }}
                      className="text-[10px] font-black text-rose-500/70 hover:text-rose-400 uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSave();
                      }}
                      disabled={isSaving}
                      className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                    >
                      {isSaving ? '...' : 'Save'}
                    </button>
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsEditing(false);
                        setDraftPercentage(holder.percentage);
                      }}
                      className="text-[10px] font-black text-gray-500 hover:text-gray-400 uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-black/20 px-2 py-0.5 rounded-md">
                {holder.role}
              </span>
              {holder.projectName && (
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {holder.projectName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Allocation</p>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={draftPercentage}
                  onChange={(e) => setDraftPercentage(Number(e.target.value))}
                  onClick={(event) => event.stopPropagation()}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 font-mono text-indigo-400 font-black text-lg focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <span className="text-indigo-400 font-black">%</span>
              </div>
            ) : (
              <span className="font-mono text-indigo-400 font-black text-lg">{holder.percentage}%</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Total Payout</p>
            <span className="text-sm font-black text-emerald-400">{formatUSD(holder.total_received)}</span>
          </div>
        </div>
      </div>

      <RightsHolderProfileModal 
        holder={holder} 
        isOpen={showModal}
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};
