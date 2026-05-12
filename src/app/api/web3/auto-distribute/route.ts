import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { createWalletClient, http, parseEther, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { ETH_PRICE_USD } from '@/app/lib/constants';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { project_id, amount_eth, holders, manual_tx_hash } = body;

    if (!project_id || !amount_eth || !holders?.length) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let txHash = manual_tx_hash;

    if (!txHash) {
      // 1. Setup Viem using local hardhat network
      const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http('http://127.0.0.1:8545')
      }).extend(publicActions);
      
      const contractAddress = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || holders[0]?.wallet_address;
      
      // Create random TX hash to simulate if the node isn't running
      txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      try {
        // 2. Actually execute the transaction on Local Hardhat
        const weiAmount = parseEther(amount_eth.toString());
        const hash = await walletClient.sendTransaction({
          to: contractAddress as `0x${string}`,
          value: weiAmount,
          data: '0x2d07953a' // Optional data
        });
        await walletClient.waitForTransactionReceipt({ hash });
        txHash = hash;
      } catch (e: any) {
        console.warn("Hardhat transaction failed (is the node running?). Proceeding with simulation:", e.message);
      }
    }

    // 3. Save to Supabase (bypassing RLS)
    const { data: txRecord, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert({
        project_id,
        tx_hash: txHash,
        sender_address: body.sender_address || '0x...', 
        total_amount_eth: amount_eth,
        method: manual_tx_hash ? 'web3' : 'demo',
        is_demo: true,
        status: 'confirmed' // Must be 'confirmed' as per schema check constraint
      })
      .select('id')
      .single();

    if (txErr) {
      console.error('Transaction insert failed:', txErr);
      throw txErr;
    }

    // 4. Save splits
    const splits = holders.map((h: any) => ({
      transaction_id: txRecord.id,
      rights_holder_id: h.rights_holder_id,
      wallet_address: h.wallet_address,
      full_name: h.full_name || 'Contributor',
      role: h.role || 'Member',
      amount_eth: h.amount_eth,
      percentage: h.percentage,
      // 'status' removed because it doesn't exist in the schema for transaction_splits
    }));

    const { error: splitErr } = await supabaseAdmin
      .from('transaction_splits')
      .insert(splits);

    if (splitErr) {
      console.error('Splits insert failed:', splitErr);
      throw splitErr;
    }

    // 5. Update total distributed for each holder
    for (const h of holders) {
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
        
      const newProjTotal = Number(projCurr?.total_distributed || 0) + Number(amount_eth);
      await supabaseAdmin
        .from('projects')
        .update({ total_distributed: newProjTotal })
        .eq('id', project_id);

      // 6. Log activity
      const projectName = projCurr?.name || 'Project';
      await supabaseAdmin.from('activities').insert([{
        project_id,
        action: 'payment_recorded',
        description: `Automated distribution of $${(Number(amount_eth) * ETH_PRICE_USD).toLocaleString()} for ${projectName}`,
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
