'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

type Contract = { id: string; projectName: string; terms: string; status: 'Active'|'Draft'|'Signed' };

export const TraditionalContractsPanel: React.FC = () => {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [projectName, setProjectName] = React.useState('');
  const [terms, setTerms] = React.useState('');

  React.useEffect(()=>{
    try { setContracts(JSON.parse(localStorage.getItem('crt_trad_contracts')||'[]')); } catch {}
  },[]);

  const save = (list: Contract[]) => {
    setContracts(list);
    try { localStorage.setItem('crt_trad_contracts', JSON.stringify(list)); } catch {}
  };

  const add = () => {
    if (!projectName.trim() || !terms.trim()) { toast.error('Project and terms required'); return; }
    const c: Contract = { id: Date.now().toString(), projectName, terms, status: 'Draft' };
    save([c, ...contracts]);
    setProjectName(''); setTerms(''); toast.success('Contract drafted');
  };

  const sign = (id: string) => {
    const updated = contracts.map(c => c.id === id ? { ...c, status: 'Signed' as const } : c);
    save(updated); toast.success('Contract signed');
  };

  const exportPdf = async (c: Contract) => {
    const jsPdfModule: any = await import('jspdf');
    const jsPDF = jsPdfModule.default || jsPdfModule.jsPDF || jsPdfModule;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('Contract', 14, 16);
    doc.setFontSize(12);
    doc.text(`Project: ${c.projectName}`, 14, 30);
    doc.text(`Status: ${c.status}`, 14, 40);
    doc.text('Terms:', 14, 55);
    const split = doc.splitTextToSize(c.terms, 180);
    doc.text(split, 14, 65);
    doc.save(`${c.projectName.replace(/\s+/g,'_')}_contract.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traditional Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input label="Project" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
          <Input label="Terms" value={terms} onChange={(e)=>setTerms(e.target.value)} />
          <Button onClick={add}>Draft Contract</Button>
        </div>
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{c.projectName}</p>
                  <p className="text-xs text-gray-500">{c.terms}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{c.status}</span>
                  {c.status !== 'Signed' && <Button size="sm" onClick={()=>sign(c.id)}>Sign</Button>}
                  <Button size="sm" variant="secondary" onClick={()=>exportPdf(c)}>Export PDF</Button>
                </div>
              </div>
            </div>
          ))}
          {contracts.length===0 && <p className="text-sm text-gray-500">No traditional contracts yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default TraditionalContractsPanel;


