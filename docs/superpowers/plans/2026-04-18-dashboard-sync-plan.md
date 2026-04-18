# Dashboard Sync & Personalized Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a unified, project-synced dashboard experience with a global project selector and personalized views for members and guests.

**Architecture:**

1. **Project Context**: A global React provider to manage the active project and user's relationship to it.
2. **Global Header**: A new shared component for the project selector.
3. **UI Unification**: Consolidate sidebar and dashboard tabs.

**Tech Stack:** Next.js (App Router), Supabase, Framer Motion, Tailwind CSS.

---

### Task 1: Create Global Project Context

**Files:**

- Create: `src/app/lib/projectContext.tsx`
- Modify: `src/app/dashboard/admin/layout.tsx`

- [ ] **Step 1: Implement ProjectContext**

```tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './auth';

interface ProjectContextType {
  selectedProjectId: string | null;
  selectedProject: any;
  projectsList: any[];
  userRoleInProject: 'admin' | 'contributor' | 'viewer';
  setSelectedProjectId: (id: string) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [userRoleInProject, setUserRoleInProject] = useState<'admin' | 'contributor' | 'viewer'>('viewer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').eq('status', 'Active');
      if (data) {
        setProjectsList(data);
        if (!selectedProjectId && data.length > 0) setSelectedProjectId(data[0].id);
      }
      setIsLoading(false);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId || !user) return;
    const project = projectsList.find(p => p.id === selectedProjectId);
    setSelectedProject(project);

    const checkRole = async () => {
      if (user.role === 'admin') {
        setUserRoleInProject('admin');
        return;
      }
      const { data } = await supabase
        .from('project_contributors')
        .select('*')
        .eq('project_id', selectedProjectId)
        .eq('user_id', user.id);
      setUserRoleInProject(data && data.length > 0 ? 'contributor' : 'viewer');
    };
    checkRole();
  }, [selectedProjectId, projectsList, user]);

  return (
    <ProjectContext.Provider value={{ selectedProjectId, selectedProject, projectsList, userRoleInProject, setSelectedProjectId, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
```

- [ ] **Step 2: Wrap Admin Layout with ProjectProvider**

```tsx
import { ProjectProvider } from '@/lib/projectContext';
// ...
return (
  <ProjectProvider>
    <div className="flex min-h-screen bg-[#02040A]">
      <Sidebar />
      {/* ... */}
    </div>
  </ProjectProvider>
);
```

---

### Task 2: Create Global Dashboard Header

**Files:**

- Create: `src/app/components/dashboard/DashboardHeader.tsx`
- Modify: `src/app/dashboard/admin/page.tsx` (Remove local header)

- [ ] **Step 1: Implement DashboardHeader with Project Selector**
Create a premium dropdown component using Framer Motion that allows switching `selectedProjectId`.

- [ ] **Step 2: Integrate into Layout**
Place `DashboardHeader` at the top of the main content area in the layout.

---

### Task 3: Isolate Web3 Demo Tab

**Files:**

- Modify: `src/app/dashboard/admin/page.tsx`
- Modify: `src/app/components/Navbar.tsx`

- [ ] **Step 1: Add 'demo' tab to TABS array in page.tsx**

```tsx
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'management', label: 'Management', icon: '⚙️' },
  { id: 'transactions', label: 'Transactions', icon: '🔁' },
  { id: 'reports', label: 'Reports', icon: '📄' },
  { id: 'demo', label: 'Web3 Demo', icon: '✨' },
] as const;
```

- [ ] **Step 2: Render RevenueDistribution component only in 'demo' tab**

```tsx
{activeTab === 'demo' && (
  <RevenueDistribution />
)}
```

- [ ] **Step 3: Update Navbar "Web3 Demo" button**
Use `window.dispatchEvent` to switch the tab to 'demo' when the button is clicked.

---

### Task 4: Fix Sidebar & Missing Routes

**Files:**

- Modify: `src/app/components/dashboard/Sidebar.tsx`
- Create: `src/app/dashboard/admin/settings/page.tsx`
- Create: `src/app/dashboard/admin/projects/page.tsx`

- [ ] **Step 1: Create Stub Pages**
Prevent 404s by adding minimal pages for Settings and Projects management.

- [ ] **Step 2: Update Sidebar links**
Ensure they point to the new routes.

---

### Task 5: Personalized View Implementation

**Files:**

- Modify: `src/app/dashboard/admin/page.tsx`

- [ ] **Step 1: Conditionals based on userRoleInProject**
Hide "Distribute Revenue" logic for 'Viewer' or 'Contributor' roles.
Show "My Slice" analytics for 'Contributor' roles.
