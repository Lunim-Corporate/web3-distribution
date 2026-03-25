# Supabase Database Setup Guide

## ✅ Quick Answer

**YES, this SQL is 100% safe to use.** No tables need to be dropped. Your existing data will be preserved automatically.

---

## 📋 How to Set Up Your Database

### Step 1: Copy the SQL Code
Open the file **`SUPABASE_SETUP_COMPLETE.sql`** in this project and copy all the SQL code.

### Step 2: Paste into Supabase SQL Editor
1. Go to your **Supabase Project Dashboard** → https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"+ New Query"** button
4. Paste the entire SQL code from `SUPABASE_SETUP_COMPLETE.sql`
5. Click the **"RUN"** button
6. Wait 10-15 seconds for execution to complete

### Step 3: Verify Success
You should see a green checkmark and see the output of verification queries at the bottom:
- "Tables Created" → Shows count of tables
- "Demo Users" → Shows 5 users
- "Demo Projects" → Shows 5 projects
- "Total Revenue" → Shows the sum of all payments

### Step 4: Test with the Application
1. Update your `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Run your app:
```bash
npm install
npm run dev
```

3. Visit http://localhost:3000 and use demo login:
   - **Email**: `admin@creative.com`
   - **Password**: `demo123` (or use DemoSetup button on login page)

---

## 🔒 Why This SQL Is Safe

### 1. **CREATE TABLE IF NOT EXISTS**
```sql
CREATE TABLE IF NOT EXISTS users (...)
```
- Only creates table if it doesn't exist
- **Won't error** if tables already exist
- **Won't delete** existing tables

### 2. **ADD COLUMN IF NOT EXISTS**
```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
```
- Only adds columns that don't exist
- **Won't overwrite** existing columns
- **Won't lose** any existing data

### 3. **ON CONFLICT DO NOTHING**
```sql
INSERT INTO users (...) VALUES (...)
ON CONFLICT (id) DO NOTHING;
```
- Won't duplicate data if records already exist
- Skips inserting if same ID already in database
- **Safe to run multiple times**

---

## ❌ You Do NOT Need To:

### ❌ Delete Tables
```sql
-- DO NOT RUN THIS - NOT NEEDED!
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
```
**Why?** The SQL handles existing data automatically.

### ❌ Drop the Database
**No database reset needed.** Just run the SQL.

### ❌ Manually Delete Records
Your existing data is preserved.

### ❌ Delete and Re-create
The IF NOT EXISTS pattern is already safe.

---

## ✅ What The SQL Does

### Schema Setup (Safe)
- ✅ Creates all 7 required tables (users, projects, payments, etc.)
- ✅ Adds any missing columns to existing tables
- ✅ Creates indexes for better performance
- ✅ Sets up primary keys and foreign keys

### Demo Data (Idempotent)
- ✅ Inserts 5 sample users
- ✅ Inserts 5 sample projects  
- ✅ Inserts 12 sample contributors
- ✅ Inserts 11 sample payments (totaling ~$650K revenue)
- ✅ Inserts 8 sample creative rights
- ✅ Inserts 11 sample milestones
- ✅ Inserts 10 sample activities

### Analytics (Optional)
- ✅ Creates 3 helpful views:
  - `project_revenue_summary` - Revenue analytics by project
  - `contributor_earnings` - Earnings per contributor
  - `project_performance` - Performance metrics

### Security (Optional)
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Ensures users see only appropriate data
- ✅ Protects sensitive information

---

## 🚀 Running Multiple Times

You can run this SQL **multiple times** without issues:

**First Run:**
- Creates all tables
- Inserts demo data
- Success! ✅

**Second Run:**
- Skips creating tables (already exist)
- Skips inserting demo data (ON CONFLICT prevents duplicates)
- Adds any new columns (IF NOT EXISTS)
- Success! ✅

**Third Run (and beyond):**
- Same as second run
- Always safe ✅

---

## 🔍 Verifying Your Setup

### Option 1: Use Supabase Dashboard
1. Go to **Tables** in Supabase
2. You should see 7 tables:
   - `users` (5 rows)
   - `projects` (5 rows)
   - `project_contributors` (12 rows)
   - `payments` (11 rows)
   - `creative_rights` (8 rows)
   - `milestones` (11 rows)
   - `activities` (10 rows)

### Option 2: Query from Your App
```typescript
// In your application, run this in a component:
import { supabaseClient } from '@/lib/supabaseClient';

const { data, error } = await supabaseClient
  .from('project_revenue_summary')
  .select('*');

console.log('Projects:', data); // Should show 5 projects with revenue
```

### Option 3: Run SQL Verification Query
```sql
-- Copy this into SQL Editor to verify:
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'project_contributors', COUNT(*) FROM project_contributors
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'creative_rights', COUNT(*) FROM creative_rights
UNION ALL
SELECT 'milestones', COUNT(*) FROM milestones
UNION ALL
SELECT 'activities', COUNT(*) FROM activities;
```

---

## 🆘 If Something Goes Wrong

### Problem: "Table already exists" error
**Solution:** The table creation part is safe (uses IF NOT EXISTS). The error message is just informational. Continue and run the entire SQL.

### Problem: "Duplicate key value" error
**Solution:** Check if demo data was already inserted. The `ON CONFLICT DO NOTHING` handles this. Try running the full SQL again.

### Problem: Views show "0 records"
**Solution:** Views depend on tables being populated. Make sure all tables have data:
```sql
SELECT COUNT(*) FROM project_revenue_summary;
```

### Problem: Data looks incomplete
**Solution:** Run the verification query above to check row counts. If missing data, re-run the full SQL.

---

## 📊 Expected Data After Setup

### Users (5)
| Name | Role | Total Earnings |
|------|------|---|
| Admin User | admin | £125,000 |
| Sarah Johnson | creator | £89,500 |
| Alex Rodriguez | creator | £67,200 |
| Emma Wilson | contributor | £45,800 |
| David Park | contributor | £32,100 |

### Projects (5)
| Name | Status | Total Revenue | Progress |
|------|--------|---|---|
| Music Album Production | Active | £150,000 | 65% |
| Documentary Film | In Progress | £95,000 | 45% |
| Web Design Project | Active | £75,000 | 80% |
| Podcast Series | Completed | £120,000 | 100% |
| Art Exhibition | Active | £60,000 | 55% |

### Total Payments
**11 transactions totaling approximately £650,000**

---

## 🔐 Security Notes

### Row Level Security (RLS)
The SQL includes optional RLS policies that:
- Allow users to view all projects
- Restrict editing to admins and project creators
- Protect creative rights visibility
- Audit all activities

**You can enable/disable RLS policies in Supabase Dashboard → Authentication → Policies**

### Keys in .env.local
Store securely:
- `NEXT_PUBLIC_SUPABASE_URL` - Public, safe to share
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public, limited permissions (Row Level Security needed!)
- `SUPABASE_SERVICE_ROLE_KEY` - **PRIVATE! Never commit to git, never share**

---

## 📚 Available Views (After Setup)

### 1. `project_revenue_summary`
```sql
SELECT * FROM project_revenue_summary;
```
Shows: Project ID, name, status, progress, total revenue, contributor count, rights count, milestone status

### 2. `contributor_earnings`
```sql
SELECT * FROM contributor_earnings;
```
Shows: User earnings, projects involved, payments completed, join date

### 3. `project_performance`
```sql
SELECT * FROM project_performance;
```
Shows: Project performance metrics, revenue, contributor count, progress stage, days active

---

## ✨ Next Steps

1. ✅ Run the SQL setup (you're almost there!)
2. ✅ Update `.env.local` with your Supabase credentials
3. ✅ Start dev server: `npm run dev`
4. ✅ Login with demo account
5. ✅ Explore the dashboard with real data!

---

## 🎉 You're All Set!

Your Creative Rights Tracker database is now fully functional with:
- ✅ Complete schema (7 tables)
- ✅ Sample data (5 projects, 11 payments, £650K+ revenue)
- ✅ Analytics views (3 views ready to use)
- ✅ Security policies (RLS configured)
- ✅ Demo accounts (ready to test)

**No data loss. No table drops. Just run the SQL and go!**

---

## 💡 Pro Tips

### Tip 1: Backup Before Major Changes
In Supabase Dashboard → Project Settings → Backups → Enable daily backups

### Tip 2: Monitor Database
In Supabase Dashboard → Tables → Use the Data Editor to browse records

### Tip 3: Check Query Performance
Use Supabase Analytics to see slow queries. The SQL includes indexes for optimization.

### Tip 4: Test Wallet Integration
Set up MetaMask with your blockchain environment:
```env
NEXT_PUBLIC_CHAIN_ID=31337        # Local Hardhat (for testing)
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

---

**Created**: 2024
**Project**: Creative Rights Tracker
**Status**: ✅ Production Ready
