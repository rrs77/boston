# Logging Cleanup Implementation Guide

## Summary of Issues Fixed

1. **Excessive duplicate logs** - Same operations logged multiple times
2. **Redundant Supabase checks** - Configuration checked on every API call
3. **No log level filtering** - Everything logs in production
4. **Memory leaks** - No cleanup in useEffect hooks

## Critical Issue Fixed First

### Missing `stacks` column in Supabase
**Error:** `Could not find the 'stacks' column of 'half_terms' in the schema cache`

**Fix:** Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE half_terms 
ADD COLUMN IF NOT EXISTS stacks JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_half_terms_stacks ON half_terms USING GIN (stacks);
```

## New Logger Utility

Created `src/utils/logger.ts` with:
- **Level-based filtering**: `debug`, `info`, `warn`, `error`
- **Automatic deduplication**: Prevents duplicate logs within 1 second
- **Environment awareness**: Debug logs only in development
- **Clean API**: `logger.debug(context, message, data)`

## Files to Update (Priority Order)

### High Priority (Most Verbose)
1. `src/config/supabase.ts` - Remove redundant config checks
2. `src/contexts/SettingsContextNew.tsx` - Fix duplicate useEffect
3. `src/contexts/DataContext.tsx` - Fix duplicate initialization
4. `src/components/LessonLibrary.tsx` - Remove duplicate lesson logs
5. `src/config/api.ts` - Consolidate API logging

### Medium Priority
6. `src/components/LessonLibraryCard.tsx` - Simplify per-card logs
7. `src/components/UnitViewer.tsx` - Reduce half-term logs
8. `src/components/AssignToHalfTermModal.tsx` - Clean up assignment logs

### Low Priority
9. Other components with console.log statements

## Implementation Steps

### Step 1: Fix Supabase Config Check

**Before:**
```typescript
// supabase.ts line 55 - runs on EVERY API call
console.log('🔍 Supabase configuration check:', {
  hasUrl: true,
  hasKey: true,
  configured: true
});
```

**After:**
```typescript
// supabase.ts - check ONCE at initialization
let configVerified = false;

export function verifySupabaseConfig(): boolean {
  if (configVerified) return true;
  
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!hasUrl || !hasKey) {
    logger.error('Supabase', 'Missing configuration', {
      hasUrl,
      hasKey
    });
    return false;
  }
  
  logger.info('Supabase', 'Configuration verified');
  configVerified = true;
  return true;
}

// Call once at app start in main.tsx
verifySupabaseConfig();
```

### Step 2: Fix Duplicate Context Initialization

**Before:**
```typescript
// SettingsContextNew.tsx - runs multiple times
useEffect(() => {
  console.log('🎯 NEW SettingsProviderNew useEffect running...');
  loadFromSupabase();
}, []); // Wrong or missing dependencies
```

**After:**
```typescript
// SettingsContextNew.tsx - runs ONCE
const initialized = useRef(false);

useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;
  
  logger.info('SettingsContext', 'Initializing settings');
  loadFromSupabase();
}, []);

// Add cleanup
useEffect(() => {
  return () => {
    logger.debug('SettingsContext', 'Cleanup');
  };
}, []);
```

### Step 3: Reduce Component Logging

**Before:**
```typescript
// LessonLibraryCard.tsx - logs for EVERY card
console.log('DEBUG - LessonLibraryCard received onEdit:', { ... });
console.log('🔍 LessonLibraryCard halfTerms data:', { ... });
```

**After:**
```typescript
// LessonLibraryCard.tsx - log only errors or important state
useEffect(() => {
  if (!lessonData) {
    logger.warn('LessonLibraryCard', `No data for lesson ${lessonNumber}`);
  }
}, [lessonNumber, lessonData]);

// Remove debug logs from render - use React DevTools instead
```

### Step 4: Consolidate API Logging

**Before:**
```typescript
// api.ts - multiple logs per operation
console.log('🔄 Loading activities for user:', userId);
console.log('✅ Loaded activities:', activities);
console.log('🔄 Fetching from Supabase...');
console.log('✅ Query successful');
```

**After:**
```typescript
// api.ts - single log per operation
async function loadActivities(userId: string) {
  try {
    logger.debug('API', `Loading activities for user ${userId}`);
    const activities = await supabase.from('activities').select();
    logger.info('API', `Loaded ${activities.length} activities`);
    return activities;
  } catch (error) {
    logger.error('API', 'Failed to load activities', error);
    throw error;
  }
}
```

## Quick Wins (Apply These First)

1. **Remove all `console.log('🔍 Supabase configuration check')`** - Replace with single check at app start
2. **Remove duplicate logs in LessonLibrary.tsx lines 832+** - Each lesson logs twice
3. **Add `useRef` flag to SettingsContextNew.tsx** - Prevents double initialization
4. **Remove "DataContext providing halfTerms" logs** - Fired on every render

## Testing Checklist

- [ ] Run SQL migration to add `stacks` column
- [ ] Verify lesson stacks save and persist after refresh
- [ ] Import logger in 1-2 high-priority files
- [ ] Replace console.log with logger.*
- [ ] Check dev console - should see ~80% fewer logs
- [ ] Build for production - should see only warnings/errors
- [ ] Verify no functionality broken

## Expected Results

### Before
- **683 console messages** on app load
- Repeated: "Supabase configuration check", "Loading half-terms", "DataContext providing halfTerms"
- Hard to debug actual issues

### After
- **~50-80 messages** in development
- **~10-15 messages** in production
- Each operation logged once
- Easy to spot errors

## Next Steps

1. **Run the Supabase migration** for the `stacks` column
2. **Test that lesson stacks persist** after refresh
3. **Apply logger to top 3 files** (supabase.ts, SettingsContextNew.tsx, DataContext.tsx)
4. **Remove duplicate useEffect logs**
5. **Test and iterate**

