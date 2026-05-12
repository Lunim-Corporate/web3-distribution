import { supabaseAdmin } from './src/app/lib/supabaseServer';

async function clean() {
  const { data: splits } = await supabaseAdmin.from('transaction_splits').select('transaction_id');
  const validIds = (splits ?? []).map(s => s.transaction_id);

  // Find transactions that are not in validIds
  const { data: allTxs } = await supabaseAdmin.from('transactions').select('id');
  const idsToDelete = (allTxs ?? []).filter(t => !validIds.includes(t.id)).map(t => t.id);
  
  if (idsToDelete.length > 0) {
    console.log('Deleting old transactions without splits:', idsToDelete.length);
    const { error } = await supabaseAdmin.from('transactions').delete().in('id', idsToDelete);
    if (error) console.error(error);
  } else {
    console.log('No old transactions to delete.');
  }
}
clean();
