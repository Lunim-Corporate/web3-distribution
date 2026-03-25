# 🚀 Quick Database Setup Checklist

## ✅ Pre-Setup (5 minutes)

- [ ] Have Supabase project URL ready
- [ ] Have Supabase anon key ready  
- [ ] Have Supabase service role key ready
- [ ] Access to Supabase SQL Editor
- [ ] Copy of `SUPABASE_SETUP_COMPLETE.sql` file

---

## ✅ Database Setup (2 minutes)

1. [ ] Open **SUPABASE_SETUP_COMPLETE.sql** in this project
2. [ ] Copy all SQL code (Ctrl+A, Ctrl+C)
3. [ ] Go to Supabase Dashboard → **SQL Editor**
4. [ ] Click **"+ New Query"**
5. [ ] Paste SQL code (Ctrl+V)
6. [ ] Click **"RUN"** button
7. [ ] Wait for completion (should take 10-15 seconds)
8. [ ] See green checkmark and verification results

---

## ✅ Verify Database (2 minutes)

Check you see these in output:
- [ ] "Tables Created" - Shows ~7 tables
- [ ] "Demo Users" - Shows 5 users
- [ ] "Demo Projects" - Shows 5 projects
- [ ] "Total Revenue" - Shows large number

Go to Supabase **Tables** → See 7 tables with data:
- [ ] `users` (5 rows)
- [ ] `projects` (5 rows)
- [ ] `project_contributors` (12 rows)
- [ ] `payments` (11 rows)
- [ ] `creative_rights` (8 rows)
- [ ] `milestones` (11 rows)
- [ ] `activities` (10 rows)

---

## ✅ App Configuration (5 minutes)

1. [ ] Create `.env.local` file in project root
2. [ ] Add these variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_CHAIN_ID=31337
```

3. [ ] Save `.env.local` file
4. [ ] Make sure `.env.local` is in `.gitignore` (it is by default)

---

## ✅ Start Application (3 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# App will be available at http://localhost:3000
```

---

## ✅ Test Login (1 minute)

1. [ ] Navigate to http://localhost:3000
2. [ ] Click "Use Demo Login" OR log in with:
   - **Email**: `admin@creative.com`
   - **Password**: `demo123`
3. [ ] See dashboard with 5 projects and revenue data
4. [ ] Verify all features work (charts, payments, projects, etc.)

---

## ✅ Test Web3 Features (Optional - 5 minutes)

1. [ ] Install MetaMask browser extension (if not already)
2. [ ] Switch MetaMask to Hardhat network (localhost:8545)
3. [ ] Go to dashboard → **Smart Contract Panel**
4. [ ] Click **"Connect Wallet"**
5. [ ] Approve MetaMask popup
6. [ ] Should see wallet address and balance
7. [ ] Test sending ETH or releasing payments

---

## ❌ Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Table already exists" | Ignore warning - run all SQL anyway |
| "Duplicate key" | SQL handles it - continue running |
| No data in tables | Re-run entire SQL code |
| App can't connect to database | Check `.env.local` keys are correct |
| "MetaMask not found" | Install MetaMask extension first |
| Build errors | Run `npm run lint` to check, then `npm run build` |

---

## 📊 Demo Account Logins

| Email | Password | Role | Projects |
|-------|----------|------|----------|
| `admin@creative.com` | demo123 | Admin | All |
| `creator@creative.com` | demo123 | Creator | Own projects |
| `alex@creative.com` | demo123 | Creator | Own projects |
| `emma@creative.com` | demo123 | Contributor | View only |
| `david@creative.com` | demo123 | Contributor | View only |

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `SUPABASE_SETUP_COMPLETE.sql` | Complete SQL for database setup |
| `SUPABASE_DATABASE_SETUP.md` | Detailed setup guide |
| `.env.local` | Your Supabase credentials (CREATE THIS) |
| `src/app/lib/database.ts` | Database functions used by app |
| `src/app/lib/auth.tsx` | User authentication |

---

## 🔐 Important Security Notes

✅ **Do this:**
- Keep `.env.local` file **private** (never commit to git)
- Use `SUPABASE_SERVICE_ROLE_KEY` only on **server side** 
- Share `NEXT_PUBLIC_SUPABASE_ANON_KEY` only with trusted clients
- Enable Row Level Security (RLS) policies in Supabase

❌ **Don't do this:**
- Don't hardcode keys in source code
- Don't commit `.env.local` to git
- Don't share service role key
- Don't disable RLS without good reason

---

## ✨ Success Indicators

After setup, you should see:
- ✅ Dashboard loads with 5 projects
- ✅ Revenue charts show data
- ✅ All 5 demo users are visible
- ✅ Payment records display correctly
- ✅ Milestones and creative rights appear
- ✅ Web3 panel works (if MetaMask connected)
- ✅ No console errors
- ✅ Build succeeds: `npm run build`

---

## 📞 Need Help?

1. Check `SUPABASE_DATABASE_SETUP.md` for detailed info
2. Review `.env.local` - most issues are missing/wrong keys
3. Check Supabase Dashboard to verify tables exist
4. Look at browser console (F12) for error messages
5. Run `npm run lint` to check for code issues

---

## 🎉 Next Steps After Setup

1. Explore the dashboard with demo data
2. Create new projects and add contributors
3. Record payments and track revenue
4. Test payment splitting logic
5. Set up smart contracts (optional - see README.md)
6. Customize theme and settings
7. Deploy to production (Vercel recommended)

---

**Total Setup Time: ~15 minutes**

**Status: Ready for Production** ✅
