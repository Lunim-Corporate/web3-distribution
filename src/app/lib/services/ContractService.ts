import { ethers } from 'ethers';
import { BaseService } from './BaseService';
import { ContractCallRequest, ProjectDetails, TransactionReceipt } from './types';
import { ErrorHandler } from './ErrorHandler';
import { TransactionService } from './TransactionService';

export class ContractService extends BaseService {
  private static instance: ContractService;
  private transactionService: TransactionService;
  private contracts: Map<string, ethers.Contract> = new Map();

  private constructor() {
    super();
    this.transactionService = TransactionService.getInstance();
  }

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  async loadContract(
    address: string,
    abi: any[]
  ): Promise<ethers.Contract> {
    try {
      await this.ensureConnection();

      const key = `${address.toLowerCase()}`;
      
      if (this.contracts.has(key)) {
        return this.contracts.get(key)!;
      }

      const signer = await this.getSigner();
      const contract = new ethers.Contract(address, abi, signer);
      
      this.contracts.set(key, contract);
      return contract;
    } catch (error) {
      throw this.handleError(error, 'Failed to load contract');
    }
  }

  async callContractFunction(
    request: ContractCallRequest,
    abi: any[]
  ): Promise<any> {
    try {
      const contract = await this.loadContract(request.contractAddress, abi);
      
      const func = contract.getFunction(request.functionName);
      if (!func) {
        ErrorHandler.throwError(
          new Error(`Function ${request.functionName} not found`),
          'callContractFunction'
        );
      }

      const result = await func(...request.args);
      return result;
    } catch (error) {
      throw this.handleError(error, `Failed to call ${request.functionName}`);
    }
  }

  async executeContractFunction(
    request: ContractCallRequest,
    abi: any[]
  ): Promise<TransactionReceipt> {
    try {
      const contract = await this.loadContract(request.contractAddress, abi);
      
      const func = contract.getFunction(request.functionName);
      if (!func) {
        ErrorHandler.throwError(
          new Error(`Function ${request.functionName} not found`),
          'executeContractFunction'
        );
      }

      const txOptions: any = {};
      if (request.value) {
        txOptions.value = ethers.parseEther(request.value);
      }

      const tx = await func(...request.args, txOptions);
      
      const description = `Contract: ${request.functionName}`;
      return await this.transactionService.trackTransaction(tx.hash, description);
    } catch (error) {
      throw this.handleError(error, `Failed to execute ${request.functionName}`);
    }
  }

  async distributeRevenue(
    contractAddress: string,
    abi: any[],
    projectId: string,
    amount: string
  ): Promise<TransactionReceipt> {
    try {
      const request: ContractCallRequest = {
        contractAddress,
        functionName: 'distributeRevenue',
        args: [projectId],
        value: amount,
      };

      return await this.executeContractFunction(request, abi);
    } catch (error) {
      throw this.handleError(error, 'Failed to distribute revenue');
    }
  }

  async getProjectDetails(
    contractAddress: string,
    abi: any[],
    projectId: string
  ): Promise<ProjectDetails> {
    try {
      const request: ContractCallRequest = {
        contractAddress,
        functionName: 'getProject',
        args: [projectId],
      };

      const result = await this.callContractFunction(request, abi);
      
      return {
        projectId,
        name: result.name || '',
        totalRevenue: ethers.formatEther(result.totalRevenue || 0),
        contributors: result.contributors || [],
        shares: result.shares || [],
        isActive: result.isActive || false,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get project details');
    }
  }

  async getContributorShare(
    contractAddress: string,
    abi: any[],
    projectId: string,
    contributorAddress: string
  ): Promise<string> {
    try {
      const request: ContractCallRequest = {
        contractAddress,
        functionName: 'getContributorShare',
        args: [projectId, contributorAddress],
      };

      const result = await this.callContractFunction(request, abi);
      return result.toString();
    } catch (error) {
      throw this.handleError(error, 'Failed to get contributor share');
    }
  }

  async registerProject(
    contractAddress: string,
    abi: any[],
    projectId: string,
    contributors: string[],
    shares: number[]
  ): Promise<TransactionReceipt> {
    try {
      if (contributors.length !== shares.length) {
        ErrorHandler.throwError(
          new Error('Contributors and shares length mismatch'),
          'registerProject'
        );
      }

      const totalShares = shares.reduce((sum, share) => sum + share, 0);
      if (totalShares !== 100) {
        ErrorHandler.throwError(
          new Error('Shares must total 100%'),
          'registerProject'
        );
      }

      const request: ContractCallRequest = {
        contractAddress,
        functionName: 'registerProject',
        args: [projectId, contributors, shares],
      };

      return await this.executeContractFunction(request, abi);
    } catch (error) {
      throw this.handleError(error, 'Failed to register project');
    }
  }

  async estimateGas(
    request: ContractCallRequest,
    abi: any[]
  ): Promise<string> {
    try {
      const contract = await this.loadContract(request.contractAddress, abi);
      
      const func = contract.getFunction(request.functionName);
      if (!func) {
        ErrorHandler.throwError(
          new Error(`Function ${request.functionName} not found`),
          'estimateGas'
        );
      }

      const txOptions: any = {};
      if (request.value) {
        txOptions.value = ethers.parseEther(request.value);
      }

      const gasEstimate = await func.estimateGas(...request.args, txOptions);
      return gasEstimate.toString();
    } catch (error) {
      throw this.handleError(error, 'Failed to estimate gas');
    }
  }

  clearCache(): void {
    this.contracts.clear();
  }

  async isContractDeployed(address: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const code = await this.provider!.getCode(address);
      return code !== '0x';
    } catch (error) {
      console.error('Failed to check contract deployment:', error);
      return false;
    }
  }
}
