# Safari Year Groups Sync Test

## Issue
Year groups are not syncing properly between browsers. When you open the app in Safari, it shows the default 3 year groups (LKG, UKG, Reception) instead of the 6 year groups you've added.

## Root Cause
Safari may have different localStorage behavior or Supabase connection issues compared to other browsers.

## Fixes Applied

### 1. Enhanced Retry Logic
- Added 3-attempt retry with exponential backoff for Supabase connections
- Better error handling for network issues

### 2. Improved Fallback Logic
- Try multiple localStorage keys: `custom-year-groups`, `year-groups`, `customYearGroups`
- Enhanced error logging with browser detection
- Better Safari-specific debugging

### 3. Manual Sync Function
- Added `forceSyncCurrentYearGroups()` function
- Added "Force Sync" button in Settings → Year Groups section

## How to Test

### Step 1: Check Current State
1. Open your main browser (where year groups are working)
2. Go to Settings → Year Groups
3. Note how many year groups you have (should be 6: LKG, UKG, Reception, Reception Drama, Year 1 Music, Year 2 Music)

### Step 2: Force Sync
1. Click the green "Force Sync" button
2. Wait for success message
3. Check console logs for confirmation

### Step 3: Test Safari
1. Open Safari
2. Go to your app
3. Check if year groups are now showing correctly

### Step 4: If Still Not Working
1. In Safari, open Developer Tools (Develop menu → Show Web Inspector)
2. Go to Console tab
3. Look for error messages related to Supabase or year groups
4. Check the detailed error logs we added

## Debug Information

The enhanced logging will show:
- Browser user agent
- Supabase connection attempts
- localStorage key detection
- Detailed error messages

## SQL Debug Script
Run this in Supabase SQL Editor to check what's actually in the database:

```sql
-- Check year groups in database
SELECT id, name, color, sort_order, created_at 
FROM year_groups 
ORDER BY sort_order, name;

-- Check count
SELECT COUNT(*) as total_count FROM year_groups;
```

## Expected Result
After the fix, Safari should show the same 6 year groups as your other browser, and they should persist across browser sessions.
