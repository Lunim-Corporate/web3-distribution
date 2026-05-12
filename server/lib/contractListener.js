const { JsonRpcProvider, Contract, formatEther } = require('ethers');
const path = require('path');
const fs = require('fs');
const { supabaseAdmin } = require('./supabase');
require('dotenv').config();

async function initializeContractListener() {
  const rpcUrl = process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545';
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.warn("⚠️ CONTRACT_ADDRESS missing. Contract listener not started.");
    return;
  }

  const provider = new JsonRpcProvider(rpcUrl);
  
  const abiPath = path.join(__dirname, '../../src/contracts/RevenueRights.json');
  if (!fs.existsSync(abiPath)) {
    console.warn("⚠️ RevenueRights.json ABI missing. Contract listener not started.");
    return;
  }

  const { abi } = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const contract = new Contract(contractAddress, abi, provider);

  console.log(`🎧 LUNIM Contract Listener attached to ${contractAddress}`);

  contract.on("RevenueDistributed", async (sender, totalAmount, timestamp, event) => {
    try {
      const txHash = event.log.transactionHash;
      console.log(`\n[LUNIM CONTRACT EVENT] RevenueDistributed`);
      console.log(`Sender: ${sender}`);
      console.log(`Amount: ${formatEther(totalAmount)} ETH`);
      console.log(`TxHash: ${txHash}`);

      // Check if tx exists in DB
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('id, status')
        .eq('tx_hash', txHash)
        .single();

      if (!existingTx) {
        // If not initiated by backend, attempt to find project by contract_address
        const { data: proj } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('contract_address', contractAddress)
          .single();

        if (proj) {
          await supabaseAdmin.from('transactions').insert({
            project_id: proj.id,
            tx_hash: txHash,
            sender_address: sender,
            total_amount_eth: formatEther(totalAmount),
            status: 'confirmed',
            block_number: event.log.blockNumber,
            confirmed_at: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Error handling RevenueDistributed event:", err.message);
    }
  });
}

module.exports = { initializeContractListener };
