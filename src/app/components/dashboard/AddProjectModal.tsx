'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export const AddProjectModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Design');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_project',
          payload: {
            name: name.trim(),
            description: description.trim(),
            type,
            status: 'active',
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create project');

      toast.success(`Project "${name}" created`);
      setName('');
      setDescription('');
      setType('Design');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Project creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Project">
      <div className="space-y-4">
        <Input label="Project Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <Input label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
        <select className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={type} onChange={(e)=>setType(e.target.value)}>
          <option>Design</option>
          <option>Music Production</option>
          <option>Film Production</option>
        </select>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddProjectModal;

