const fs = require('fs');
let code = fs.readFileSync('src/app/components/dashboard/DistributePanel.tsx', 'utf8');

// 1. Remove separate connectWallet button entirely
const connectBtnRegex = /<button \s*onClick=\{connectWallet\}[\s\S]*?<\/button>/;
code = code.replace(connectBtnRegex, "");

// 2. Remove the old connectWallet function 
const connectWalletFuncRegex = /const connectWallet = async \(\) => \{[\s\S]*?catch \(e: any\) \{[\s\S]*?\}[\s\S]*?\};/;
code = code.replace(connectWalletFuncRegex, "");

// 3. Update handleDistribute to include connection flow
const handleDistributeRegex = /const handleDistribute = async \(\) => \{[\s\S]*?try \{[\s\S]*?if \(!walletConnected\) throw new Error\('Connect your wallet first'\);[\s\S]*?const provider = new ethers\.BrowserProvider\(window\.ethereum\);[\s\S]*?const signer = await provider\.getSigner\(\);/m;

const newHandleDistribute = `const handleDistribute = async () => {
    if (!project || holders.length === 0) return toast.error('No project or holders found');
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) return toast.error('Enter a valid amount');

    setIsProcessing(true);
    setTxHash('');
    const tid = toast.loading('Connecting to MetaMask...');

    try {
      if (typeof window.ethereum === 'undefined') throw new Error('MetaMask is not installed');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Ensure we are on Hardhat network for the demo
      const network = await provider.getNetwork();
      if (isDemoMode && Number(network.chainId) !== 31337) {
        toast.loading('Switching to Local Wallet (31337)...', { id: tid });
        const success = await switchNetwork();
        if (!success) throw new Error('Please switch MetaMask to Localhost:8545');
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const activeAddress = accounts[0];
      setUserAddress(activeAddress);
      setWalletConnected(true);

      const signer = await provider.getSigner();`;

code = code.replace(handleDistributeRegex, newHandleDistribute);

// 4. Update the "disabled" prop of the initiate distribution button to not rely on !walletConnected
code = code.replace(
  "disabled={isProcessing || !walletConnected}",
  "disabled={isProcessing}"
);

// 5. Update sender_address in the backend sync inside handleDistribute
code = code.replace(
  "sender_address: userAddress || '0x...'",
  "sender_address: activeAddress"
);

fs.writeFileSync('src/app/components/dashboard/DistributePanel.tsx', code);
console.log('DistributePanel.tsx patched');
