-- ============================================================
-- LUNIM / Moonstone Dashboard — Full Restore Seed
-- 5 Projects · 29 Rights Holders · Payment History
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Clean existing data (order matters for FK constraints)
DELETE FROM payments;
DELETE FROM project_contributors;
DELETE FROM projects;
DELETE FROM users WHERE email LIKE '%@moonstone.io';

-- 2. Create 29 Users
INSERT INTO users (id, name, email, wallet_address, role) VALUES
  (gen_random_uuid(), 'Zara Kimani',       'zara.kimani@moonstone.io',       '0xA1b2C3d4E5f6A7B8C9D0E1F2a3B4c5D6e7F8a9B0', 'Director'),
  (gen_random_uuid(), 'Cole Hartfield',    'cole.hartfield@moonstone.io',    '0xB2c3D4e5F6a7B8c9D0e1F2A3b4C5d6E7f8A9b0C1', 'Lead Actor'),
  (gen_random_uuid(), 'Nadia Volkov',      'nadia.volkov@moonstone.io',      '0xC3d4E5f6A7b8C9d0E1f2A3B4c5D6e7F8a9B0c1D2', 'Producer'),
  (gen_random_uuid(), 'Bayo Akinwande',    'bayo.akinwande@moonstone.io',    '0xD4e5F6a7B8c9D0e1F2a3B4C5d6E7f8A9b0C1d2E3', 'Supporting Actor'),
  (gen_random_uuid(), 'Mei-Xing Zhao',     'mei-xing.zhao@moonstone.io',     '0xE5f6A7b8C9d0E1f2A3b4C5D6e7F8a9B0c1D2e3F4', 'Music Composer'),
  (gen_random_uuid(), 'Soren Lindqvist',   'soren.lindqvist@moonstone.io',   '0xF6a7B8c9D0e1F2a3B4c5D6E7f8A9b0C1d2E3f4A5', 'Cinematographer'),
  (gen_random_uuid(), 'Priya Sharma',      'priya.sharma@moonstone.io',      '0xa7B8c9D0e1F2a3B4c5D6e7F8A9b0C1d2E3f4A5b6', 'Editor'),
  (gen_random_uuid(), 'Luca Moretti',      'luca.moretti@moonstone.io',      '0xB8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7', 'Sound Designer'),
  (gen_random_uuid(), 'Amara Osei',        'amara.osei@moonstone.io',        '0xc9D0e1F2a3B4c5D6e7F8a9B0C1d2E3f4A5b6C7d8', 'Costume Designer'),
  (gen_random_uuid(), 'Kai Nakamura',      'kai.nakamura@moonstone.io',      '0xD0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9', 'VFX Supervisor'),
  (gen_random_uuid(), 'Elena Vasquez',     'elena.vasquez@moonstone.io',     '0xe1F2a3B4c5D6e7F8a9B0c1D2E3f4A5b6C7d8E9f0', 'Production Manager'),
  (gen_random_uuid(), 'Tobias Richter',    'tobias.richter@moonstone.io',    '0xF2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1', 'Gaffer'),
  (gen_random_uuid(), 'Fatima Al-Hassan',  'fatima.alhassan@moonstone.io',   '0xa3B4c5D6e7F8a9B0c1D2e3F4A5b6C7d8E9f0A1b2', 'Script Supervisor'),
  (gen_random_uuid(), 'Dmitri Petrov',     'dmitri.petrov@moonstone.io',     '0xB4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3', 'Stunt Coordinator'),
  (gen_random_uuid(), 'Yuna Park',         'yuna.park@moonstone.io',         '0xc5D6e7F8a9B0c1D2e3F4a5B6C7d8E9f0A1b2C3d4', 'Art Director'),
  (gen_random_uuid(), 'Rafael Santos',     'rafael.santos@moonstone.io',     '0xD6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5', 'Location Manager'),
  (gen_random_uuid(), 'Ingrid Larsen',     'ingrid.larsen@moonstone.io',     '0xe7F8a9B0c1D2e3F4a5B6c7D8E9f0A1b2C3d4E5f6', 'Colorist'),
  (gen_random_uuid(), 'Marcus Chen',       'marcus.chen@moonstone.io',       '0xF8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7', 'Foley Artist'),
  (gen_random_uuid(), 'Aaliya Patel',      'aaliya.patel@moonstone.io',      '0xa9B0c1D2e3F4a5B6c7D8e9F0A1b2C3d4E5f6A7b8', 'Casting Director'),
  (gen_random_uuid(), 'Felix Braun',       'felix.braun@moonstone.io',       '0xB0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9', 'Key Grip'),
  (gen_random_uuid(), 'Chioma Eze',        'chioma.eze@moonstone.io',        '0xc1D2e3F4a5B6c7D8e9F0a1B2C3d4E5f6A7b8C9d0', 'Makeup Artist'),
  (gen_random_uuid(), 'Anders Svensson',   'anders.svensson@moonstone.io',   '0xD2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1', 'Props Master'),
  (gen_random_uuid(), 'Rosa Delgado',      'rosa.delgado@moonstone.io',      '0xe3F4a5B6c7D8e9F0a1B2c3D4E5f6A7b8C9d0E1f2', 'Dialect Coach'),
  (gen_random_uuid(), 'Kenji Tanaka',      'kenji.tanaka@moonstone.io',      '0xF4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3', 'Steadicam Operator'),
  (gen_random_uuid(), 'Anais Dupont',      'anais.dupont@moonstone.io',      '0xa5B6c7D8e9F0a1B2c3D4e5F6A7b8C9d0E1f2A3b4', 'Set Designer'),
  (gen_random_uuid(), 'Emeka Okonkwo',     'emeka.okonkwo@moonstone.io',     '0xB6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5', 'Unit Manager'),
  (gen_random_uuid(), 'Hana Yoshida',      'hana.yoshida@moonstone.io',      '0xc7D8e9F0a1B2c3D4e5F6a7B8C9d0E1f2A3b4C5d6', 'Score Arranger'),
  (gen_random_uuid(), 'Viktor Novak',      'viktor.novak@moonstone.io',      '0xD8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7', 'DIT Supervisor'),
  (gen_random_uuid(), 'Leila Khoury',      'leila.khoury@moonstone.io',      '0xe9F0a1B2c3D4e5F6a7B8c9D0E1f2A3b4C5d6E7f8', 'Line Producer')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, wallet_address = EXCLUDED.wallet_address, role = EXCLUDED.role;

-- 3. Create 5 Projects (matching screenshots)
INSERT INTO projects (id, name, description, status, type, total_revenue, created_at) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Dust & Dynasty',  'Epic period drama spanning three generations.', 'Active', 'Film',          0, '2025-09-15T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000002', 'The Salt Coast',  'Coastal thriller set in a remote fishing village.', 'Active', 'Series',   0, '2025-10-01T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000003', 'Glass Republic',  'Futuristic dystopian narrative.', 'Active', 'Film',                        0, '2025-10-20T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000004', 'Binary Fault',    'Cyberpunk tech thriller.', 'Active', 'Tech Thriller',                      0, '2025-11-05T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000005', 'Neon Requiem',    'Neon-lit noir mystery in a rain-soaked megacity.', 'Active', 'Film Noir',  0, '2025-11-20T10:00:00Z')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, type = EXCLUDED.type;

-- 4. Link Contributors to Projects (29 total, ~5-6 per project, each project = 100%)

-- Dust & Dynasty (6 contributors = 100%)
INSERT INTO project_contributors (project_id, user_id, revenue_share, role) 
SELECT 'p1000000-0000-0000-0000-000000000001', id, share, r FROM (VALUES
  ('zara.kimani@moonstone.io',      27, 'Director'),
  ('cole.hartfield@moonstone.io',   21, 'Lead Actor'),
  ('nadia.volkov@moonstone.io',     16, 'Producer'),
  ('bayo.akinwande@moonstone.io',   14, 'Supporting Actor'),
  ('mei-xing.zhao@moonstone.io',    12, 'Music Composer'),
  ('soren.lindqvist@moonstone.io',  10, 'Cinematographer')
) AS v(email, share, r)
JOIN users u ON u.email = v.email;

-- The Salt Coast (6 contributors = 100%)
INSERT INTO project_contributors (project_id, user_id, revenue_share, role)
SELECT 'p1000000-0000-0000-0000-000000000002', id, share, r FROM (VALUES
  ('priya.sharma@moonstone.io',     25, 'Editor'),
  ('luca.moretti@moonstone.io',     20, 'Sound Designer'),
  ('amara.osei@moonstone.io',       18, 'Costume Designer'),
  ('kai.nakamura@moonstone.io',     15, 'VFX Supervisor'),
  ('elena.vasquez@moonstone.io',    12, 'Production Manager'),
  ('tobias.richter@moonstone.io',   10, 'Gaffer')
) AS v(email, share, r)
JOIN users u ON u.email = v.email;

-- Glass Republic (6 contributors = 100%)
INSERT INTO project_contributors (project_id, user_id, revenue_share, role)
SELECT 'p1000000-0000-0000-0000-000000000003', id, share, r FROM (VALUES
  ('fatima.alhassan@moonstone.io',  24, 'Script Supervisor'),
  ('dmitri.petrov@moonstone.io',    20, 'Stunt Coordinator'),
  ('yuna.park@moonstone.io',        18, 'Art Director'),
  ('rafael.santos@moonstone.io',    15, 'Location Manager'),
  ('ingrid.larsen@moonstone.io',    13, 'Colorist'),
  ('marcus.chen@moonstone.io',      10, 'Foley Artist')
) AS v(email, share, r)
JOIN users u ON u.email = v.email;

-- Binary Fault (6 contributors = 100%)
INSERT INTO project_contributors (project_id, user_id, revenue_share, role)
SELECT 'p1000000-0000-0000-0000-000000000004', id, share, r FROM (VALUES
  ('aaliya.patel@moonstone.io',     26, 'Casting Director'),
  ('felix.braun@moonstone.io',      20, 'Key Grip'),
  ('chioma.eze@moonstone.io',       17, 'Makeup Artist'),
  ('anders.svensson@moonstone.io',  15, 'Props Master'),
  ('rosa.delgado@moonstone.io',     12, 'Dialect Coach'),
  ('kenji.tanaka@moonstone.io',     10, 'Steadicam Operator')
) AS v(email, share, r)
JOIN users u ON u.email = v.email;

-- Neon Requiem (5 contributors = 100%)
INSERT INTO project_contributors (project_id, user_id, revenue_share, role)
SELECT 'p1000000-0000-0000-0000-000000000005', id, share, r FROM (VALUES
  ('anais.dupont@moonstone.io',     28, 'Set Designer'),
  ('emeka.okonkwo@moonstone.io',    24, 'Unit Manager'),
  ('hana.yoshida@moonstone.io',     20, 'Score Arranger'),
  ('viktor.novak@moonstone.io',     16, 'DIT Supervisor'),
  ('leila.khoury@moonstone.io',     12, 'Line Producer')
) AS v(email, share, r)
JOIN users u ON u.email = v.email;

-- 5. Seed Payment History (matching screenshot: multiple transactions across projects)
-- We'll create transactions with realistic amounts stored in CENTS

-- Transaction batch 1: Apr 30
INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000002', u.id, 
  ROUND(pc.revenue_share * 320), -- $320 total → each gets share
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd01',
  'completed', 'Client Payment', '2026-04-30T14:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000002';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000003', u.id,
  ROUND(pc.revenue_share * 320),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd02',
  'completed', 'Client Payment', '2026-04-30T15:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000003';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000001', u.id,
  ROUND(pc.revenue_share * 320),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd03',
  'completed', 'Client Payment', '2026-04-30T16:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000001';

-- Transaction batch 2: May 1 (larger amounts)
INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000002', u.id,
  ROUND(pc.revenue_share * 3200),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd04',
  'completed', 'Client Payment', '2026-05-01T10:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000002';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000005', u.id,
  ROUND(pc.revenue_share * 3200),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd05',
  'completed', 'Client Payment', '2026-05-01T11:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000005';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000004', u.id,
  ROUND(pc.revenue_share * 320),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd06',
  'completed', 'Client Payment', '2026-05-01T12:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000004';

-- Additional transactions for May 5 & May 8
INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000001', u.id,
  ROUND(pc.revenue_share * 3200),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd07',
  'completed', 'Client Payment', '2026-05-05T09:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000001';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000003', u.id,
  ROUND(pc.revenue_share * 3200),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd08',
  'completed', 'Client Payment', '2026-05-08T14:30:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000003';

INSERT INTO payments (project_id, user_id, amount, tx_hash, status, source, created_at)
SELECT 'p1000000-0000-0000-0000-000000000005', u.id,
  ROUND(pc.revenue_share * 320),
  '0xaabb11223344556677889900aabbccddeeff00112233445566778899aabbccdd09',
  'completed', 'Client Payment', '2026-05-08T15:00:00Z'
FROM project_contributors pc JOIN users u ON pc.user_id = u.id
WHERE pc.project_id = 'p1000000-0000-0000-0000-000000000005';

-- 6. Update project total_revenue from actual payments
UPDATE projects SET total_revenue = sub.total FROM (
  SELECT project_id, SUM(amount) as total FROM payments GROUP BY project_id
) sub WHERE projects.id = sub.project_id;

-- Done! Verify:
-- SELECT name, total_revenue/100 as usd FROM projects ORDER BY name;
-- SELECT COUNT(*) as total_holders FROM project_contributors;
