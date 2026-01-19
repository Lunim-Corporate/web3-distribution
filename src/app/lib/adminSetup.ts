// Admin setup utilities for the Creative Rights Tracker

import { setAuthCookie } from '@/lib/authCookieClient';

export const createAdminUser = () => {
  const adminUser = {
    id: 'admin_001',
    name: 'Admin User',
    email: 'admin@risidio.com',
    role: 'admin' as const
  };

  try {
    // Add to users list
    const existingUsers = JSON.parse(localStorage.getItem('crt_users') || '[]');
    const userExists = existingUsers.find((u: any) => u.email === adminUser.email);
    
    if (!userExists) {
      localStorage.setItem('crt_users', JSON.stringify([adminUser, ...existingUsers]));
    }

    // Set as current user
    localStorage.setItem('crt_user', JSON.stringify(adminUser));
    
    // Set cookie for middleware
    setAuthCookie(adminUser);
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return null;
  }
};

export const createDemoUsers = () => {
  const demoUsers = [
    {
      id: 'creator_001',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'creator' as const
    },
    {
      id: 'creator_002',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'creator' as const
    },
    {
      id: 'contributor_001',
      name: 'Mike Rodriguez',
      email: 'mike@example.com',
      role: 'contributor' as const
    },
    {
      id: 'contributor_002',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      role: 'contributor' as const
    },
    {
      id: 'contributor_003',
      name: 'David Kim',
      email: 'david@example.com',
      role: 'contributor' as const
    }
  ];

  try {
    const existingUsers = JSON.parse(localStorage.getItem('crt_users') || '[]');
    const newUsers = demoUsers.filter(demo => 
      !existingUsers.find((existing: any) => existing.email === demo.email)
    );
    
    if (newUsers.length > 0) {
      localStorage.setItem('crt_users', JSON.stringify([...existingUsers, ...newUsers]));
    }
    
    return newUsers;
  } catch (error) {
    console.error('Error creating demo users:', error);
    return [];
  }
};

export const setupAdminDemo = () => {
  const admin = createAdminUser();
  const demoUsers = createDemoUsers();
  
  return {
    admin,
    demoUsers,
    totalUsers: demoUsers.length + (admin ? 1 : 0)
  };
};

// Quick login functions for different roles
export const quickLoginAsAdmin = () => {
  const adminUser = createAdminUser();
  if (adminUser) {
    window.location.reload();
  }
  return adminUser;
};

export const quickLoginAsCreator = () => {
  const creatorUser = {
    id: 'creator_demo',
    name: 'Demo Creator',
    email: 'creator@demo.com',
    role: 'creator' as const
  };

  try {
    localStorage.setItem('crt_user', JSON.stringify(creatorUser));
    setAuthCookie(creatorUser);
    window.location.reload();
    return creatorUser;
  } catch (error) {
    console.error('Error logging in as creator:', error);
    return null;
  }
};

export const quickLoginAsContributor = () => {
  const contributorUser = {
    id: 'contributor_demo',
    name: 'Demo Contributor',
    email: 'contributor@demo.com',
    role: 'contributor' as const
  };

  try {
    localStorage.setItem('crt_user', JSON.stringify(contributorUser));
    setAuthCookie(contributorUser);
    window.location.reload();
    return contributorUser;
  } catch (error) {
    console.error('Error logging in as contributor:', error);
    return null;
  }
};
