export const isDemoAccessEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true';

export function readDemoMode(): boolean {
  if (!isDemoAccessEnabled || typeof window === 'undefined') return false;
  return localStorage.getItem('demo_mode') === 'true';
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
