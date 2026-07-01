'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export const AddProjectModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Design');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    try {
      const res = await fetch('/api/projects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, genre: type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create project');
      }
      toast.success(`Project "${name}" created`);
      window.dispatchEvent(new CustomEvent('project-created'));
      onClose();
      setName('');
      setType('Design');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Project">
      <div className="space-y-4">
        <Input label="Project Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <select className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700" value={type} onChange={(e)=>setType(e.target.value)}>
          <option>Design</option>
          <option>Music Production</option>
          <option>Film Production</option>
        </select>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddProjectModal;


