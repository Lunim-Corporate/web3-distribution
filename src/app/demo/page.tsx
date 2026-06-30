import { redirect } from 'next/navigation';

/**
 * Friendly alias for the Web3 Demo Sandbox page.
 * Redirects visitors to the primary /web3-demo portal.
 */
export default function DemoRedirectPage() {
  redirect('/web3-demo');
}
