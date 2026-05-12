/**
 * Auth Routes — PRD §12 (Auth Routes)
 * POST /api/auth/login, /api/auth/logout, /api/auth/refresh
 * POST /api/invites (admin-only invite flow)
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/auth/login — PRD §12
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch role from users_profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role, display_name, avatar_url')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: profile?.display_name || data.user.email,
        avatarUrl: profile?.avatar_url,
        role: profile?.role || 'RIGHTS_HOLDER',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      role: profile?.role || 'RIGHTS_HOLDER',
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — PRD §12
router.post('/logout', async (req, res) => {
  res.status(200).json({ message: 'Logged out' });
});

// POST /api/auth/refresh — PRD §12
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('[auth/refresh]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
