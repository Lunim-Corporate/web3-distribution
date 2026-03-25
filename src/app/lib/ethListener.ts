import { ethers } from 'ethers';

/**
 * Listens to smart contract PaymentReceived events
 * and forwards payments to /api/payments endpoint
 */
export async function startListener() {
  const RPC = process.env.ETH_RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

  if (!RPC || !CONTRACT_ADDRESS) {
    console.warn('ETH_RPC_URL or CONTRACT_ADDRESS not set; listener disabled.');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);

    // Replace with your actual contract ABI
    const ABI: Array<string> = [
      'event PaymentReceived(bytes32 indexed projectId, uint256 amount)'
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    contract.on('PaymentReceived', async (projectId: string, amount: ethers.BigNumberish, event: { transactionHash: string }) => {
      try {
        const amountFloat = Number(ethers.formatUnits(amount, 18)); // adjust decimals as needed
        const amountCents = Math.round(amountFloat * 100);

        const payload = {
          projectId: projectId.toString(),
          amountCents,
          txHash: event.transactionHash,
        };

        const response = await fetch(`${SITE_URL}/api/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error('Failed to record payment:', response.statusText);
        }
      } catch (e) {
        console.error('Listener error:', e);
      }
    });

    console.log('Ethers listener started for contract:', CONTRACT_ADDRESS);
  } catch (e) {
    console.error('Failed to start ethers listener:', e);
  }
}