import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin, requireAuth } from '@/app/lib/apiSecurity';
import { createWalletClient, http, parseEther, publicActions, createPublicClient, decodeEventLog, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat, baseSepolia } from 'viem/chains';
import { ETH_PRICE_USD } from '@/app/lib/constants';

const LOCAL_RPC = 'http://127.0.0.1:8545';
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const CONTRACT_ABI = [
  {
    type: 'event',
    name: 'HolderPaid',
    inputs: [
      { type: 'address', name: 'recipient', indexed: true },
      { type: 'string', name: 'fullName', indexed: false },
      { type: 'string', name: 'role', indexed: false },
      { type: 'uint256', name: 'amount', indexed: false },
      { type: 'uint256', name: 'basisPoints', indexed: false }
    ]
  }
];

async function getReceiptFromNetwork(hash: `0x${string}`) {
  // 1. Try local Hardhat
  try {
    const client = createPublicClient({
      chain: hardhat,
      transport: http(LOCAL_RPC),
    });
    const receipt = await client.getTransactionReceipt({ hash });
    if (receipt) return { receipt, isDemo: true };
  } catch (e) {
    // fallback to Base Sepolia
  }

  // 2. Try Base Sepolia
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(ALCHEMY_RPC),
    });
    const receipt = await client.getTransactionReceipt({ hash });
    if (receipt) return { receipt, isDemo: false };
  } catch (e) {
    // both failed
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, amount_eth, holders, manual_tx_hash, is_demo } = body;

    if (!is_demo) {
      await requireAdmin();
    } else {
      await requireAuth();
    }

    if (!project_id || !amount_eth || !holders?.length) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let txHash = manual_tx_hash;
    let isDemoMode = true;
    let verifiedHolders: any[] = [];

    if (!txHash) {
      // Setup Viem using local hardhat network
      const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http(LOCAL_RPC)
      }).extend(publicActions);
      
      const contractAddress = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || holders[0]?.wallet_address;
      
      // Create random TX hash to simulate if the node isn't running
      txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      try {
        const weiAmount = parseEther(amount_eth.toString());
        const hash = await walletClient.sendTransaction({
          to: contractAddress as `0x${string}`,
          value: weiAmount,
          data: '0x2d07953a'
        });
        await walletClient.waitForTransactionReceipt({ hash });
        txHash = hash;
      } catch (e: any) {
        console.warn("Hardhat transaction failed (is the node running?). Proceeding with simulation:", e.message);
      }
    }

    // Try verifying the transaction on-chain via event logs
    if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
      const result = await getReceiptFromNetwork(txHash as `0x${string}`);
      if (result) {
        const { receipt, isDemo } = result;
        isDemoMode = isDemo;

        if (receipt.status === 'success') {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: CONTRACT_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === 'HolderPaid') {
                const args: any = decoded.args;
                
                // Find matching holder from body to fetch rights_holder_id
                const matchedHolder = holders.find(
                  (h: any) => h.wallet_address?.toLowerCase() === args.recipient.toLowerCase()
                );

                verifiedHolders.push({
                  rights_holder_id: matchedHolder ? matchedHolder.rights_holder_id : null,
                  wallet_address: args.recipient,
                  full_name: matchedHolder ? matchedHolder.full_name : 'Contributor',
                  role: matchedHolder ? matchedHolder.role : 'Member',
                  amount_eth: Number(formatEther(args.amount)),
                  percentage: Number(args.basisPoints) / 100,
                });
              }
            } catch (e) {
              // Skip other log decodes
            }
          }
        }
      }
    }

    const finalHolders = verifiedHolders.length > 0 ? verifiedHolders : holders;
    const finalAmountEth = verifiedHolders.length > 0
      ? verifiedHolders.reduce((acc, h) => acc + Number(h.amount_eth), 0)
      : Number(amount_eth);

    // Save to Supabase (bypassing RLS)
    const { data: txRecord, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert({
        project_id,
        tx_hash: txHash,
        sender_address: body.sender_address || '0x...', 
        total_amount_eth: finalAmountEth,
        method: manual_tx_hash ? 'web3' : 'demo',
        is_demo: isDemoMode,
        status: 'confirmed'
      })
      .select('id')
      .single();

    if (txErr) {
      console.error('Transaction insert failed:', txErr);
      throw txErr;
    }

    // Save splits
    const splits = finalHolders.map((h: any) => ({
      transaction_id: txRecord.id,
      rights_holder_id: h.rights_holder_id,
      wallet_address: h.wallet_address,
      full_name: h.full_name || 'Contributor',
      role: h.role || 'Member',
      amount_eth: h.amount_eth,
      percentage: h.percentage,
    }));

    const { error: splitErr } = await supabaseAdmin
      .from('transaction_splits')
      .insert(splits);

    if (splitErr) {
      console.error('Splits insert failed:', splitErr);
      throw splitErr;
    }

    // Update total distributed for each holder
    for (const h of finalHolders) {
      if (!h.rights_holder_id) continue;
      try {
        const { data: curr } = await supabaseAdmin
          .from('rights_holders')
          .select('total_received')
          .eq('id', h.rights_holder_id)
          .single();
          
        const newTotal = Number(curr?.total_received || 0) + Number(h.amount_eth);
        await supabaseAdmin
          .from('rights_holders')
          .update({ total_received: newTotal })
          .eq('id', h.rights_holder_id);
      } catch (err) {
        console.warn(`Could not update total for holder ${h.rights_holder_id}:`, err);
      }
    }
    
    // Also update project total
    try {
      const { data: projCurr } = await supabaseAdmin
        .from('projects')
        .select('total_distributed, name')
        .eq('id', project_id)
        .single();
        
      const newProjTotal = Number(projCurr?.total_distributed || 0) + Number(finalAmountEth);
      await supabaseAdmin
        .from('projects')
        .update({ total_distributed: newProjTotal })
        .eq('id', project_id);

      // Log activity
      const projectName = projCurr?.name || 'Project';
      await supabaseAdmin.from('activities').insert([{
        project_id,
        action: 'payment_recorded',
        description: `Automated distribution of $${(Number(finalAmountEth) * ETH_PRICE_USD).toLocaleString()} for ${projectName}`,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      console.warn(`Could not update total for project ${project_id}:`, err);
    }

    return NextResponse.json({ success: true, txHash });
  } catch (err: any) {
    console.error('Auto distribute error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
