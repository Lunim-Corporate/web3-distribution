import { supabase } from './supabaseClient';

export async function updateUserWallet(userId: string, walletAddress: string, walletType: 'metamask' | 'local'): Promise<void> {
  const { error } = await supabase
    .from('users_profile')
    .update({
      wallet_address: walletAddress,
      wallet_type: walletType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating wallet in database:', error);
    throw error;
  }
}

export async function clearUserWallet(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users_profile')
    .update({
      wallet_address: null,
      wallet_type: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error clearing wallet in database:', error);
    throw error;
  }
}