const express = require('express');
const { body } = require('express-validator');
const { supabaseAdmin } = require('../lib/supabase');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        rights_holders (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Shape data and sort holders by percentage DESC
    const shaped = projects.map(p => {
      return {
        ...p,
        rightsHolders: (p.rights_holders || []).sort((a, b) => b.percentage - a.percentage)
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`*, rights_holders (*)`)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(`*, transaction_splits (*)`)
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) throw txError;

    res.json({
      ...project,
      rightsHolders: (project.rights_holders || []).sort((a, b) => b.percentage - a.percentage),
      transactions: transactions || []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post('/', [
  body('name').notEmpty(),
  body('rightsHolders').isArray(),
  validateRequest
], async (req, res) => {
  try {
    const { name, genre, description, poster_url, status, rightsHolders } = req.body;
    
    const sum = rightsHolders.reduce((acc, h) => acc + Number(h.percentage), 0);
    if (Math.abs(sum - 100) > 0.01) {
      return res.status(400).json({ message: 'Percentages must sum to exactly 100' });
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({ name, genre, description, poster_url, status: status || 'active' })
      .select()
      .single();

    if (error) throw error;

    const holdersToInsert = rightsHolders.map(h => ({
      project_id: project.id,
      ...h
    }));

    const { error: holdersError } = await supabaseAdmin
      .from('rights_holders')
      .insert(holdersToInsert);

    if (holdersError) throw holdersError;

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/sync-contract
router.post('/sync-contract', [
  body('projectId').notEmpty(),
  body('contractAddress').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { projectId, contractAddress } = req.body;
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ contract_address: contractAddress })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
