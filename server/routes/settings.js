/**
 * Settings Routes — PRD §12
 * GET /api/settings — returns all settings
 * PATCH /api/settings/:key — admin only
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/settings
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;

    const settingsMap = {};
    (data || []).forEach(s => { settingsMap[s.key] = s.value; });

    res.json(settingsMap);
  } catch (err) {
    console.error('[settings/get]', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PATCH /api/settings/:key — admin only
router.patch('/:key', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const { data, error } = await supabase
      .from('settings')
      .update({ value: String(value) })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: `Setting '${key}' not found` });
    }

    res.json({ key: data.key, value: data.value });
  } catch (err) {
    console.error('[settings/patch]', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

module.exports = router;
