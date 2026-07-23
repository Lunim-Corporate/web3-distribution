export const demoProjects = [
  {
    id: 'demo-project-1',
    name: 'Neon Requiem',
    genre: 'Sci-Fi Cyberpunk',
    description: 'A cyberpunk thriller following a rogue hacker in Neo-Seoul.',
    poster_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    contract_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    network: 'Base Sepolia',
    status: 'active',
    total_distributed: 5.5,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-project-2',
    name: 'The Salt Coast',
    genre: 'Drama / Mystery',
    description: 'A quiet mystery set in a rugged coastal town.',
    poster_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    contract_address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    network: 'Base Sepolia',
    status: 'active',
    total_distributed: 3.0,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const demoHolders = [
  // Neon Requiem (demo-project-1)
  {
    id: 'holder-1',
    project_id: 'demo-project-1',
    full_name: 'Aria Vance',
    role: 'Director',
    percentage: 25,
    wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    email: 'aria@lunim.io',
    user_id: 'user-aria',
    avatar_initials: 'AV',
    total_received: 1.375
  },
  {
    id: 'holder-2',
    project_id: 'demo-project-1',
    full_name: 'Marcus Thorne',
    role: 'Producer',
    percentage: 20,
    wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    email: 'marcus@lunim.io',
    user_id: 'user-marcus',
    avatar_initials: 'MT',
    total_received: 1.1
  },
  {
    id: 'holder-3',
    project_id: 'demo-project-1',
    full_name: 'Priya Patel',
    role: 'Composer',
    percentage: 15,
    wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    email: 'priya@lunim.io',
    user_id: 'user-priya',
    avatar_initials: 'PP',
    total_received: 0.825
  },
  {
    id: 'holder-4',
    project_id: 'demo-project-1',
    full_name: 'Theo Vance',
    role: 'Writer',
    percentage: 15,
    wallet_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    email: 'theo@lunim.io',
    user_id: 'user-theo',
    avatar_initials: 'TV',
    total_received: 0.825
  },
  {
    id: 'holder-5',
    project_id: 'demo-project-1',
    full_name: 'Simone de Beauvoir',
    role: 'Editor',
    percentage: 15,
    wallet_address: '0x9965507D1a05cc262745c0A9e00662607992931D',
    email: 'simone@lunim.io',
    user_id: 'user-simone',
    avatar_initials: 'SB',
    total_received: 0.825
  },
  {
    id: 'holder-6',
    project_id: 'demo-project-1',
    full_name: 'Jeevesh Singale',
    role: 'Actor',
    percentage: 5,
    wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE',
    email: 'jeevesh039@gmail.com',
    user_id: 'user-jeevesh',
    avatar_initials: 'JS',
    total_received: 0.275
  },
  {
    id: 'holder-7',
    project_id: 'demo-project-1',
    full_name: 'Pete Tabb',
    role: 'Actor',
    percentage: 5,
    wallet_address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    email: 'pete@tabb.cc',
    user_id: 'user-pete',
    avatar_initials: 'PT',
    total_received: 0.275
  },

  // The Salt Coast (demo-project-2)
  {
    id: 'holder-8',
    project_id: 'demo-project-2',
    full_name: 'Aria Vance',
    role: 'Director',
    percentage: 40,
    wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    email: 'aria@lunim.io',
    user_id: 'user-aria',
    avatar_initials: 'AV',
    total_received: 1.2
  },
  {
    id: 'holder-9',
    project_id: 'demo-project-2',
    full_name: 'Marcus Thorne',
    role: 'Producer',
    percentage: 30,
    wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    email: 'marcus@lunim.io',
    user_id: 'user-marcus',
    avatar_initials: 'MT',
    total_received: 0.9
  },
  {
    id: 'holder-10',
    project_id: 'demo-project-2',
    full_name: 'Jeevesh Singale',
    role: 'Actor',
    percentage: 30,
    wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE',
    email: 'jeevesh039@gmail.com',
    user_id: 'user-jeevesh',
    avatar_initials: 'JS',
    total_received: 0.9
  }
];

export const demoTransactions = [
  {
    id: 'tx-1',
    project_id: 'demo-project-1',
    tx_hash: '0x5b38da6a701c568545dcfcb03fcb875f56beddc4000000000000000000000001',
    sender_address: '0x0000000000000000000000000000000000000000',
    total_amount_eth: 2.5,
    status: 'confirmed',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    is_demo: true,
    transaction_splits: [
      { id: 'split-1', rights_holder_id: 'holder-1', full_name: 'Aria Vance', role: 'Director', percentage: 25, amount_eth: 0.625, wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { id: 'split-2', rights_holder_id: 'holder-2', full_name: 'Marcus Thorne', role: 'Producer', percentage: 20, amount_eth: 0.5, wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
      { id: 'split-3', rights_holder_id: 'holder-3', full_name: 'Priya Patel', role: 'Composer', percentage: 15, amount_eth: 0.375, wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
      { id: 'split-4', rights_holder_id: 'holder-4', full_name: 'Theo Vance', role: 'Writer', percentage: 15, amount_eth: 0.375, wallet_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' },
      { id: 'split-5', rights_holder_id: 'holder-5', full_name: 'Simone de Beauvoir', role: 'Editor', percentage: 15, amount_eth: 0.375, wallet_address: '0x9965507D1a05cc262745c0A9e00662607992931D' },
      { id: 'split-6', rights_holder_id: 'holder-6', full_name: 'Jeevesh Singale', role: 'Actor', percentage: 5, amount_eth: 0.125, wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE' },
      { id: 'split-7', rights_holder_id: 'holder-7', full_name: 'Pete Tabb', role: 'Actor', percentage: 5, amount_eth: 0.125, wallet_address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9' }
    ]
  },
  {
    id: 'tx-2',
    project_id: 'demo-project-1',
    tx_hash: '0x5b38da6a701c568545dcfcb03fcb875f56beddc4000000000000000000000002',
    sender_address: '0x0000000000000000000000000000000000000000',
    total_amount_eth: 3.0,
    status: 'confirmed',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    is_demo: true,
    transaction_splits: [
      { id: 'split-8', rights_holder_id: 'holder-1', full_name: 'Aria Vance', role: 'Director', percentage: 25, amount_eth: 0.75, wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { id: 'split-9', rights_holder_id: 'holder-2', full_name: 'Marcus Thorne', role: 'Producer', percentage: 20, amount_eth: 0.6, wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
      { id: 'split-10', rights_holder_id: 'holder-3', full_name: 'Priya Patel', role: 'Composer', percentage: 15, amount_eth: 0.45, wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
      { id: 'split-11', rights_holder_id: 'holder-4', full_name: 'Theo Vance', role: 'Writer', percentage: 15, amount_eth: 0.45, wallet_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' },
      { id: 'split-12', rights_holder_id: 'holder-5', full_name: 'Simone de Beauvoir', role: 'Editor', percentage: 15, amount_eth: 0.45, wallet_address: '0x9965507D1a05cc262745c0A9e00662607992931D' },
      { id: 'split-13', rights_holder_id: 'holder-6', full_name: 'Jeevesh Singale', role: 'Actor', percentage: 5, amount_eth: 0.15, wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE' },
      { id: 'split-14', rights_holder_id: 'holder-7', full_name: 'Pete Tabb', role: 'Actor', percentage: 5, amount_eth: 0.15, wallet_address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9' }
    ]
  },
  {
    id: 'tx-3',
    project_id: 'demo-project-2',
    tx_hash: '0x5b38da6a701c568545dcfcb03fcb875f56beddc4000000000000000000000003',
    sender_address: '0x0000000000000000000000000000000000000000',
    total_amount_eth: 3.0,
    status: 'confirmed',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    is_demo: true,
    transaction_splits: [
      { id: 'split-15', rights_holder_id: 'holder-8', full_name: 'Aria Vance', role: 'Director', percentage: 40, amount_eth: 1.2, wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { id: 'split-16', rights_holder_id: 'holder-9', full_name: 'Marcus Thorne', role: 'Producer', percentage: 30, amount_eth: 0.9, wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
      { id: 'split-17', rights_holder_id: 'holder-10', full_name: 'Jeevesh Singale', role: 'Actor', percentage: 30, amount_eth: 0.9, wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE' }
    ]
  }
];

export const demoActivities = [
  {
    id: 'activity-1',
    project_id: 'demo-project-1',
    action: 'distribution',
    description: '✓ Distributed 2.5000 ETH on-chain for Neon Requiem',
    timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'activity-2',
    project_id: 'demo-project-1',
    action: 'distribution',
    description: '✓ Distributed 3.0000 ETH on-chain for Neon Requiem',
    timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'activity-3',
    project_id: 'demo-project-2',
    action: 'distribution',
    description: '✓ Distributed 3.0000 ETH on-chain for The Salt Coast',
    timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'activity-4',
    project_id: 'demo-project-1',
    action: 'holder_added',
    description: '👥 Added Jeevesh Singale as Actor (5% split) to Neon Requiem',
    timestamp: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
  }
];
