const express = require('express');
const { body } = require('express-validator');
const { supabaseAdmin } = require('../lib/supabase');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// GET /api/transactions/:projectId
router.get('/:projectId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`*, transaction_splits (*)`)
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/initiate
router.post('/initiate', [
  body('projectId').notEmpty(),
  body('senderAddress').notEmpty(),
  body('totalAmountEth').isNumeric(),
  body('txHash').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { projectId, senderAddress, totalAmountEth, txHash } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        project_id: projectId,
        sender_address: senderAddress,
        total_amount_eth: totalAmountEth,
        tx_hash: txHash,
        status: 'pending'
      })
      .select('id, tx_hash, status')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/confirm
router.post('/confirm', [
  body('txHash').notEmpty(),
  body('blockNumber').isNumeric(),
  body('splits').isArray(),
  validateRequest
], async (req, res) => {
  try {
    const { txHash, blockNumber, splits } = req.body;

    const { data: tx, error: findError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('tx_hash', txHash)
      .single();

    if (findError) throw findError;
    if (tx.status === 'confirmed') {
      return res.status(200).json({ message: 'Transaction already confirmed' });
    }

    // Update tx status
    const { data: updatedTx, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'confirmed',
        block_number: blockNumber,
        confirmed_at: new Date().toISOString()
      })
      .eq('tx_hash', txHash)
      .select()
      .single();

    if (updateError) throw updateError;

    // Insert splits
    const splitsToInsert = splits.map(s => ({
      transaction_id: updatedTx.id,
      rights_holder_id: s.rightsHolderId || null,
      wallet_address: s.walletAddress,
      full_name: s.fullName,
      role: s.role,
      percentage: s.percentage,
      amount_eth: s.amountEth
    }));

    const { error: splitError } = await supabaseAdmin
      .from('transaction_splits')
      .insert(splitsToInsert);

    if (splitError) throw splitError;

    // Update holder balances
    for (const split of splits) {
      const { data: holder } = await supabaseAdmin
        .from('rights_holders')
        .select('id, total_received')
        .eq('project_id', tx.project_id)
        .eq('wallet_address', split.walletAddress)
        .single();
        
      if (holder) {
        const newTotal = Number(holder.total_received) + Number(split.amountEth);
        await supabaseAdmin
          .from('rights_holders')
          .update({ total_received: newTotal })
          .eq('id', holder.id);
      }
    }

    // Update project total
    const { data: proj } = await supabaseAdmin
      .from('projects')
      .select('id, total_distributed')
      .eq('id', tx.project_id)
      .single();

    if (proj) {
      const newProjTotal = Number(proj.total_distributed) + Number(tx.total_amount_eth);
      await supabaseAdmin
        .from('projects')
        .update({ total_distributed: newProjTotal })
        .eq('id', proj.id);
    }

    res.json({ transaction: updatedTx, splits: splitsToInsert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/fail
router.post('/fail', [
  body('txHash').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { txHash } = req.body;
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'failed' })
      .eq('tx_hash', txHash)
      .select('tx_hash, status')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
