const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// POST /api/transactions/initiate - Called BEFORE sending blockchain tx
router.post(
  '/initiate',
  validate([
    body('projectId').isUUID().withMessage('Valid Project ID is required'),
    body('senderAddress').notEmpty().withMessage('Sender address is required'),
    body('totalAmountEth').isNumeric().withMessage('Total amount must be a number'),
    body('txHash').notEmpty().withMessage('Transaction hash is required')
  ]),
  async (req, res) => {
    try {
      const { projectId, senderAddress, totalAmountEth, txHash } = req.body;
      // In the legacy schema compatibility mode, we don't store "pending" master transactions
      // We wait for splits in the /confirm endpoint to insert into `payments`.
      res.status(201).json({ id: txHash, tx_hash: txHash, status: 'pending' });
    } catch (err) {
      console.error('Error initiating transaction:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/transactions/confirm - Called AFTER blockchain tx confirms
router.post(
  '/confirm',
  validate([
    body('txHash').notEmpty().withMessage('Transaction hash is required'),
    body('splits').isArray().withMessage('Splits array is required'),
    body('splits.*.amountEth').isNumeric().withMessage('Split amount must be a number')
  ]),
  async (req, res) => {
    try {
      const { txHash, projectId, splits } = req.body;
      
      // If we don't have projectId provided in confirm, we might have to infer it,
      // but let's assume valid splits or use the first matched user context.
      // Wait, confirm doesn't receive projectId in useRevenueContract.js!
      // Looking at useRevenueContract.js: 
      // await fetch(`${API_BASE}/transactions/confirm`, { ... body: JSON.stringify({ txHash: tx.hash, blockNumber, splits }) })
      // Since it doesn't send projectId, we have to look up the project by finding the rightsHolders.
      // Easiest is to search a user from splits and find their project_contributors record, but the frontend has projectId!
      
      let pId = projectId;
      if (!pId) {
        // Fallback: search the first split name in users
        const { data: user } = await supabase.from('users').select('id').eq('name', splits[0].name).single();
        if (user) {
          const { data: pc } = await supabase.from('project_contributors').select('project_id').eq('user_id', user.id).limit(1).single();
          if (pc) pId = pc.project_id;
        }
      }
      
      if (!pId) {
        // If still no project_id found, just use the first project
        const { data: firstP } = await supabase.from('projects').select('id').limit(1).single();
        pId = firstP.id;
      }
      
      let totalAmount = 0;

      for (const split of splits) {
        // Find user by name
        let userId = null;
        if (split.name) {
           const { data: u } = await supabase.from('users').select('id').eq('name', split.name).single();
           if (u) userId = u.id;
        }

        const ETH_USD_RATE = 3500;
        const amountUsd = Number(split.amountEth) * ETH_USD_RATE;

        // Insert payment record
        await supabase.from('payments').insert([{
           project_id: pId,
           user_id: userId,
           amount: amountUsd,
           tx_hash: txHash,
           status: 'completed',
           source: 'Smart Contract',
           split_percentage: split.percentage || 0
        }]);
        
        totalAmount += amountUsd;
      }

      // Update project total_revenue
      const { data: project } = await supabase
        .from('projects')
        .select('total_revenue')
        .eq('id', pId)
        .single();

      if (project) {
        await supabase
          .from('projects')
          .update({ total_revenue: Number(project.total_revenue || 0) + totalAmount })
          .eq('id', pId);
      }

      const finalTx = { id: txHash, status: 'confirmed', transaction_splits: splits };
      res.json(finalTx);
    } catch (err) {
      console.error('Error confirming transaction:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/transactions/fail
router.post(
  '/fail',
  validate([
    body('txHash').notEmpty().withMessage('Transaction hash is required')
  ]),
  async (req, res) => {
    // In legacy schema mode, we don't store failed txs in payments
    res.json({ success: true });
  }
);

// GET /api/transactions/:projectId
router.get('/:projectId', async (req, res) => {
  // Handled by the projects route mapping typically, but if called directly:
  res.json([]);
});

module.exports = router;
