# Creative Rights Tracker - Complete Setup Guide

## 📋 Table of Contents
1. [Supabase Database Setup](#supabase-database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Running the Application](#running-the-application)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Troubleshooting](#troubleshooting)

---

## 🗄️ Supabase Database Setup

### Prerequisites
- A Supabase account
- Access to Supabase SQL Editor

### Step-by-Step Migration Instructions

#### **Step 1: Log into Supabase**
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

#### **Step 2: Create Tables - Run Each Section Below**

Copy and paste EACH section below into Supabase SQL Editor and click **Run**.

---

### **SECTION 1: Create Users Table**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'contributor',
  avatar_url TEXT,
  wallet_address VARCHAR(255),
  wallet_connected BOOLEAN DEFAULT FALSE,
  wallet_connected_at TIMESTAMP,
  preferred_payment_method VARCHAR(50) DEFAULT 'traditional',
  total_earnings BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
```

**Status:** ✅ User management with roles (admin, creator, contributor)

---

### **SECTION 2: Create Projects Table**

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  total_revenue BIGINT DEFAULT 0,
  progress INTEGER DEFAULT 0,
  cover_image_url TEXT,
  contract_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

**Status:** ✅ Projects with revenue tracking and metadata

---

### **SECTION 3: Create Project Contributors Table**

```sql
CREATE TABLE IF NOT EXISTS project_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  revenue_share NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_contributors_project_id ON project_contributors(project_id);
CREATE INDEX idx_project_contributors_user_id ON project_contributors(user_id);
```

**Status:** ✅ Track contributor revenue shares and earnings

---

### **SECTION 4: Create Payments Table**

```sql
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  source VARCHAR(255),
  tx_hash VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
```

**Status:** ✅ Payment recording with blockchain support

**❗ Important:** Amounts in `amount_cents` are stored in CENTS. Example:
- $100 USD = 10000 cents
- £50 GBP = 5000 cents

---

### **SECTION 5: Create Creative Rights Table**

```sql
CREATE TABLE IF NOT EXISTS creative_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rights_type VARCHAR(255) NOT NULL,
  revenue_share NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  expiration_date TIMESTAMP,
  renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_creative_rights_project_id ON creative_rights(project_id);
CREATE INDEX idx_creative_rights_owner_id ON creative_rights(owner_id);
CREATE INDEX idx_creative_rights_status ON creative_rights(status);
CREATE INDEX idx_creative_rights_expiration_date ON creative_rights(expiration_date);
```

**Status:** ✅ Track creative rights (master, composition, publishing, etc.)

---

### **SECTION 6: Create Milestones Table**

```sql
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  target_amount BIGINT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_date ON milestones(date);
CREATE INDEX idx_milestones_status ON milestones(status);
```

**Status:** ✅ Project milestones and deadlines

---

### **SECTION 7: Create Activities Table**

```sql
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
```

**Status:** ✅ Audit trail of all system activities

---

### **SECTION 8: Create Distribution History Table**

```sql
CREATE TABLE IF NOT EXISTS distribution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_contributor_id UUID REFERENCES project_contributors(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  share_percentage NUMERIC(5,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distribution_history_payment_id ON distribution_history(payment_id);
CREATE INDEX idx_distribution_history_contributor_id ON distribution_history(contributor_id);
CREATE INDEX idx_distribution_history_status ON distribution_history(status);
```

**Status:** ✅ Track automatic payment distribution to contributors

---

### **SECTION 9: Create Analytics Views**

```sql
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT 
  p.id,
  p.name,
  p.owner_id,
  u.name AS owner_name,
  p.status,
  COALESCE(SUM(pay.amount_cents), 0)::BIGINT as total_revenue,
  COUNT(DISTINCT pc.id)::INTEGER as contributor_count,
  COUNT(DISTINCT cr.id)::INTEGER as total_rights,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'completed'
LEFT JOIN project_contributors pc ON p.id = pc.project_id
LEFT JOIN creative_rights cr ON p.id = cr.project_id
GROUP BY p.id, p.name, p.owner_id, u.name, p.status, p.created_at, p.updated_at;
```

**Status:** ✅ Project revenue analysis view

---

### **SECTION 10: Create Contributor Earnings View**

```sql
CREATE OR REPLACE VIEW contributor_earnings AS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT pc.project_id)::INTEGER as projects_involved,
  COUNT(DISTINCT cr.id)::INTEGER as rights_owned,
  COALESCE(SUM(dh.amount_cents), 0)::BIGINT as total_earned,
  COALESCE(SUM(CASE WHEN dh.status = 'pending' THEN dh.amount_cents ELSE 0 END), 0)::BIGINT as pending_earnings,
  u.created_at
FROM users u
LEFT JOIN project_contributors pc ON u.id = pc.user_id
LEFT JOIN creative_rights cr ON u.id = cr.owner_id
LEFT JOIN distribution_history dh ON u.id = dh.contributor_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.created_at;
```

**Status:** ✅ Contributor earnings summary

---

### **SECTION 11: Create Monthly Revenue Trend View**

```sql
CREATE OR REPLACE VIEW monthly_revenue_trend AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  DATE_TRUNC('month', pay.payment_date)::DATE as month,
  COALESCE(SUM(pay.amount_cents), 0)::BIGINT as monthly_revenue,
  COUNT(DISTINCT pay.id)::INTEGER as transaction_count
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'completed'
GROUP BY p.id, p.name, DATE_TRUNC('month', pay.payment_date)
ORDER BY p.id, month DESC;
```

**Status:** ✅ Monthly revenue trends for reporting

---

## 🔧 Environment Configuration

### Create `.env.local` file in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Web3 Configuration (Optional - only if using blockchain)
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=31337

# Optional API Keys
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
```

### To get Supabase credentials:
1. Go to Project Settings → API
2. Copy **Project URL** and paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key and paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key and paste as `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 Running the Application

### Development Mode
```bash
npm install
npm run dev
```
Visit: http://localhost:3000

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

---

## 📁 Project Structure

```
/src/app
├── /api                    # API routes (backend)
│   ├── /projects          # Project management endpoints
│   ├── /revenue           # Revenue tracking endpoints
│   ├── /rights            # Creative rights endpoints
│   ├── /payments          # Payment recording endpoints
│   └── /milestones        # Milestone management endpoints
├── /components
│   ├── /dashboard         # Dashboard widgets
│   ├── /ui                # Reusable UI components
│   └── ClientLayout.tsx   # Theme and client provider
├── /lib
│   ├── auth.tsx          # Authentication context
│   ├── database.ts       # Database functions
│   ├── types.ts          # TypeScript interfaces
│   ├── utils.ts          # Formatting utilities
│   └── supabaseClient.ts # Supabase client instance
├── /dashboard            # Main dashboard page
├── /login                # Login page
├── /signup               # Signup page
└── /project/[id]         # Project detail page
```

---

## ✨ Core Features

### 1. **Project Management**
- Create and manage creative projects
- Track project status and progress
- Link projects to blockchain contracts

### 2. **Revenue Tracking**
- Record all revenue sources
- Automatic distribution to contributors
- Monthly revenue analytics
- Multi-currency support (GBP)

### 3. **Creative Rights Management**
- Track multiple right types (master, composition, publishing)
- Set expiration dates
- Monitor revenue share allocations
- Rights transfer tracking

### 4. **Contributor Management**
- Multi-role access (admin, creator, contributor)
- Revenue share allocation
- Earnings tracking
- Wallet integration (MetaMask)

### 5. **Analytics & Reporting**
- Revenue trends by month
- Contributor earnings summaries
- Project revenue breakdowns
- Interactive charts and dashboards

---

## 🐛 Troubleshooting

### Build Errors

**Error: "Cannot find module '@/lib/database'"**
- Solution: Check that file path matches the import statement
- Verify `tsconfig.json` has correct path alias: `"@/*": ["./src/app/*"]`

**Error: "Supabase connection failed"**
- Solution: Check `.env.local` has correct credentials
- Verify Supabase project is active
- Test connection in Supabase Dashboard

### Database Issues

**Error: "Table does not exist"**
- Solution: Run migration sections 1-8 from this guide
- Verify all sections completed successfully

**Error: "Foreign key constraint violation"**
- Solution: Ensure parent records exist before creating child records
- Check references in database schema

### Authentication Problems

**User cannot login**
- Solution: Check localStorage for `crt_user` key
- Verify user role is set correctly in database
- Clear browser cache and try again

---

## 📞 Support

For issues, check:
1. Browser console for JavaScript errors
2. Network tab for API response errors
3. Supabase dashboard for database errors
4. `.env.local` for missing environment variables

---

**Last Updated:** March 23, 2026
**Version:** 1.0.0
