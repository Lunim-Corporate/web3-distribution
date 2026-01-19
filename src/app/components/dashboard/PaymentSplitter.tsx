'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatPercentage, calculatePaymentSplit } from '@/lib/utils';
import { mockProjects, getProjectContributors } from '@/data/mockData';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { RevenueDistributionService } from '@/lib/services/RevenueDistributionService';
import { toast } from 'react-hot-toast';

export const PaymentSplitter: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [revenueSource, setRevenueSource] = useState('');
  const [calculatedSplits, setCalculatedSplits] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSmartContract, setUseSmartContract] = useState(false);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const revenueDistributionService = RevenueDistributionService.getInstance();

  const projectOptions = mockProjects.map(project => ({
    value: project.id,
    label: project.name
  }));

  const revenueSourceOptions = [
    { value: 'streaming', label: 'Streaming Royalties' },
    { value: 'licensing', label: 'Licensing Deal' },
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'performance', label: 'Performance Rights' },
    { value: 'sync', label: 'Sync Licensing' },
    { value: 'other', label: 'Other' },
  ];

  const handleCalculateSplits = () => {
    if (!selectedProject || !paymentAmount) return;

    const contributors = getProjectContributors(selectedProject);
    if (contributors.length === 0) {
      toast.error('Add contributors first');
      return;
    }
    const invalidWallet = contributors.find((c: any) => !ethers.isAddress(c.walletAddress || ''));
    if (invalidWallet) {
      toast.error('All contributors need valid wallet addresses');
      return;
    }
    const amount = parseFloat(paymentAmount);
    const splits = calculatePaymentSplit(amount, contributors);
    setCalculatedSplits(splits);
  };

  const loadRecentDistributions = async () => {
    try {
      const res = await fetch('/api/revenue');
      if (!res.ok) return;
      const data = await res.json();
      setRecentDistributions(
        data
          .filter((r: any) => r.splits && r.splits.length > 0)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      );
    } catch {
      setRecentDistributions([]);
    }
  };

  React.useEffect(() => {
    loadRecentDistributions();
  }, []);

  const handleProcessPayment = async () => {
    if (user?.role !== 'admin') {
      toast.error('You do not have permission to process payments');
      return;
    }

    if (!isConnected) {
      toast.error('Connect wallet before distributing revenue');
      return;
    }

    if (!selectedProject || !paymentAmount) {
      toast.error('Select a project and amount before sending');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Processing payment splits...');

    try {
      if (calculatedSplits.length === 0) {
        handleCalculateSplits();
      }
      if (calculatedSplits.length === 0) {
        toast.error('No splits calculated', { id: toastId });
        setIsProcessing(false);
        return;
      }

      const project = mockProjects.find(p => p.id === selectedProject);
      const amount = parseFloat(paymentAmount);
      const shares = calculatedSplits.map(split => ({
        contributorId: split.contributorId,
        contributorName: split.contributorName,
        walletAddress: split.walletAddress,
        percentage: split.percentage,
        amount: Number(split.amount),
      }));

      const result = await revenueDistributionService.distributeRevenue({
        projectId: selectedProject,
        projectName: project?.name || 'Project',
        totalAmount: amount,
        shares,
        mode: revenueDistributionService.getMode(),
        contractAddress: project?.contractAddress,
        useSmartContract,
        revenueSource,
      });

      if (!result.success) {
        toast.error(result.errors.join(', ') || 'Failed to distribute revenue', { id: toastId });
        setIsProcessing(false);
        return;
      }

      await loadRecentDistributions();

      if (result.transactions.length > 0 && result.transactionHash) {
        toast.success(`Payment split completed! Tx: ${result.transactionHash}`, { id: toastId });
      } else {
        const reference = result.transactionHash || result.reference || 'pending';
        toast.success(`Simulated distribution (missing contract). Ref: ${reference}`, { id: toastId });
      }

      setIsModalOpen(false);
      setSelectedProject('');
      setPaymentAmount('');
      setRevenueSource('');
      setCalculatedSplits([]);
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Failed to process payment splits', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card id="payment-splitter">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Splitter</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automatically split payments based on revenue sharing agreements
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                setIsModalOpen(true);
                toast.success('Opening payment split modal...');
              }}>
                New Payment Split
              </Button>
              <Button 
                variant="success" 
                onClick={() => {
                  // Quick split with default values
                  if (mockProjects.length > 0) {
                    setSelectedProject(mockProjects[0].id);
                    setPaymentAmount('1000');
                    setRevenueSource('streaming');
                    setIsModalOpen(true);
                    toast.success('Quick split setup ready! Adjust values as needed.');
                  } else {
                    toast.error('No projects available for quick split');
                  }
                }}
              >
                Quick Split
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Recent Payment Splits</h4>
            {recentDistributions.map((revenue:any) => (
              <div key={revenue.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {revenue.projectName}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {revenue.source} • {new Date(revenue.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(revenue.amount)}
                    </p>
                    <Badge variant={revenue.status === 'Paid' ? 'success' : revenue.status === 'Processing' ? 'info' : 'warning'}>
                      {revenue.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Splits:</h6>
                  {revenue.splits?.map((split: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {split.contributorName} ({formatPercentage(split.percentage)})
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(split.amount)}
                        </span>
                        <Badge variant={split.status === 'Paid' ? 'success' : split.status === 'Processing' ? 'info' : 'warning'} className="text-xs">
                          {split.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Split Modal */}
      
      {/* Simple test modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calculate Payment Split</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose a project</option>
                    {projectOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Revenue Source
                  </label>
                  <select
                    value={revenueSource}
                    onChange={(e) => setRevenueSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose source</option>
                    {revenueSourceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount in ETH"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="useSmartContract"
                  checked={useSmartContract}
                  onChange={(e) => setUseSmartContract(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="useSmartContract" className="text-sm text-gray-700 dark:text-gray-300">
                  Use Smart Contract for distribution (recommended)
                </label>
              </div>

              {selectedProject && getProjectContributors(selectedProject).length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Add contributors first to split payments.
                </div>
              )}

              <Button
                onClick={handleCalculateSplits}
                disabled={
                  !selectedProject ||
                  !paymentAmount ||
                  getProjectContributors(selectedProject).length === 0
                }
                className="w-full"
              >
                Calculate Splits
              </Button>

              {calculatedSplits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Calculated Payment Splits:</h4>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {calculatedSplits.map((split, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                              {split.contributorName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {split.contributorName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatPercentage(split.percentage)} share
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(split.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(parseFloat(paymentAmount))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 items-center">
                    <Button 
                      variant="secondary" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <div className="flex-1">
                      <Button
                        onClick={handleProcessPayment}
                        className="w-full"
                        disabled={
                          user?.role !== 'admin' ||
                          isProcessing ||
                          !isConnected ||
                          getProjectContributors(selectedProject).length === 0
                        }
                        isLoading={isProcessing}
                        title={
                          !isConnected ? 'Connect wallet first' :
                          getProjectContributors(selectedProject).length === 0 ? 'Add contributors first' :
                          user?.role !== 'admin' ? 'You need admin access' : 
                          undefined
                        }
                      >
                        {isProcessing ? 'Processing...' : 'Send Payment'}
                      </Button>
                      {!isConnected && (
                        <div className="mt-1">
                          <Badge variant="warning">Connect wallet first</Badge>
                        </div>
                      )}
                      {isConnected && user?.role !== 'admin' && (
                        <div className="mt-1">
                          <Badge variant="warning">You need admin access</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </>
  );
};
