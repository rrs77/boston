# Year Switcher Fix - Column 'lessons.id' Does Not Exist

## 🐛 Issue

When switching between academic years, the app was failing with this error:

```
Error: {code: '42703', message: 'column lessons.id does not exist'}
GET https://wiudrzdkbpyziaodqoog.supabase.co/rest/v1/lessons?select=id&sheet_name=eq.LKG&academic_year=eq.2023-2024 400 (Bad Request)
```

**What was happening:**
- Switching to older academic years (like 2023-2024) failed silently
- Current year (2025-2026) worked fine
- The query was trying to select a non-existent `id` column from the `lessons` table

---

## 🔍 Root Cause

The `lessons` table in Supabase **does not have an `id` column**. Instead, it uses a **composite key** made up of:
- `sheet_name` (e.g., 'LKG')
- `academic_year` (e.g., '2023-2024')

The code in `api.ts` (line 287) was incorrectly trying to check for existing records by selecting the `id` column:

```typescript
// ❌ WRONG - trying to select non-existent 'id' column
const { data: existingRecord, error: checkError } = await supabase
  .from(TABLES.LESSONS)
  .select('id')  // ← This column doesn't exist!
  .eq('sheet_name', sheet)
  .eq('academic_year', year)
  .maybeSingle();
```

---

## ✅ Solution

**Changed the query to select the actual composite key columns:**

```typescript
// ✅ CORRECT - select the actual columns that exist
const { data: existingRecord, error: checkError } = await supabase
  .from(TABLES.LESSONS)
  .select('sheet_name, academic_year')  // ← These columns exist!
  .eq('sheet_name', sheet)
  .eq('academic_year', year)
  .maybeSingle();
```

---

## 📝 Changes Made

### File: `src/config/api.ts`

**Lines 284-296** - Updated the `updateSheet` function:

```typescript
// First, check if a record exists for this sheet and academic year
// Note: lessons table doesn't have an 'id' column, it uses sheet_name + academic_year as composite key
const { data: existingRecord, error: checkError } = await supabase
  .from(TABLES.LESSONS)
  .select('sheet_name, academic_year')  // Changed from .select('id')
  .eq('sheet_name', sheet)
  .eq('academic_year', year)
  .maybeSingle();
```

---

## 🎯 Why This Fix Works

1. **No Database Changes Required** - The query now uses columns that already exist
2. **Composite Key Detection** - We can still check if a record exists by selecting its composite key columns
3. **Works for All Years** - The fix applies to all academic years, not just current ones
4. **Backward Compatible** - Doesn't break existing data or queries

The `existingRecord` check still works correctly:
- If a record exists: `existingRecord` will contain `{sheet_name: 'LKG', academic_year: '2023-2024'}`
- If no record exists: `existingRecord` will be `null`

---

## 🧪 Testing

To verify the fix works:

1. **Switch to an older year:**
   - Go to Unit Viewer
   - Click the year navigation arrows
   - Select 2023-2024 or 2024-2025

2. **Expected behavior:**
   - No console errors
   - Year switcher works smoothly
   - Data loads correctly for each year (or shows empty if no data exists)

3. **Check the console:**
   ```
   ✅ Should see: "🔍 Fetching lessons for LKG (2023-2024) from Supabase..."
   ❌ Should NOT see: "Error: column lessons.id does not exist"
   ```

---

## 📊 Database Schema Note

For reference, the `lessons` table structure:

```sql
CREATE TABLE lessons (
  sheet_name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  data JSONB,
  lesson_numbers TEXT[],
  teaching_units JSONB,
  lesson_standards_map JSONB,
  eyfs_statements_map JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (sheet_name, academic_year)  -- ← Composite primary key, no 'id' column!
);
```

---

## 🔧 Alternative Solution (Not Recommended)

If you wanted to add an `id` column instead, you would need to:

```sql
-- Add an id column (NOT RECOMMENDED - composite key is better for this use case)
ALTER TABLE lessons ADD COLUMN id SERIAL PRIMARY KEY;
```

**Why we didn't do this:**
- Composite key (sheet_name + academic_year) is more semantic for this use case
- Adding an id would require migrating all existing data
- The fix is simpler and doesn't require schema changes

---

## ✅ Status

**Fix Applied:** ✅  
**Testing Required:** Manual testing of year switcher  
**Database Changes:** None required  
**Breaking Changes:** None

The year switcher should now work correctly for all academic years! 🎉

---

## 📚 Related Code

**Flow when switching years:**
1. `UnitViewer.tsx` → `handleYearChange()`
2. `DataContext.tsx` → `setCurrentAcademicYear()`
3. `DataContext.tsx` → `loadData()`
4. `api.ts` → `lessonsApi.getBySheet(sheet, academicYear)`
5. `api.ts` → `lessonsApi.updateSheet(sheet, data, academicYear)` ← **Fixed here**

---

**Fix Complete!** The year switcher will now work for all academic years without errors. 🚀

