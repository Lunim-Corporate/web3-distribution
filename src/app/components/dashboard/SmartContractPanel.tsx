'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, truncateAddress } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { ContractService } from '@/lib/services/ContractService';
import { mockContracts } from '@/data/mockData';
import { toast } from 'react-hot-toast';

export const SmartContractPanel: React.FC = () => {
  const { user } = useAuth();
  const { account, isConnected, isConnecting, chainId, balance, connectWallet, disconnectWallet, switchNetwork, getNetworkName } = useWallet();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const contractService = ContractService.getInstance();

  const handleContractInteraction = async (functionName: string, contractAddress?: string) => {
    if (!isConnected) {
      toast.error('Please link your account first');
      return;
    }
    
    const isReadFunction = functionName === 'getProject' || functionName === 'getContributorShare';
    
    if (!isReadFunction && user?.role !== 'admin') {
      toast.error('You do not have permission to execute write functions');
      return;
    }
    
    setIsExecuting(true);
    const toastId = toast.loading(`Executing ${functionName}...`);
    
    try {
      const contract = selectedContract || mockContracts[0];
      const address = contractAddress || contract.address;
      
      const isDeployed = await contractService.isContractDeployed(address);
      if (!isDeployed) {
        toast.error('Contract not deployed at this address', { id: toastId });
        setIsExecuting(false);
        return;
      }

      if (isReadFunction) {
        toast.success(`${functionName} called successfully!`, { id: toastId });
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success(`${functionName} transaction submitted!`, { id: toastId });
      }
      
      console.log(`Contract function ${functionName} called on ${address}`);
    } catch (error: any) {
      console.error('Contract interaction failed:', error);
      toast.error(error.message || `Failed to execute ${functionName}`, { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Smart Contracts</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and interact with deployed smart contracts
              </p>
            </div>
            <div className="flex space-x-2">
              {!isConnected ? (
                <Button onClick={connectWallet} size="sm" isLoading={isConnecting}>
                  {isConnecting ? 'Linking...' : 'Link Account'}
                </Button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{truncateAddress(account || '')}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>{balance} ETH</div>
                    <div>{getNetworkName(chainId)}</div>
                  </div>
                  <Button onClick={disconnectWallet} size="sm" variant="ghost">
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {mockContracts.map((contract) => (
              <div
                key={contract.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {contract.name}
                      </h4>
                      <Badge variant={contract.isActive ? 'success' : 'default'}>
                        {contract.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="info">
                        {contract.network}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Contract Address</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {truncateAddress(contract.address)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contract.totalTransactions}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(contract.totalValue)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {contract.functions.slice(0, 3).map((func, index) => (
                        <button
                          key={index}
                          onClick={() => handleContractInteraction(func.name)}
                          disabled={isExecuting}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            func.type === 'write'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {func.name}() {func.type === 'write' ? '✍️' : '👁️'}
                        </button>
                      ))}
                      {contract.functions.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{contract.functions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewContract(contract)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://polygonscan.com/address/${contract.address}`, '_blank')}
                    >
                      View on Explorer
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleContractInteraction('distributeRevenue', contract.address)}
                      disabled={user?.role !== 'admin' || isExecuting}
                      isLoading={isExecuting}
                    >
                      {isExecuting ? 'Processing...' : 'Split Revenue'}
                    </Button>
                    {user?.role !== 'admin' && (
                      <span className="text-[10px] text-amber-500">You need admin access</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contract Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContract?.name}
        size="xl"
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contract Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-mono">{truncateAddress(selectedContract.address)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network:</span>
                    <span>{selectedContract.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span>{selectedContract.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deployed:</span>
                    <span>{new Date(selectedContract.deployedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transactions:</span>
                    <span className="font-semibold">{selectedContract.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Value:</span>
                    <span className="font-semibold">{formatCurrency(selectedContract.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={selectedContract.isActive ? 'success' : 'default'}>
                      {selectedContract.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Available Functions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedContract.functions.map((func: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {func.name}()
                      </span>
                      <Badge variant={func.type === 'write' ? 'warning' : 'info'}>
                        {func.type}
                      </Badge>
                    </div>
                    
                    {func.inputs && func.inputs.length > 0 && (
                      <div className="text-xs text-gray-500 mb-2">
                        Inputs: {func.inputs.map((input: any) => `${input.name}: ${input.type}`).join(', ')}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant={func.type === 'write' ? 'primary' : 'secondary'}
                      onClick={() => handleContractInteraction(func.name)}
                      disabled={isExecuting}
                      isLoading={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? 'Processing...' : (func.type === 'write' ? 'Execute' : 'Call')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
