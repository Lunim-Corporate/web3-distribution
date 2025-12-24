# Testing Guide - Role-Based Authentication & Routing

## Quick Start

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## Test Accounts

### Admin Account
- **Email**: `admin@risidio.com`
- **Role**: admin
- **Expected Route**: `/admin/dashboard`
- **Access**: All dashboards (admin, creator, contributor)

### Creator Accounts
- **Email**: `alex.rodriguez@email.com`
- **Role**: creator
- **Expected Route**: `/creator/dashboard`
- **Access**: Creator pages only (blocked from admin)

- **Email**: `sarah.kim@email.com`
- **Role**: creator
- **Expected Route**: `/creator/dashboard`
- **Access**: Creator pages only

### Contributor Accounts
- **Email**: `maya.chen@email.com`
- **Role**: contributor
- **Expected Route**: `/contributor/dashboard`
- **Access**: Contributor pages only (blocked from admin and creator)

- **Email**: `david.park@email.com`
- **Role**: contributor
- **Expected Route**: `/contributor/dashboard`
- **Access**: Contributor pages only

## Test Scenarios

### Scenario 1: Admin Login
1. Go to `/login`
2. Enter: `admin@risidio.com`
3. Click "Continue to Dashboard"
4. **Expected**: Redirected to `/admin/dashboard`
5. **Verify**: Can see platform stats, distribution mode controls
6. **Test**: Navigate to `/creator/dashboard` - Should work (admin privilege)
7. **Test**: Navigate to `/contributor/dashboard` - Should work (admin privilege)

### Scenario 2: Creator Login
1. Go to `/login`
2. Enter: `alex.rodriguez@email.com`
3. Click "Continue to Dashboard"
4. **Expected**: Redirected to `/creator/dashboard`
5. **Verify**: Can see personal projects, revenue, rights
6. **Test**: Try to access `/admin/dashboard` - Should redirect to `/unauthorized`
7. **Test**: Try to access `/contributor/dashboard` - Should redirect to `/unauthorized`
8. **Verify**: Can access `/creator/topup` and `/creator/withdraw`

### Scenario 3: Contributor Login
1. Go to `/login`
2. Enter: `maya.chen@email.com`
3. Click "Continue to Dashboard"
4. **Expected**: Redirected to `/contributor/dashboard`
5. **Verify**: Can see personal contributions and earnings
6. **Test**: Try to access `/admin/dashboard` - Should redirect to `/unauthorized`
7. **Test**: Try to access `/creator/dashboard` - Should redirect to `/unauthorized`
8. **Verify**: Can access `/contributor/settings` to connect wallet

### Scenario 4: Signup Flow
1. Go to `/signup`
2. Enter name, email, select role
3. Click "Create Account"
4. **Expected**: Redirected based on selected role:
   - Admin → `/admin/dashboard`
   - Creator → `/creator/dashboard`
   - Contributor → `/contributor/dashboard`

### Scenario 5: Direct URL Access (Unauthenticated)
1. Logout or open incognito window
2. Try to access `/admin/dashboard`
3. **Expected**: Redirected to `/login`
4. Try to access `/creator/dashboard`
5. **Expected**: Redirected to `/login`
6. Try to access `/contributor/dashboard`
7. **Expected**: Redirected to `/login`

### Scenario 6: /dashboard Redirect
1. Login as any role
2. Navigate to `/dashboard`
3. **Expected**: Automatically redirected to role-specific dashboard
4. **Verify**: No admin content visible during redirect

### Scenario 7: Data Filtering
**As Creator**:
1. Login as `alex.rodriguez@email.com`
2. Go to `/creator/projects`
3. **Verify**: Only see projects where you're a contributor
4. Go to `/creator/revenue`
5. **Verify**: Only see your revenue records

**As Contributor**:
1. Login as `maya.chen@email.com`
2. Go to `/contributor/projects`
3. **Verify**: Only see projects where you're a contributor
4. Go to `/contributor/revenue`
5. **Verify**: Only see your revenue records

### Scenario 8: Unauthorized Access
1. Login as creator
2. Manually navigate to `/admin/dashboard`
3. **Expected**: Redirected to `/unauthorized`
4. **Verify**: Unauthorized page shows:
   - Current user email
   - Current role
   - "Go to My Dashboard" button
   - "Logout" button

## API Testing

### Test User-Filtered Endpoints

```bash
# Get projects for specific user
curl http://localhost:3000/api/projects?userId=user_1

# Get revenue for specific user
curl http://localhost:3000/api/revenue?userId=user_1

# Get rights for specific user
curl http://localhost:3000/api/rights?userId=user_1

# Get users by role
curl http://localhost:3000/api/users?role=creator
```

## Middleware Testing

### Test Route Protection

**Admin Routes** (admin only):
```bash
# Should work for admin
curl -b "crt_user=..." http://localhost:3000/admin/dashboard

# Should redirect for non-admin
curl -L http://localhost:3000/admin/dashboard
```

**Creator Routes** (creator + admin):
```bash
# Should work for creator and admin
curl -b "crt_user=..." http://localhost:3000/creator/dashboard

# Should redirect for contributor
curl -L http://localhost:3000/creator/dashboard
```

**Contributor Routes** (contributor + admin):
```bash
# Should work for contributor and admin
curl -b "crt_user=..." http://localhost:3000/contributor/dashboard

# Should redirect for creator
curl -L http://localhost:3000/contributor/dashboard
```

## Visual Verification

### Admin Dashboard
- Blue badge: "Admin"
- Navigation: Dashboard, Projects, Revenue, Rights, Users, Contracts, Settings
- Stats: Total Projects, Total Revenue, Total Users, Pending Payouts
- Distribution mode controls visible

### Creator Dashboard
- Green badge: "Creator"
- Navigation: Dashboard, My Projects, Revenue, My Rights, Payouts, Top Up, Withdraw, Settings
- Stats: Total Earnings, Pending Payouts, Active Projects, Active Rights
- Personal data only

### Contributor Dashboard
- Purple badge: "Contributor"
- Navigation: Dashboard, My Projects, My Revenue, Payouts, Settings
- Stats: Total Earnings, Pending Payouts, Active Projects
- Personal data only

## Common Issues & Solutions

### Issue: Still seeing admin content
**Solution**: Clear browser cache and localStorage
```javascript
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Issue: Redirect loop
**Solution**: Check that user cookie is set correctly
```javascript
console.log(document.cookie);
console.log(localStorage.getItem('crt_user'));
```

### Issue: Unauthorized page not showing
**Solution**: Verify middleware is running
```bash
# Check middleware.ts is in root directory
ls -la middleware.ts
```

### Issue: Wrong dashboard after login
**Solution**: Verify role is set correctly
```javascript
const user = JSON.parse(localStorage.getItem('crt_user'));
console.log('User role:', user.role);
```

## Success Criteria

✅ Admin users land on `/admin/dashboard`
✅ Creator users land on `/creator/dashboard`
✅ Contributor users land on `/contributor/dashboard`
✅ `/dashboard` redirects based on role
✅ No admin data visible to non-admins
✅ Middleware blocks unauthorized access
✅ Login redirects correctly
✅ Signup redirects correctly
✅ Data filtered by user
✅ Build completes without errors

## Performance Checks

```bash
# Build size
npm run build

# Check route sizes
# Admin dashboard: ~4.2 kB
# Creator dashboard: ~2.9 kB
# Contributor dashboard: ~2.9 kB
# Dashboard redirect: ~1.4 kB
```

## Browser Testing

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Test in multiple modes:
- Light mode
- Dark mode
- Incognito/Private mode

## Mobile Testing

Test responsive layouts:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

Verify:
- Navigation collapses on mobile
- Stats cards stack properly
- Tables scroll horizontally
- Buttons are touch-friendly

## Accessibility Testing

- Keyboard navigation works
- Screen reader compatible
- Color contrast meets WCAG standards
- Focus indicators visible
- Error messages clear

## Final Checklist

Before marking as complete:

- [ ] All test accounts work
- [ ] All redirects function correctly
- [ ] No admin data leaks
- [ ] Middleware enforces rules
- [ ] Build succeeds
- [ ] No console errors
- [ ] All pages load
- [ ] Data filtering works
- [ ] Unauthorized page shows
- [ ] Logout works
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] No ESLint warnings

## Reporting Issues

If you find any issues:

1. Note the user role
2. Note the URL accessed
3. Note the expected behavior
4. Note the actual behavior
5. Check browser console for errors
6. Check network tab for failed requests
7. Verify localStorage and cookies

## Next Steps

After testing:

1. Deploy to staging environment
2. Test with real users
3. Monitor for errors
4. Gather feedback
5. Iterate on UX improvements
