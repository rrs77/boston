# 🔍 Year Group Switching Issue - Diagnosis & Solution

## 📋 Problem Summary

**User Report:**
- Clicking between year groups (Lower Kindergarten, Year 1, Year 2) shows identical data
- Each year group should have its own curriculum/lessons
- The year selector changes, but the displayed lessons don't

---

## 🔬 Investigation Findings

### ✅ What's Working

1. **Year Group Selector** (`Header.tsx` lines 46-73)
   - Dropdown correctly displays year groups from `SettingsContextNew`
   - `onChange` handler properly updates `currentSheetInfo`
   - Saves to localStorage for persistence

```typescript
// Header.tsx line 48-60
onChange={(e) => {
  const selected = customYearGroups.find(group => group.id === e.target.value);
  if (selected) {
    const newSheetInfo = {
      sheet: selected.id,        // ← 'LKG', 'Year1', etc.
      display: selected.name,    // ← 'Lower Kindergarten', 'Year 1', etc.
      eyfs: `${selected.id} Statements`
    };
    setCurrentSheetInfo(newSheetInfo);
    localStorage.setItem('currentSheetInfo', JSON.stringify(newSheetInfo));
  }
}}
```

2. **DataContext Listening** (`DataContext.tsx` line 427-452)
   - `useEffect` has `currentSheetInfo` in dependency array
   - DOES trigger `loadData()` when year group changes
   - Calls all data loading functions (loadData, loadStandards, loadActivities, etc.)

```typescript
useEffect(() => {
  loadData();
  loadStandards();
  loadUserCreatedLessonPlans();
  loadActivities();
  loadUnits();
  loadHalfTerms();
  loadSubjects();
}, [currentSheetInfo]);  // ← Listens to year group changes!
```

3. **Year Group IDs** (`SettingsContextNew.tsx` line 212-219)
```typescript
const DEFAULT_YEAR_GROUPS: YearGroup[] = [
  { id: 'EYFS', name: 'EYFS', color: '#14B8A6' },
  { id: 'LKG', name: 'Lower Kindergarten', color: '#14B8A6' },
  { id: 'UKG', name: 'Upper Kindergarten', color: '#14B8A6' },
  { id: 'Reception', name: 'Reception', color: '#14B8A6' },
  { id: 'Year1', name: 'Year 1', color: '#14B8A6' },
  { id: 'Year2', name: 'Year 2', color: '#14B8A6' }
];
```

---

## 🔴 Root Cause

### The Real Problem: **Empty Data for Other Year Groups**

The system is working correctly in terms of:
- ✅ Detecting year group changes
- ✅ Triggering data reloads
- ✅ Querying the correct sheet name

**BUT:** The database/localStorage probably only has lesson data for ONE year group (likely 'LKG' or '2025-2026'), so when you switch to other year groups:
- The query runs correctly: `SELECT * FROM lessons WHERE sheet_name='Year1'`
- But returns **empty** because no data exists for Year1
- The UI shows the same data because it's falling back to cached/default data

---

## 🧪 Verification Steps

### Check 1: Inspect localStorage

Run in browser console:
```javascript
// Check what data exists for each year group
['EYFS', 'LKG', 'UKG', 'Reception', 'Year1', 'Year2'].forEach(sheet => {
  const key = `lesson-data-${sheet}`;
  const data = localStorage.getItem(key);
  const parsed = data ? JSON.parse(data) : null;
  const lessonCount = parsed?.allLessonsData ? Object.keys(parsed.allLessonsData).length : 0;
  console.log(`${sheet}: ${lessonCount} lessons`, parsed ? '(has data)' : '(NO DATA)');
});
```

**Expected Result:**
- If only LKG has data → **This confirms the root cause**
- If all have same data → **Data is being shared incorrectly**

### Check 2: Inspect Supabase `lessons` table

Run this query in Supabase SQL Editor:
```sql
SELECT sheet_name, academic_year, 
       jsonb_array_length(COALESCE(lesson_numbers, '[]'::jsonb)) as lesson_count
FROM lessons
ORDER BY sheet_name, academic_year;
```

**Expected Result:**
- Should show separate rows for each sheet_name (EYFS, LKG, Year1, etc.)
- If only showing 'LKG' → **Confirms only one year group has data**

### Check 3: Monitor Network Requests

1. Open DevTools → Network tab
2. Filter for "lessons"
3. Switch year groups (LKG → Year 1 → Year 2)
4. Watch the API requests

**Expected Result:**
```
GET /rest/v1/lessons?sheet_name=eq.LKG&academic_year=eq.2025-2026
→ Returns data

GET /rest/v1/lessons?sheet_name=eq.Year1&academic_year=eq.2025-2026
→ Returns empty (404 or empty array)

GET /rest/v1/lessons?sheet_name=eq.Year2&academic_year=eq.2025-2026
→ Returns empty (404 or empty array)
```

---

## 💡 Solution Options

### Option 1: Create Separate Lesson Data for Each Year Group (Recommended)

If you want each year group to have its own curriculum:

**Step 1:** Create lessons for Year 1
```typescript
// In LessonPlanBuilder or wherever lessons are created
// When current year group is "Year1", lessons save to sheet_name='Year1'
```

**Step 2:** Copy existing LKG data to other year groups (if desired)
```typescript
// In DataContext or Dashboard, add a "Copy Lessons to Year Group" function
const copyLessonsToYearGroup = async (fromSheet: string, toSheet: string) => {
  const sourceData = await lessonsApi.getBySheet(fromSheet, currentAcademicYear);
  if (sourceData) {
    await lessonsApi.updateSheet(toSheet, sourceData, currentAcademicYear);
    console.log(`✅ Copied lessons from ${fromSheet} to ${toSheet}`);
  }
};
```

**Step 3:** Add UI button to copy lessons
```tsx
// In Dashboard.tsx or UnitViewer.tsx
<button onClick={() => copyLessonsToYearGroup('LKG', 'Year1')}>
  Copy LKG Lessons to Year 1
</button>
```

---

### Option 2: Share Lessons Across Year Groups

If lessons should be the same across all year groups:

**Change the data storage model** to use a single sheet for all:

```typescript
// In DataContext.tsx loadData()
// Instead of filtering by sheet_name, load all lessons
const lessonData = await lessonsApi.getAll(currentAcademicYear);

// Then filter activities by year group in the UI
const filteredActivities = activities.filter(activity =>
  activity.yearGroups.includes(currentSheetInfo.sheet)
);
```

---

### Option 3: Auto-Create Empty Data for New Year Groups

When a year group is first selected, create an empty lesson structure:

```typescript
// In DataContext.tsx loadData()
if (!lessonData || Object.keys(lessonData).length === 0) {
  console.log(`No data for ${currentSheetInfo.sheet}, creating empty structure`);
  
  const emptyData = {
    allLessonsData: {},
    lessonNumbers: [],
    teachingUnits: [],
    lessonStandards: {}
  };
  
  // Save to Supabase
  await lessonsApi.updateSheet(currentSheetInfo.sheet, emptyData, currentAcademicYear);
  
  // Set in state
  setAllLessonsData({});
  setLessonNumbers([]);
  setTeachingUnits([]);
  setLessonStandards({});
}
```

---

## 🎯 Recommended Implementation

Based on your app's design (teacher creates lessons for specific year groups):

### **Implement Option 1 + Option 3**

1. **Auto-create empty data** when switching to a year group with no lessons
2. **Allow teachers to create lessons** specific to each year group
3. **Provide a "Clone from another year"** button for convenience

---

## 📝 Action Items

### Immediate Diagnostics:
1. [ ] Run Check 1 (localStorage inspection)
2. [ ] Run Check 2 (Supabase query)
3. [ ] Run Check 3 (Network monitoring)
4. [ ] Confirm which year groups have data

### Implementation (Option 1 + 3):
1. [ ] Add console log in `loadData()` to show which sheet is being loaded
2. [ ] Implement auto-creation of empty data for new year groups
3. [ ] Add UI feedback when switching to an empty year group
4. [ ] Implement "Clone from another year group" feature
5. [ ] Test data isolation between year groups

---

## 🔍 Debug Code to Add

Add this to `DataContext.tsx` in the `loadData` function (around line 2119):

```typescript
console.log('📚 Loading data for year group:', {
  sheet: currentSheetInfo.sheet,
  display: currentSheetInfo.display,
  academicYear: currentAcademicYear
});

const lessonData = await lessonsApi.getBySheet(currentSheetInfo.sheet, currentAcademicYear);

console.log('📊 Lesson data loaded:', {
  sheet: currentSheetInfo.sheet,
  hasData: !!lessonData,
  lessonCount: lessonData?.allLessonsData ? Object.keys(lessonData.allLessonsData).length : 0,
  isEmpty: !lessonData || Object.keys(lessonData).length === 0
});
```

This will immediately show you what's happening when you switch year groups!

---

## 🎓 Summary

The **switching mechanism works correctly**, but:
- The UI shows "identical" data because there's likely no data for Year 1, Year 2, etc.
- Only LKG (or one year group) has lesson data
- When switching to empty year groups, the UI either shows nothing or cached data

**Solution:** Implement empty data creation + year group cloning feature.

