'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { RosterTable } from '@/components/dashboard/RosterTable';
import { AddMemberModal } from '@/components/dashboard/AddMemberModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function RosterPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{id: string, name: string}>>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchContributors = async (pid: string) => {
    try {
      const { data, error } = await supabase
        .from('project_contributors')
        .select('id, user_id, role, revenue_share, status, users(name, wallet_address)')
        .eq('project_id', pid)
        .order('revenue_share', { ascending: false });
      
      if (data) setContributors(data);
    } catch (err) {
      console.error('Failed to fetch contributors:', err);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: projs } = await supabase
          .from('projects')
          .select('id, name')
          .eq('status', 'Active')
          .order('created_at', { ascending: false });
        
        if (projs && projs.length > 0) {
          setProjectsList(projs);
          setProjectId(projs[0].id);
          await fetchContributors(projs[0].id);
        }
      } catch (err) {
        console.error('Initial fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleProjectChange = async (pid: string) => {
    setProjectId(pid);
    await fetchContributors(pid);
  };

  if (isLoading) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Roster Management</h1>
          <p className="text-gray-500 font-medium mt-1">Configure project contributors and their revenue share percentages.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={projectId || ''} 
            onChange={(e) => handleProjectChange(e.target.value)}
            className="bg-[#1A1B23] border border-white/10 rounded-xl px-4 py-2 text-white font-bold outline-none cursor-pointer"
          >
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            + Add Member
          </button>
        </div>
      </div>

      <RosterTable 
        contributors={contributors} 
        onRefresh={() => projectId && fetchContributors(projectId)} 
      />

      <AnimatePresence>
        {isAddModalOpen && (
          <AddMemberModal 
            projectId={projectId} 
            onClose={() => setIsAddModalOpen(false)} 
            onSuccess={() => {
              setIsAddModalOpen(false);
              projectId && fetchContributors(projectId);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
