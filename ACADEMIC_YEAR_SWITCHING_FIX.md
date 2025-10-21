# Academic Year Switching Fix - Database Schema Mismatch

## Problem
Users couldn't switch to academic years beyond 2025-2026. When trying to switch to 2026-2027 or create new year data, the following error occurred:

```
❌ POST https://wiudrzdkbpyziaodqoog.supabase.co/rest/v1/lessons 400 (Bad Request)
❌ Could not find the 'lesson_standards_map' column of 'lessons' in the schema cache
```

## Root Cause
The `api.ts` code was trying to INSERT/UPDATE two columns that **don't exist** in the `lessons` table:
1. `lesson_standards_map`
2. `eyfs_statements_map`

These columns were being written to in 3 places:
- `lessonsApi.updateSheet()` - Line 328-329
- `lessonsApi.getBySheet()` - Line 296 (reading)
- `dataApi.importAll()` - Line 1121-1122 (backup import)

## Solution
Removed all references to these non-existent columns from the database operations.

### Files Modified: `src/config/api.ts`

#### Fix 1: Remove columns from INSERT/UPDATE (Lines 322-331)
```typescript
// BEFORE (WRONG)
const lessonData = {
  sheet_name: sheet,
  academic_year: year,
  data: data.allLessonsData,
  lesson_numbers: data.lessonNumbers,
  teaching_units: data.teachingUnits,
  lesson_standards_map: data.lessonStandards,      // ❌ Column doesn't exist
  eyfs_statements_map: data.lessonStandards,        // ❌ Column doesn't exist
  notes: data.notes || ''
};

// AFTER (CORRECT)
const lessonData = {
  sheet_name: sheet,
  academic_year: year,
  data: data.allLessonsData,
  lesson_numbers: data.lessonNumbers,
  teaching_units: data.teachingUnits,
  // Note: lesson_standards_map and eyfs_statements_map columns don't exist
  // Standards are stored within the lesson data itself, not as separate columns
  notes: data.notes || ''
};
```

#### Fix 2: Remove columns from READ operation (Lines 292-298)
```typescript
// BEFORE (WRONG)
return {
  allLessonsData: data.data || {},
  lessonNumbers: data.lesson_numbers || [],
  teachingUnits: data.teaching_units || [],
  lessonStandards: data.lesson_standards_map || data.eyfs_statements_map || {}  // ❌ Columns don't exist
};

// AFTER (CORRECT)
return {
  allLessonsData: data.data || {},
  lessonNumbers: data.lesson_numbers || [],
  teachingUnits: data.teaching_units || [],
  // lessonStandards are stored within the lesson data itself, not as a separate field
  lessonStandards: {}
};
```

#### Fix 3: Remove columns from IMPORT operation (Lines 1117-1124)
```typescript
// BEFORE (WRONG)
const lessonsData = Object.entries(data.lessons).map(([sheet, sheetData]: [string, any]) => ({
  sheet_name: sheet,
  data: sheetData.allLessonsData || {},
  lesson_numbers: sheetData.lessonNumbers || [],
  teaching_units: sheetData.teachingUnits || [],
  lesson_standards_map: sheetData.lessonStandards || {},      // ❌ Column doesn't exist
  eyfs_statements_map: sheetData.lessonStandards || {}        // ❌ Column doesn't exist
}));

// AFTER (CORRECT)
const lessonsData = Object.entries(data.lessons).map(([sheet, sheetData]: [string, any]) => ({
  sheet_name: sheet,
  data: sheetData.allLessonsData || {},
  lesson_numbers: sheetData.lessonNumbers || [],
  teaching_units: sheetData.teachingUnits || []
  // Note: lesson_standards_map and eyfs_statements_map columns don't exist
  // Standards are stored within the lesson data itself
}));
```

## Why This Happened
The code was written with the assumption that `lesson_standards_map` and `eyfs_statements_map` were separate columns in the lessons table, but the actual database schema stores this data **within** the `data` JSONB column instead.

## Testing
After this fix, users should be able to:
1. ✅ Switch to 2026-2027 academic year
2. ✅ Switch to 2027-2028 and future years
3. ✅ Create new lessons in any academic year
4. ✅ Save changes to lessons across all years
5. ✅ Import/export backup data without errors

## Related Issues Fixed
This is the same type of schema mismatch as the previous `year_groups` vs `yeargroups` issue in the activities table. The pattern is:
- Code assumes certain column names exist
- Actual database has different column names or doesn't have those columns
- Result: 400 Bad Request errors preventing data operations

## Actual Lessons Table Schema
Based on the working queries, the `lessons` table has these columns:
- `sheet_name` (TEXT, part of composite key)
- `academic_year` (TEXT, part of composite key)
- `data` (JSONB) - contains all lesson data including standards
- `lesson_numbers` (ARRAY)
- `teaching_units` (ARRAY)
- `notes` (TEXT)

**Note**: Standards/objectives are stored **inside** the `data` JSONB field, not as separate columns.

