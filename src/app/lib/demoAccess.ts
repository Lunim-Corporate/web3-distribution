export const isDemoAccessEnabled =
  process.env.NEXT_PUBLIC_DISABLE_DEMO_ACCESS !== 'true';

export const isSandboxLoginEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SANDBOX_LOGIN === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ||
  process.env.NODE_ENV === 'development';

export function readDemoMode(): boolean {
  if (!isDemoAccessEnabled || typeof window === 'undefined') return false;
  const savedMode = localStorage.getItem('demo_mode');
  return savedMode === null ? true : savedMode === 'true';
}

export function setDemoMode(enabled: boolean) {
  if (typeof window === 'undefined') return;

  if (!isDemoAccessEnabled) {
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('active_demo_wallet');
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: false }));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
    return;
  }

  localStorage.setItem('demo_mode', String(enabled));
  window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: enabled }));
}
