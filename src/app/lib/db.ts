import 'server-only';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;

  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'app.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      total_revenue REAL NOT NULL,
      pending_payments REAL NOT NULL,
      creator_id TEXT NOT NULL,
      created_date TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      contract_address TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      progress REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_contributors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      contributor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      avatar TEXT NOT NULL,
      revenue_share REAL NOT NULL,
      total_earned REAL NOT NULL,
      role TEXT NOT NULL,
      wallet_address TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topups (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      creator_user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS distributions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      creator_user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      chain_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS distribution_items (
      id TEXT PRIMARY KEY,
      distribution_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      contributor_user_id TEXT NOT NULL,
      contributor_wallet TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      chain_id INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
    CREATE INDEX IF NOT EXISTS idx_topups_creator ON topups(creator_user_id);
    CREATE INDEX IF NOT EXISTS idx_topups_project ON topups(project_id);
    CREATE INDEX IF NOT EXISTS idx_distributions_project ON distributions(project_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_items_contributor ON distribution_items(contributor_user_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_items_project ON distribution_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_items_distribution ON distribution_items(distribution_id);
    CREATE INDEX IF NOT EXISTS idx_project_contributors_project ON project_contributors(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_contributors_contributor ON project_contributors(contributor_id);
  `);

  return db;
}
