'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { quickLoginAsAdmin, quickLoginAsCreator, quickLoginAsContributor, setupAdminDemo } from '@/lib/adminSetup';
import { toast } from 'react-hot-toast';

interface SetupResults {
  totalUsers: number;
}

export const DemoSetup: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupResults, setSetupResults] = useState<SetupResults | null>(null);

  const handleSetupDemo = () => {
    void (async () => {
      try {
        const results = await setupAdminDemo();
        setSetupResults({ totalUsers: results.totalUsers });
        setIsSetupComplete(true);
        toast.success(`Demo setup complete! Created ${results.totalUsers} users.`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to setup demo users');
      }
    })();
  };

  const handleQuickLogin = (role: 'admin' | 'creator' | 'contributor') => {
    void (async () => {
      try {
        switch (role) {
          case 'admin':
            await quickLoginAsAdmin();
            break;
          case 'creator':
            await quickLoginAsCreator();
            break;
          case 'contributor':
            await quickLoginAsContributor();
            break;
        }
        toast.success('Signed in!');
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Wallet sign-in failed');
      }
    })();
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">🚀 Demo Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Quick setup for testing the Creative Rights Tracker
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {!isSetupComplete ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What this will create:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 1 Admin user (admin@risidio.com)</li>
                <li>• 2 Creator users</li>
                <li>• 3 Contributor users</li>
                <li>• Sample project data</li>
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Setup Complete!
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Created {setupResults?.totalUsers} demo users
              </p>
            </div>
          )}
          
          <Button onClick={handleSetupDemo} className="w-full" variant={isSetupComplete ? "secondary" : "primary"}>
            {isSetupComplete ? "Run Setup Again" : "Setup Demo Data"}
          </Button>

          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Quick Login As:
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => handleQuickLogin('admin')}
                variant="primary"
                className="w-full justify-between"
              >
                <span>Admin User</span>
                <Badge variant="default">Full Access</Badge>
              </Button>
              
              <Button
                onClick={() => handleQuickLogin('creator')}
                variant="secondary"
                className="w-full justify-between"
              >
                <span>Creator User</span>
                <Badge variant="info">Project Management</Badge>
              </Button>
              
              <Button
                onClick={() => handleQuickLogin('contributor')}
                variant="ghost"
                className="w-full justify-between"
              >
                <span>Contributor User</span>
                <Badge variant="warning">Limited Access</Badge>
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                💡 <strong>Admin Features:</strong> User management, role assignment, payment processing, full dashboard access
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
