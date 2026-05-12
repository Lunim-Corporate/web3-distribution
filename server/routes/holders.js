const express = require('express');
const { body } = require('express-validator');
const { supabaseAdmin } = require('../lib/supabase');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// GET /api/holders/:projectId
router.get('/:projectId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rights_holders')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('percentage', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/holders/:id
router.patch('/:id', async (req, res) => {
  try {
    const holderId = req.params.id;
    const updates = req.body;

    // Fetch the holder first to get project_id if updating percentage
    const { data: currentHolder, error: fetchError } = await supabaseAdmin
      .from('rights_holders')
      .select('project_id')
      .eq('id', holderId)
      .single();

    if (fetchError) throw fetchError;

    if (updates.percentage !== undefined) {
      // Validate all holders for this project sum to 100
      const { data: allHolders, error: allError } = await supabaseAdmin
        .from('rights_holders')
        .select('id, percentage')
        .eq('project_id', currentHolder.project_id);

      if (allError) throw allError;

      const newSum = allHolders.reduce((acc, h) => {
        return acc + Number(h.id === holderId ? updates.percentage : h.percentage);
      }, 0);

      if (Math.abs(newSum - 100) > 0.01) {
        return res.status(400).json({ message: 'Total percentages for project must sum to exactly 100%' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('rights_holders')
      .update(updates)
      .eq('id', holderId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
