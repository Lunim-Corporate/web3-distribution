const { ethers } = require('ethers');
const supabase = require('./supabase');
require('dotenv').config();

const ABI = [
  "event RevenueDistributed(address indexed sender, uint256 totalAmount, uint256 timestamp)",
  "event HolderPaid(address indexed recipient, string name, string role, uint256 amount, uint256 basisPoints)"
];

async function initializeListener() {
  const rpcUrl = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.warn("[CONTRACT LISTENER] No CONTRACT_ADDRESS found. Listener not started.");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, ABI, provider);

    console.log(`[CONTRACT LISTENER] Listening for events on ${contractAddress} at ${rpcUrl}`);
    provider.on('error', (tx) => {
        // Suppress initial ECONNREFUSED error from crashing the listener on startup
    });

    // We don't necessarily need to persist RevenueDistributed directly to a master 'transactions' 
    // table in compatibility mode, since we build transactions from 'payments'.
    contract.on("RevenueDistributed", async (sender, totalAmount, timestamp, event) => {
       // We can simply ignore this or just log it since the true state is captured in HolderPaid mapped to payments
       console.log(`[CONTRACT EVENT] RevenueDistributed: Hash=${event.log.transactionHash}, Sender=${sender}, Amount=${ethers.formatEther(totalAmount)}`);
    });

    // Listen for HolderPaid events
    contract.on("HolderPaid", async (recipient, name, role, amount, basisPoints, event) => {
      const txHash = event.log.transactionHash;
      const amountEth = ethers.formatEther(amount);
      const percentage = Number(basisPoints) / 100;

      console.log(`[CONTRACT EVENT] HolderPaid: Tx=${txHash.substring(0,10)}..., Recipient=${recipient}, Amount=${amountEth} ETH`);

      // Check if it exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('tx_hash', txHash)
        .eq('amount', amountEth)
        .limit(1);

      if (existingPayment && existingPayment.length > 0) return;

      let pId = null;
      let userId = null;

      // Find user and project for context
      const { data: user } = await supabase.from('users').select('id').eq('name', name).single();
      if (user) {
         userId = user.id;
         const { data: pc } = await supabase.from('project_contributors').select('project_id').eq('user_id', user.id).limit(1).single();
         if (pc) pId = pc.project_id;
      }
      
      if (!pId) {
         const { data: project } = await supabase.from('projects').select('id').limit(1).single();
         if (project) pId = project.id;
      }

      const ETH_USD_RATE = 3500;
      const amountUsd = Number(amountEth) * ETH_USD_RATE;

      // Insert payment
      if (pId) {
          await supabase.from('payments').insert([{
             project_id: pId,
             user_id: userId,
             amount: amountUsd,
             tx_hash: txHash,
             status: 'completed',
             source: 'Smart Contract',
             split_percentage: percentage
          }]);
          
          // Update project total
          const { data: projectData } = await supabase.from('projects').select('total_revenue').eq('id', pId).single();
          if (projectData) {
             await supabase.from('projects').update({ total_revenue: Number(projectData.total_revenue || 0) + amountUsd }).eq('id', pId);
          }
      }
    });

  } catch (err) {
    console.error("[CONTRACT LISTENER] Error starting listener:", err);
  }
}

module.exports = { initializeListener };
