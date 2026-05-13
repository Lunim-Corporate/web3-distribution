const fs = require('fs');
let code = fs.readFileSync('src/app/components/dashboard/DistributePanel.tsx', 'utf8');

// Replace method state with isDemoMode
code = code.replace(
  "const [method, setMethod] = useState<'auto' | 'manual'>('auto');",
  "const [isDemoMode, setIsDemoMode] = useState(false);\n  useEffect(() => {\n    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');\n    const onDemoChanged = (e: any) => setIsDemoMode(e.detail);\n    window.addEventListener('demo-mode-changed', onDemoChanged);\n    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);\n  }, []);"
);

// Fix connectWallet to respect isDemoMode
code = code.replace(
  "if (Number(network.chainId) !== 31337) {",
  "if (isDemoMode && Number(network.chainId) !== 31337) {"
);
code = code.replace(
  "toast.success('Wallet connected to LUNIM Demo');",
  "toast.success(isDemoMode ? 'Connected to Local Wallet' : 'Connected to Web 3.0');"
);

// Fix handleDistribute
const handleDistributeRegex = /const handleDistribute = async \(\) => \{[\s\S]*?try \{[\s\S]*?if \(method === 'manual'\) \{[\s\S]*?\}\s*\/\/ Sync with Backend/m;
const newHandleDistribute = `const handleDistribute = async () => {
    if (!project || holders.length === 0) return toast.error('No project or holders found');
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) return toast.error('Enter a valid amount');

    setIsProcessing(true);
    setTxHash('');
    const tid = toast.loading('Waiting for MetaMask...');

    try {
      if (!walletConnected) throw new Error('Connect your wallet first');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contractABI = ["function distributeRevenue() public payable"];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      
      const tx = await contract.distributeRevenue({
        value: ethers.parseEther(amount),
      });
      
      toast.loading('Transaction submitted! Waiting for confirmation...', { id: tid });
      const receipt = await tx.wait();
      const manualTxHash = receipt?.hash || '';
      setTxHash(manualTxHash);
      toast.success('On-chain transaction confirmed!', { id: tid });

      // Sync with Backend`;
code = code.replace(handleDistributeRegex, newHandleDistribute);

// Remove toggle buttons
const togglesRegex = /<div className="flex items-center gap-2 bg-white\/5 p-1.5 rounded-2xl border border-white\/5">[\s\S]*?<\/div>/;
code = code.replace(togglesRegex, "");

// Remove method === 'manual' conditional rendering for the connect button
const connectBtnRegex = /\{method === 'manual' && \([\s\S]*?<button[\s\S]*?onClick=\{connectWallet\}[\s\S]*?className=\{`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border flex items-center justify-center gap-3 \$\{[\s\S]*?walletConnected[\s\S]*?\? 'bg-emerald-500\/10 border-emerald-500\/20 text-emerald-400'[\s\S]*?: 'bg-indigo-500 text-white shadow-xl shadow-indigo-500\/20 hover:opacity-90'[\s\S]*?`\}[\s\S]*?>[\s\S]*?<span className="text-lg">🦊<\/span>[\s\S]*?\{walletConnected \? `Connected: \$\{userAddress.slice\(0,6\)\}\.\.\.\$\{userAddress.slice\(-4\)\}` : 'Connect MetaMask'\}[\s\S]*?<\/button>[\s\S]*?\)\}/;
code = code.replace(connectBtnRegex, `<button 
                  onClick={connectWallet}
                  className={\`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border flex items-center justify-center gap-3 \${
                    walletConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:opacity-90'
                  }\`}
                >
                  <span className="text-lg">🦊</span>
                  {walletConnected ? \`Connected: \${userAddress.slice(0,6)}...\${userAddress.slice(-4)}\` : (isDemoMode ? 'Connect Local Wallet' : 'Connect Web 3.0')}
                </button>`);

// Fix distribute button disabled state
code = code.replace(
  "disabled={isProcessing || (method === 'manual' && !walletConnected)}",
  "disabled={isProcessing || !walletConnected}"
);

// Fix tid loading message
code = code.replace(
  "const tid = toast.loading(method === 'manual' ? 'Waiting for MetaMask...' : 'Processing distribution...');",
  "// defined earlier"
);

fs.writeFileSync('src/app/components/dashboard/DistributePanel.tsx', code);
console.log('DistributePanel.tsx patched');
