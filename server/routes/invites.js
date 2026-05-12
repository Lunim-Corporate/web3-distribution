/**
 * Invites Routes — PRD §12
 * GET /api/invites — list all invites (admin only)
 * POST /api/invites — send invite (admin only)
 * POST /api/invites/:id/resend — resend invite (admin only)
 * DELETE /api/invites/:id — revoke invite (admin only)
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/invites — admin only
router.get('/', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[invites/list]', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// POST /api/invites — send new invite
router.post('/', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const { email, projectId, role = 'RIGHTS_HOLDER' } = req.body;

    if (!email || !projectId) {
      return res.status(400).json({ error: 'Email and projectId are required' });
    }

    // Generate single-use invite token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invite record
    const { data: invite, error: inviteErr } = await supabase
      .from('invites')
      .insert({
        email,
        role,
        project_id: projectId,
        token,
        sent_by: req.user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteErr) throw inviteErr;

    // Send Supabase invite email
    try {
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role, project_id: projectId, invite_token: token },
      });
    } catch (emailErr) {
      console.warn('[invites] Email send failed:', emailErr.message);
      // Invite record still exists — admin can resend
    }

    res.status(201).json(invite);
  } catch (err) {
    console.error('[invites/create]', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// POST /api/invites/:id/resend
router.post('/:id/resend', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: invite } = await supabase
      .from('invites')
      .select('*')
      .eq('id', id)
      .single();

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Generate new token and reset expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    await supabase
      .from('invites')
      .update({
        token: newToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', id);

    // Resend invite email
    try {
      await supabase.auth.admin.inviteUserByEmail(invite.email, {
        data: { role: invite.role, project_id: invite.project_id, invite_token: newToken },
      });
    } catch (emailErr) {
      console.warn('[invites] Resend email failed:', emailErr.message);
    }

    res.json({ message: 'Invite resent' });
  } catch (err) {
    console.error('[invites/resend]', err);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
});

// DELETE /api/invites/:id — revoke
router.delete('/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('invites').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    console.error('[invites/revoke]', err);
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

module.exports = router;
