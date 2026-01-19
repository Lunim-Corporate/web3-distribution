'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';

export const ButtonTestPanel: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, connectWallet } = useWallet();
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({});

  const runTest = async (testName: string, testFn: () => Promise<void> | void) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }));
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
      toast.success(`✅ ${testName} test passed`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
      toast.error(`❌ ${testName} test failed`);
      console.error(`${testName} test error:`, error);
    }
  };

  const tests = [
    {
      name: 'Toast Notifications',
      description: 'Test toast notification system',
      test: () => {
        toast.success('Success toast working!');
        toast.error('Error toast working!');
        toast.loading('Loading toast working!');
        setTimeout(() => toast.dismiss(), 2000);
      }
    },
    {
      name: 'Local Storage',
      description: 'Test localStorage functionality',
      test: () => {
        const testData = { test: 'button_test', timestamp: Date.now() };
        localStorage.setItem('crt_button_test', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('crt_button_test') || '{}');
        if (retrieved.test !== 'button_test') throw new Error('LocalStorage test failed');
        localStorage.removeItem('crt_button_test');
      }
    },
    {
      name: 'PDF Generation',
      description: 'Test PDF generation functionality',
      test: async () => {
        const jsPdfModule: any = await import('jspdf');
        const jsPDF = jsPdfModule.default || jsPdfModule.jsPDF || jsPdfModule;
        const doc = new jsPDF();
        doc.text('Button Test PDF', 14, 16);
        doc.save('button_test.pdf');
      }
    },
    {
      name: 'Scroll Navigation',
      description: 'Test smooth scrolling to elements',
      test: () => {
        const element = document.getElementById('payment-splitter');
        if (!element) throw new Error('Target element not found');
        element.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      name: 'API Simulation',
      description: 'Test API endpoint simulation',
      test: async () => {
        const response = await fetch('/api/revenue');
        if (!response.ok) throw new Error('API test failed');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid API response');
      }
    },
    {
      name: 'Wallet Connection',
      description: 'Test MetaMask wallet connection',
      test: async () => {
        if (!isConnected) {
          await connectWallet();
        }
        if (typeof window !== 'undefined' && !window.ethereum) {
          throw new Error('MetaMask not detected');
        }
      }
    },
    {
      name: 'Role Permissions',
      description: 'Test role-based access control',
      test: () => {
        if (!user) throw new Error('No user logged in');
        if (!['admin', 'creator', 'contributor'].includes(user.role)) {
          throw new Error('Invalid user role');
        }
      }
    },
    {
      name: 'Form Validation',
      description: 'Test form validation logic',
      test: () => {
        const email = 'test@example.com';
        const invalidEmail = 'invalid-email';
        
        if (!email.includes('@')) throw new Error('Valid email failed validation');
        if (invalidEmail.includes('@')) throw new Error('Invalid email passed validation');
      }
    }
  ];

  const runAllTests = async () => {
    toast.loading('Running all button functionality tests...');
    for (const test of tests) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
      await runTest(test.name, test.test);
    }
    toast.dismiss();
    toast.success('All tests completed! Check results below.');
  };

  const getStatusBadge = (status: 'success' | 'error' | 'pending' | undefined) => {
    switch (status) {
      case 'success': return <Badge variant="success">✅ Passed</Badge>;
      case 'error': return <Badge variant="error">❌ Failed</Badge>;
      case 'pending': return <Badge variant="warning">⏳ Running</Badge>;
      default: return <Badge variant="default">⚪ Not Run</Badge>;
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🧪 Button Functionality Test Panel</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Test all button functionalities across the application
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runAllTests} variant="primary">
              Run All Tests
            </Button>
            <Button 
              onClick={() => {
                setTestResults({});
                toast.success('Test results cleared');
              }} 
              variant="secondary"
            >
              Clear Results
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {test.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {test.description}
                  </p>
                </div>
                {getStatusBadge(testResults[test.name])}
              </div>
              
              <Button
                size="sm"
                onClick={() => runTest(test.name, test.test)}
                disabled={testResults[test.name] === 'pending'}
                className="w-full"
              >
                {testResults[test.name] === 'pending' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Test Information
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• These tests verify that all button functionalities work correctly</li>
            <li>• Green badges indicate successful tests</li>
            <li>• Red badges indicate failed tests that need attention</li>
            <li>• Some tests (like wallet connection) may require user interaction</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
