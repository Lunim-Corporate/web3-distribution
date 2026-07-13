import { ethers } from 'ethers';
import { supabaseAdmin } from '../supabaseServer';
import contractData from '@/contracts/RevenueRightsFull.json';

export async function syncContractWithDatabase(projectId: string, isDemo: boolean): Promise<string | null> {
  try {
    // 1. Fetch the project and its rights holders from Supabase
    const { data: project, error: pErr } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (pErr || !project) {
      console.error('Project not found for sync:', pErr);
      return null;
    }

    const { data: holders, error: hErr } = await supabaseAdmin
      .from('rights_holders')
      .select('*')
      .eq('project_id', projectId);

    if (hErr || !holders || holders.length === 0) {
      console.warn('No rights holders found to deploy contract for project:', projectId);
      return null;
    }

    // 2. Validate that the total percentage sums to exactly 100%
    const totalPercentage = holders.reduce((sum, h) => sum + Number(h.percentage), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      console.warn(`Roster total percentage is ${totalPercentage}%, skipping on-chain deploy sync until exactly 100%`);
      return null;
    }

    // 3. Connect to the appropriate Ethereum network
    let providerUrl = '';
    let privateKey = '';

    if (isDemo) {
      providerUrl = 'http://127.0.0.1:8545';
      privateKey = process.env.DEMO_DEPLOYER_PRIVATE_KEY || '';
    } else {
      providerUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
      privateKey = process.env.DEPLOYER_PRIVATE_KEY || '';
    }

    if (!privateKey) {
      console.warn('No private key configured for deployer, skipping on-chain deployment sync.');
      return null;
    }

    // 4. Try connection. If it fails (like when the local Hardhat RPC is down on Vercel), degrade gracefully.
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(providerUrl);
      // Fast check if provider is reachable
      await provider.getNetwork();
    } catch (rpcErr) {
      console.warn(`Network provider ${providerUrl} is unreachable. Skipping contract deploy.`);
      return null;
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    // 5. Prepare constructor arguments
    const wallets: string[] = [];
    const names: string[] = [];
    const roles: string[] = [];
    const basisPoints: bigint[] = [];

    // Order of holders for deterministic remaining basis points remainder assignment
    const sortedHolders = [...holders].sort((a, b) => a.id.localeCompare(b.id));

    let bpsSum = BigInt(0);
    for (let i = 0; i < sortedHolders.length; i++) {
      const h = sortedHolders[i];
      wallets.push(h.wallet_address);
      names.push(h.full_name);
      roles.push(h.role);
      
      let bps = BigInt(Math.round(Number(h.percentage) * 100));
      if (i === sortedHolders.length - 1) {
        bps = BigInt(10000) - bpsSum; // Guarantee exact 10000 basis points sum
      } else {
        bpsSum += bps;
      }
      basisPoints.push(bps);
    }

    // 6. Deploy the RevenueRights contract
    const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, wallet);
    const contract = await factory.deploy(wallets, names, roles, basisPoints);
    await contract.waitForDeployment();
    const newContractAddress = await contract.getAddress();

    console.log(`Successfully deployed new RevenueRights contract at ${newContractAddress} for project ${project.name}`);

    // 7. Update the project contract address in the database
    const updateField = isDemo ? { demo_contract_address: newContractAddress } : { contract_address: newContractAddress };
    const { error: updateErr } = await supabaseAdmin
      .from('projects')
      .update(updateField)
      .eq('id', projectId);

    if (updateErr) {
      console.error('Failed to update project contract address in database:', updateErr);
    }

    return newContractAddress;
  } catch (err) {
    console.error('Failed to sync contract with database:', err);
    return null;
  }
}
