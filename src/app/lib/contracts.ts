export const NETWORK_CONFIG = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com',
  },
  amoy: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: process.env.NEXT_PUBLIC_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://amoy.polygonscan.com',
  },
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: process.env.NEXT_PUBLIC_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com/',
    blockExplorer: 'https://mumbai.polygonscan.com',
  },
  hardhat: {
    chainId: 1337,
    name: 'Hardhat Local',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: '',
  },
};

export const CONTRACT_ADDRESSES = {
  mainnet: {
    ProjectRegistry: process.env.NEXT_PUBLIC_MAINNET_PROJECT_REGISTRY || '',
    RevenueDistributor: process.env.NEXT_PUBLIC_MAINNET_REVENUE_DISTRIBUTOR || '',
  },
  polygon: {
    ProjectRegistry: process.env.NEXT_PUBLIC_POLYGON_PROJECT_REGISTRY || '',
    RevenueDistributor: process.env.NEXT_PUBLIC_POLYGON_REVENUE_DISTRIBUTOR || '',
  },
  amoy: {
    ProjectRegistry: process.env.NEXT_PUBLIC_AMOY_PROJECT_REGISTRY || '',
    RevenueDistributor: process.env.NEXT_PUBLIC_AMOY_REVENUE_DISTRIBUTOR || '',
  },
  mumbai: {
    ProjectRegistry: process.env.NEXT_PUBLIC_MUMBAI_PROJECT_REGISTRY || '',
    RevenueDistributor: process.env.NEXT_PUBLIC_MUMBAI_REVENUE_DISTRIBUTOR || '',
  },
  hardhat: {
    ProjectRegistry: '',
    RevenueDistributor: '',
  },
};

export const FEATURE_FLAGS = {
  USE_SMART_CONTRACT: process.env.NEXT_PUBLIC_USE_SMART_CONTRACT === 'true',
  ENABLE_BATCH_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_BATCH_PAYMENTS !== 'false',
  ENABLE_GAS_ESTIMATION: process.env.NEXT_PUBLIC_ENABLE_GAS_ESTIMATION !== 'false',
  DEFAULT_NETWORK: (process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mumbai') as keyof typeof NETWORK_CONFIG,
};

export const getContractAddress = (
  contractName: 'ProjectRegistry' | 'RevenueDistributor',
  network: keyof typeof CONTRACT_ADDRESSES = FEATURE_FLAGS.DEFAULT_NETWORK
): string => {
  return CONTRACT_ADDRESSES[network][contractName];
};

export const getNetworkConfig = (
  network: keyof typeof NETWORK_CONFIG = FEATURE_FLAGS.DEFAULT_NETWORK
) => {
  return (
    NETWORK_CONFIG[network] ||
    NETWORK_CONFIG[FEATURE_FLAGS.DEFAULT_NETWORK] ||
    NETWORK_CONFIG.mumbai
  );
};

export const isContractDeployed = (
  contractName: 'ProjectRegistry' | 'RevenueDistributor',
  network: keyof typeof CONTRACT_ADDRESSES = FEATURE_FLAGS.DEFAULT_NETWORK
): boolean => {
  const address = getContractAddress(contractName, network);
  return address !== '' && address !== undefined;
};

export const PROJECT_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProjectDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "contributors",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "shares",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProjectRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProjectUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      }
    ],
    "name": "deactivateProject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProjectIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      }
    ],
    "name": "getProject",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "projectId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "address[]",
            "name": "contributors",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "shares",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "totalRevenue",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct IProjectRegistry.Project",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "incrementTotalRevenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      }
    ],
    "name": "isProjectActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "contributors",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "shares",
        "type": "uint256[]"
      }
    ],
    "name": "registerProject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "contributors",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "shares",
        "type": "uint256[]"
      }
    ],
    "name": "updateProject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const REVENUE_DISTRIBUTOR_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_projectRegistry",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "contributor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ContributorPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RevenueDistributed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      }
    ],
    "name": "distributeRevenue",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "contributor",
        "type": "address"
      }
    ],
    "name": "getContributorBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "contributor",
        "type": "address"
      }
    ],
    "name": "getContributorShare",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectId",
        "type": "string"
      }
    ],
    "name": "getProjectTotalDistributed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "projectRegistry",
    "outputs": [
      {
        "internalType": "contract IProjectRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_projectRegistry",
        "type": "address"
      }
    ],
    "name": "updateProjectRegistry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawContributorBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];
