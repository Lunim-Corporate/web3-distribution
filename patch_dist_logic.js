const fs = require('fs');
let code = fs.readFileSync('src/app/components/dashboard/DistributePanel.tsx', 'utf8');

const oldHandleDistributeRegex = /const handleDistribute = async \(\) => \{[\s\S]*?try \{[\s\S]*?if \(typeof window\.ethereum === 'undefined'\) throw new Error\('MetaMask is not installed'\);[\s\S]*?catch \(e: any\) \{[\s\S]*?\} finally \{[\s\S]*?\}[\s\S]*?\};/;

const newHandleDistribute = `const handleDistribute = async () => {
    if (!project || holders.length === 0) return toast.error('No project or holders found');
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) return toast.error('Enter a valid amount');

    setIsProcessing(true);
    setTxHash('');

    try {
      if (isDemoMode) {
        const tid = toast.loading('Simulating Local Transaction...');
        
        const res = await fetch('/api/web3/auto-distribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            amount_eth: ethAmount,
            manual_tx_hash: null,
            sender_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Local Hardhat Default
            holders: holders.map(h => ({
              rights_holder_id: h.id,
              wallet_address: h.wallet_address,
              full_name: h.full_name,
              role: h.role,
              percentage: h.percentage,
              amount_eth: (h.percentage / 100) * ethAmount,
            })),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to simulate transaction');
        }
        
        const data = await res.json();
        setTxHash(data.txHash);
        toast.success('Local revenue distributed successfully!', { id: tid });
        window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: project.id } }));

      } else {
        const tid = toast.loading('Connecting to MetaMask...');
        if (typeof window.ethereum === 'undefined') throw new Error('MetaMask is not installed');
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const accounts = await provider.send("eth_requestAccounts", []);
        const activeAddress = accounts[0];
        setUserAddress(activeAddress);
        setWalletConnected(true);

        const signer = await provider.getSigner();
        const contractABI = ["function distributeRevenue() public payable"];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        
        toast.loading('Please confirm transaction in MetaMask...', { id: tid });
        const tx = await contract.distributeRevenue({
          value: ethers.parseEther(amount),
        });
        
        toast.loading('Transaction submitted! Waiting for confirmation...', { id: tid });
        const receipt = await tx.wait();
        const manualTxHash = receipt?.hash || '';
        setTxHash(manualTxHash);
        toast.success('On-chain transaction confirmed!', { id: tid });

        const res = await fetch('/api/web3/auto-distribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            amount_eth: ethAmount,
            manual_tx_hash: manualTxHash,
            sender_address: activeAddress,
            holders: holders.map(h => ({
              rights_holder_id: h.id,
              wallet_address: h.wallet_address,
              full_name: h.full_name,
              role: h.role,
              percentage: h.percentage,
              amount_eth: (h.percentage / 100) * ethAmount,
            })),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to record transaction in database');
        }
        
        toast.success('Revenue distributed and synced successfully!', { id: tid });
        window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: project.id } }));
      }

    } catch (e: any) {
      toast.error(e.message || 'Distribution failed');
    } finally {
      setIsProcessing(false);
    }
  };`;

code = code.replace(oldHandleDistributeRegex, newHandleDistribute);

fs.writeFileSync('src/app/components/dashboard/DistributePanel.tsx', code);
console.log('DistributePanel.tsx handleDistribute patched for demo mode bypass');
