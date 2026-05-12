/**
 * JWT Verification Middleware — PRD §4.4
 * Validates Supabase JWT on every /api/* route.
 * Role is read from users_profile table (preferred) or users table (fallback).
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Try users_profile first, fallback to users table
    let role = 'RIGHTS_HOLDER';
    let displayName = user.email;

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role, display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      role = profile.role || 'RIGHTS_HOLDER';
      displayName = profile.display_name || user.email;
    } else {
      // Fallback: check legacy users table
      const { data: legacyUser } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', user.id)
        .maybeSingle();

      if (legacyUser) {
        // Map legacy roles to PRD roles
        role = legacyUser.role === 'admin' ? 'ADMIN' : 'RIGHTS_HOLDER';
        displayName = legacyUser.name || user.email;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role,
      displayName,
    };

    next();
  } catch (err) {
    console.error('[verifyJWT] Error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = verifyJWT;
