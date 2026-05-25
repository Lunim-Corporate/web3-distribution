'use client';
 
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';
import { DEMO_ACCOUNTS } from '@/app/components/Navbar';
import { useWallets } from '@privy-io/react-auth';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setNotifyResurfacingHours, settings, exportWallet, linkWallet } = useAuth();
  const { smartAccountAddress, isInitializing } = useRevenueSplitter();
  const { wallets } = useWallets();
  const hasEmbeddedWallet = wallets.some((w) => w.walletClientType === 'privy');

  const [hours, setHours] = useState<number>(settings?.notifyResurfacingHours ?? 24);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [demoAccount, setDemoAccount] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const switchDemoAccount = (address: string) => {
    localStorage.setItem('active_demo_wallet', address);
    setDemoAccount(address);
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: address }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncDemoAccount = () => {
      const activeDemo = localStorage.getItem('active_demo_wallet');
      if (activeDemo) {
        setDemoAccount(activeDemo);
      } else {
        setDemoAccount(null);
      }
    };

    syncDemoAccount();

    const handleDemoWalletChanged = (e: any) => {
      setDemoAccount(e.detail);
    };

    window.addEventListener('demo-wallet-changed', handleDemoWalletChanged);
    return () => window.removeEventListener('demo-wallet-changed', handleDemoWalletChanged);
  }, []);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    setHours(settings?.notifyResurfacingHours ?? 24);
  }, [settings?.notifyResurfacingHours]);

  useEffect(() => {
    // Read initial mode
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = (e: any) => setIsDemoMode(e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
              <div className="font-medium text-gray-900 dark:text-white">{user?.name || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
              <div className="font-medium text-gray-900 dark:text-white">{user?.email || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Role</div>
              <Badge variant={user?.role === 'admin' ? 'success' : 'default'}>{user?.role || '-'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">Notify resurfacing every</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {hours} hours
                </div>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <Button onClick={() => setNotifyResurfacingHours(hours)} variant="primary">
              Save settings
            </Button>
          </CardContent>
        </Card>

        {isDemoMode ? (
          /* DEMO MODE WALLET CONNECTION & SWITCHER */
          <Card className="border-amber-500/20 dark:border-amber-500/10">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-xl">🦊</span> Wallet Connection (Demo Mode)
                </CardTitle>
                <Badge className="animate-pulse bg-amber-500 text-white font-bold uppercase tracking-wider text-[10px]">
                  Local Sandbox
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are in **Demo Mode**. You can switch between pre-seeded local Hardhat accounts below to test rights-holder revenue shares and smart-contract distributions with zero transaction costs.
              </p>

              {demoAccount ? (
                (() => {
                  const activeAcc = DEMO_ACCOUNTS.find(acc => acc.address.toLowerCase() === demoAccount.toLowerCase());
                  return (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Active Account</div>
                        <Badge className={`${
                          activeAcc?.role === 'Admin'
                            ? 'bg-rose-500/10 text-rose-500'
                            : activeAcc?.role === 'Creator'
                            ? 'bg-violet-500/10 text-violet-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        } font-bold`}>
                          {activeAcc?.role || 'Custom Account'}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Account Address</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-950 dark:text-white break-all select-all font-bold">
                            {demoAccount}
                          </span>
                          <button
                            onClick={() => copyToClipboard(demoAccount)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                            title="Copy Address"
                          >
                            {copiedText === demoAccount ? (
                              <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 pt-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sandbox Balance</div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {activeAcc?.balance || '100.00'} ETH
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No EOA account connected in Demo Mode</p>
                  <Button
                    onClick={() => {
                      const first = DEMO_ACCOUNTS[0].address;
                      switchDemoAccount(first);
                    }}
                    variant="primary"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    Connect Local EOA
                  </Button>
                </div>
              )}

              {/* Grid switcher */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Quick Switch Demo Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = demoAccount?.toLowerCase() === acc.address.toLowerCase();
                    return (
                      <button
                        key={acc.address}
                        onClick={() => switchDemoAccount(acc.address)}
                        className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all hover:scale-[1.02] duration-200 ${
                          isSelected
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                            : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-extrabold text-gray-900 dark:text-white truncate">
                              {acc.role}
                            </span>
                            {isSelected && (
                              <div className="w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mb-2">
                            {acc.name}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between w-full">
                          <span className="text-[10px] font-mono text-gray-400">
                            {acc.address.slice(0, 5)}...{acc.address.slice(-4)}
                          </span>
                          <span className="text-[11px] font-bold text-gray-900 dark:text-white shrink-0">
                            {acc.balance} ETH
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* LIVE MODE WALLET CONNECTION */
          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Your account uses a Smart Account (ERC-4337) with sponsored gas fees. 
                You don't need to hold ETH to pay for transactions.
              </p>

              {isInitializing ? (
                <div className="flex items-center justify-center py-6">
                  <div className="text-sm text-gray-500 animate-pulse">Initializing Smart Account...</div>
                </div>
              ) : smartAccountAddress ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                    <div className="font-medium text-emerald-600 dark:text-emerald-400">
                      Active (AA Enabled)
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Smart Account Address</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900 dark:text-white break-all select-all font-bold">
                        {smartAccountAddress}
                      </span>
                      <button
                        onClick={() => copyToClipboard(smartAccountAddress)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                        title="Copy Smart Account"
                      >
                        {copiedText === smartAccountAddress ? (
                          <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Gas Coverage</div>
                    <div className="font-medium text-indigo-500">100% Sponsored (Zero Gas)</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                    <div className="font-medium text-gray-500">Not Connected</div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                    Please login to initialize your secure smart account.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isDemoMode ? (
          /* DEMO MODE ACCOUNT PORTABILITY - DISABLED */
          <Card className="opacity-75 relative overflow-hidden border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-900/10">
            <CardHeader>
              <CardTitle className="text-gray-400">Account Portability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-450 dark:text-gray-400">
                You own your account. You can export your private key or link an existing external wallet to use your account in other applications.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button disabled variant="secondary" className="cursor-not-allowed flex items-center justify-center gap-2 opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Export Private Key
                </Button>
                <Button disabled variant="secondary" className="cursor-not-allowed flex items-center justify-center gap-2 opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link External Wallet
                </Button>
              </div>

              <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed text-center font-bold">
                  ⚠️ Portability is locked in Demo Mode. Switch to Live Mode in the header to manage live keys and link real wallets.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* LIVE MODE ACCOUNT PORTABILITY */
          <Card>
            <CardHeader>
              <CardTitle>Account Portability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You own your account. You can export your private key to use your wallet in other applications (like MetaMask or Coinbase Wallet) or link an existing external wallet.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={async () => {
                    try {
                      await exportWallet();
                    } catch (e: any) {
                      toast.error(e.message || "Failed to export private key");
                    }
                  }} 
                  disabled={!hasEmbeddedWallet}
                  variant="secondary"
                  className="flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={!hasEmbeddedWallet ? "Private key export is only available for embedded Privy accounts." : "Export secure private key"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Export Private Key
                </Button>
                
                <Button 
                  onClick={() => linkWallet()} 
                  variant="secondary"
                  className="flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link External Wallet
                </Button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>Warning:</strong> Never share your private key with anyone. LUNIM employees will never ask for your private key. Exporting your key allows you to move your funds independently of this platform.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void logout()} variant="secondary" className="w-full text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40">
              Log Out of Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

