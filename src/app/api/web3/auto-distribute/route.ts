import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin, requireAuth, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, distributePayloadSchema } from '@/app/lib/validation';
import { createWalletClient, http, parseEther, publicActions, createPublicClient, decodeEventLog, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat, baseSepolia } from 'viem/chains';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';

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
    // Rate limit: sensitive tier (5 per minute) — this moves real money
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    const ethPrice = await getEthPriceUSD();

    // Validate input BEFORE any processing
    const result = await validateBody(req, distributePayloadSchema);
    if (result.error) return result.response;

    const { project_id, amount_eth, holders, manual_tx_hash, is_demo, sender_address } = result.data;

    if (is_demo && !isDemoAccessEnabled) {
      return NextResponse.json({ error: 'Demo mode is disabled on this deployment' }, { status: 403 });
    }

    // Auth: admin required for live, auth required for demo
    let user;
    if (!is_demo) {
      user = await requireAdmin();
    } else {
      user = await requireAuth();
    }

    // Audit log
    await auditLog('distribute:init', user.id, true, `project=${project_id} amount=${amount_eth} ETH holders=${holders.length}`);

    // Validate holder percentages sum to ~100%
    const totalPercentage = holders.reduce((sum, h) => sum + h.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      return NextResponse.json(
        { error: `Holder percentages sum to ${totalPercentage}%, expected ~100%` },
        { status: 400 }
      );
    }

    // Idempotency check: prevent double-recording the same tx_hash
    if (manual_tx_hash) {
      const { data: existing } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('tx_hash', manual_tx_hash)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Transaction already recorded', txHash: manual_tx_hash },
          { status: 409 }
        );
      }
    }

    let txHash = manual_tx_hash || null;
    let isDemoMode = true;
    let verifiedHolders: any[] = [];

    if (!txHash) {
      // Require PRIVATE_KEY from environment — never hardcode
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        return NextResponse.json(
          { error: 'Server private key not configured. Set PRIVATE_KEY in .env.local' },
          { status: 500 }
        );
      }

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http(LOCAL_RPC)
      }).extend(publicActions);
      
      const contractAddress = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS;
      if (!contractAddress) {
        return NextResponse.json(
          { error: 'NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS is not configured on the server' },
          { status: 500 }
        );
      }
      
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
        console.error("On-chain transaction failed:", e.message);
        return NextResponse.json(
          { error: 'On-chain transaction failed. Check server configuration and try again.' },
          { status: 500 }
        );
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
                
                const matchedHolder = holders.find(
                  (h) => h.wallet_address?.toLowerCase() === args.recipient.toLowerCase()
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
    const insertPayloadWithPrice = {
      project_id,
      tx_hash: txHash,
      sender_address: sender_address || '0x0000000000000000000000000000000000000000', 
      total_amount_eth: finalAmountEth,
      method: manual_tx_hash ? 'web3' : 'demo',
      is_demo: isDemoMode,
      status: 'confirmed',
      eth_price_at_tx: ethPrice,
    };

    let txRecord = null;
    let txErr = null;

    const firstTry = await supabaseAdmin
      .from('transactions')
      .insert([insertPayloadWithPrice])
      .select('id')
      .single();

    if (firstTry.error && (firstTry.error.code === '42703' || firstTry.error.message?.includes('eth_price_at_tx'))) {
      const insertPayloadWithoutPrice = { ...insertPayloadWithPrice };
      delete (insertPayloadWithoutPrice as any).eth_price_at_tx;
      const secondTry = await supabaseAdmin
        .from('transactions')
        .insert([insertPayloadWithoutPrice])
        .select('id')
        .single();
      txRecord = secondTry.data;
      txErr = secondTry.error;
    } else {
      txRecord = firstTry.data;
      txErr = firstTry.error;
    }

    if (txErr) {
      console.error('Transaction insert failed:', txErr);
      throw txErr;
    }

    if (!txRecord) {
      throw new Error('Transaction record creation failed');
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

    // Update total distributed for each holder atomically
    for (const h of finalHolders) {
      if (!h.rights_holder_id) continue;
      try {
        const rpcRes = await supabaseAdmin.rpc('increment_holder_received', {
          holder_id: h.rights_holder_id,
          amount: Number(h.amount_eth),
        });

        if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message?.includes('increment_holder_received'))) {
          // Graceful fallback: RPC does not exist
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
        } else if (rpcRes.error) {
          throw rpcRes.error;
        }
      } catch (err) {
        console.warn(`Could not update total for holder ${h.rights_holder_id}:`, err);
      }
    }
    
    // Also update project total atomically
    const { data: projCurr } = await supabaseAdmin
      .from('projects')
      .select('name, total_distributed')
      .eq('id', project_id)
      .single();

    try {
      const rpcRes = await supabaseAdmin.rpc('increment_project_distributed', {
        project_id,
        amount: Number(finalAmountEth),
      });

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message?.includes('increment_project_distributed'))) {
        // Graceful fallback: RPC does not exist
        const newProjTotal = Number(projCurr?.total_distributed || 0) + Number(finalAmountEth);
        await supabaseAdmin
          .from('projects')
          .update({ total_distributed: newProjTotal })
          .eq('id', project_id);
      } else if (rpcRes.error) {
        throw rpcRes.error;
      }
    } catch (err) {
      console.warn(`Could not update total for project ${project_id}:`, err);
    }

    // Log activity
    const projectName = projCurr?.name || 'Project';
    await supabaseAdmin.from('activities').insert([{
      project_id,
      action: 'payment_recorded',
      description: `Automated distribution of $${(Number(finalAmountEth) * ethPrice).toLocaleString()} for ${projectName}`,
      timestamp: new Date().toISOString(),
    }]);

    // Audit success
    await auditLog('distribute:success', user.id, true, `txHash=${txHash} amount=${finalAmountEth} ETH`);

    return NextResponse.json({ success: true, txHash });
  } catch (err: any) {
    console.error('Auto distribute error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
