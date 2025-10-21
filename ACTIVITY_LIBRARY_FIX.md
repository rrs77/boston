# Activity Library Fix - October 21, 2025

## Problem
Activity Library was showing "0 of 2 activities" - only 2 activities loaded but 328 expected.

## Root Cause: Database Column Name Mismatch ❌

```
ERROR: column activities.year_groups does not exist
HINT: Perhaps you meant to reference the column "activities.yeargroups"
```

**The Supabase database column is named `yeargroups` (no underscore), but the API code was querying `year_groups` (with underscore).**

This caused the query to fail, loading only 2 activities from localStorage fallback instead of 328 from Supabase.

### Console Evidence
```javascript
✅ Filtered Activities: {
  total: 2,           // Only 2 activities loaded
  matchSearch: 2,
  matchCategory: 2,
  matchLevel: 2,
  matchYearGroup: 0,  // All 2 filtered OUT by year group filter!
  final: 2
}
```

## Solution

### Fix 1: Correct Database Column Name in API
**File**: `src/config/api.ts`

Changed all references from `year_groups` to `yeargroups`:

```typescript
// BEFORE (WRONG)
.select('..., year_groups')
yearGroups: item.year_groups || []

// AFTER (CORRECT)
.select('..., yeargroups')
yearGroups: item.yeargroups || []
```

**Lines changed**: 33, 43, 73

### Fix 2: Restore Proper Year Group Filtering
**File**: `src/components/ActivityLibrary.tsx`

Removed the temporary debug override that was blocking proper filtering:

```typescript
// BEFORE (DEBUG OVERRIDE)
const matchesYearGroup = true; // TEMP: Always true

// AFTER (CORRECT)
const hasYearGroupInfo = activity.yearGroups && activity.yearGroups.length > 0;
const matchesYearGroup = !hasYearGroupInfo || // Show legacy activities
  activity.level === className || 
  mapActivityLevelToYearGroup(activity.level) === className ||
  (activity.yearGroups && activity.yearGroups.includes(className));
```

### Fix 3: Remove Debug Logging
Removed excessive console.log statements that were:
- Slowing down rendering
- Cluttering the console
- Re-added accidentally in previous fix attempt

## Testing
After a **hard refresh (Ctrl+Shift+R / Cmd+Shift+R)**:
1. ✅ All 328 activities should load from Supabase
2. ✅ Activities display in the Activity Library
3. ✅ Year group filtering works correctly
4. ✅ Legacy activities (no yearGroups field) show to all year groups
5. ✅ No database column errors in console

## Files Modified
1. **`src/config/api.ts`** (Lines 33, 43, 73)
   - Changed `year_groups` → `yeargroups` in SELECT queries
   - Changed `item.year_groups` → `item.yeargroups` in mapping

2. **`src/components/ActivityLibrary.tsx`** (Lines 163-167)
   - Restored proper year group filter logic
   - Removed temporary debug override

## Why This Happened
The database column was created as `yeargroups` (snake_case without underscore), but the API code assumed `year_groups` (standard snake_case with underscore). This mismatch caused all Supabase queries to fail silently, falling back to the 2 activities in localStorage.

## Related Issues Fixed
- ✅ User ID auto-creation in `api.ts` (already implemented)
- ✅ Fallback activity loading for backwards compatibility
- ✅ Year group filter logic for legacy activities

## Next Steps
Monitor the console after refresh to confirm:
- ✅ No "column activities.year_groups does not exist" errors
- ✅ `✅ Loaded 328 activities for user 1` message appears
- ✅ All activities display in the Activity Library
