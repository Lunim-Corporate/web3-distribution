import { Suspense } from 'react';
import { AdminProjectsClient } from './AdminProjectsClient';

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600 dark:text-gray-400">Loading projects...</div>}>
      <AdminProjectsClient />
    </Suspense>
  );
}
