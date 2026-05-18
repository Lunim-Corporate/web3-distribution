'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { parseCsvRoster, generateCsvTemplate, CsvRow } from '@/lib/csvParser';

interface CsvImportModalProps {
  projectId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalShare = parsedRows.reduce((sum, r) => sum + r.revenue_share, 0);
  const canImport = parsedRows.length > 0 && parseErrors.length === 0 && !isImporting;

  // --- File handling ---
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsvRoster(text);
      setParsedRows(result.rows);
      setParseErrors(result.errors);
      setIsParsed(true);
    };
    reader.readAsText(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // --- Template download ---
  const downloadTemplate = () => {
    const csv = generateCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Import logic ---
  const handleImport = async () => {
    if (!projectId) return;
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of parsedRows) {
      try {
        // Upsert user by wallet
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', row.wallet_address)
          .single();

        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: newUser, error: uErr } = await supabase
            .from('users')
            .insert({ name: row.name, wallet_address: row.wallet_address, role: 'creator' })
            .select('id')
            .single();
          if (uErr) throw uErr;
          userId = newUser!.id;
        }

        // Insert project_contributor
        const { error: cErr } = await supabase
          .from('project_contributors')
          .insert({
            project_id: projectId,
            user_id: userId,
            role: row.role,
            revenue_share: row.revenue_share,
            status: 'Active',
          });

        if (cErr) throw cErr;
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed to import ${row.name}:`, err);
      }
    }

    if (successCount > 0) toast.success(`Imported ${successCount} member(s) successfully`);
    if (failCount > 0) toast.error(`${failCount} member(s) failed to import`);

    setIsImporting(false);
    if (successCount > 0) onSuccess();
  };

  // --- Reset ---
  const resetState = () => {
    setParsedRows([]);
    setParseErrors([]);
    setIsParsed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0B0C10] border border-white/10 rounded-3xl p-8 relative z-10 shadow-3xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Bulk CSV Import</h2>
            <p className="text-gray-500 text-sm mt-1">Upload a CSV to add multiple creators at once.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        {/* Template download */}
        <button
          onClick={downloadTemplate}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download CSV Template
        </button>

        {/* Upload zone */}
        {!isParsed && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileInput}
              className="hidden"
            />
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-semibold text-gray-300">
              {isDragOver ? 'Drop your CSV file here' : 'Drag & drop a CSV file, or click to browse'}
            </p>
            <p className="text-xs text-gray-600 mt-2">Only .csv files accepted</p>
          </div>
        )}

        {/* Parse results */}
        {isParsed && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-black text-lg">{parsedRows.length}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Valid</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg ${parseErrors.length > 0 ? 'text-rose-400' : 'text-gray-600'}`}>
                  {parseErrors.length}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Errors</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg ${totalShare > 100 ? 'text-rose-400' : 'text-indigo-400'}`}>
                  {totalShare}%
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Share</span>
              </div>
            </div>

            {/* Error list */}
            {parseErrors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Validation Errors</p>
                <ul className="space-y-1">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="text-xs text-rose-300">• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Wallet</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm font-semibold text-white">{row.name}</td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] text-indigo-300 font-mono bg-indigo-500/5 px-1.5 py-0.5 rounded">
                            {row.wallet_address.slice(0, 8)}…{row.wallet_address.slice(-4)}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{row.role}</td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-400 text-right">{row.revenue_share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={resetState}
                className="flex-1 py-3 font-bold text-gray-400 hover:text-white transition-colors text-sm"
              >
                Upload Different File
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className="flex-[2] px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importing...' : `Import ${parsedRows.length} Members`}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
