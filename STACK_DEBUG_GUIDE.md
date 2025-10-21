# Lesson Stack Transfer & Display Debug Guide

## ✅ BUGS FIXED

### 1. **CRITICAL BUG: Unit Viewer was looking in wrong place for stacks**
**File:** `src/components/UnitViewer.tsx` (Line 429)

**Problem:**
```typescript
// ❌ WRONG - Looking for half-term by unit.id
const halfTermData = halfTerms.find(term => term.id === selectedUnit.id);
```

**Fix:**
```typescript
// ✅ CORRECT - Looking for half-term by unit.term
const halfTermData = halfTerms.find(term => term.id === selectedUnit.term);
```

**Impact:** Stacks were never displayed in the Unit Viewer because the code was trying to match unit ID with half-term ID, which are completely different entities. Units have a `term` property that references the half-term.

---

### 2. **Database Schema Missing Stacks Column**
**File:** `supabase/migrations/20250125000000_add_stacks_to_half_terms.sql` (NEW)

**Problem:** The `half_terms` table in Supabase didn't have a `stacks` column.

**Fix:** Created a new migration that:
- Adds `stacks text[] DEFAULT '{}'` column to `half_terms` table
- Adds a GIN index for efficient stack queries
- Adds documentation comment

**Impact:** Stacks were being stored in localStorage but not persisting to the database.

---

### 3. **API Not Reading/Writing Stacks**
**File:** `src/config/api.ts`

**Problems:**
1. `getBySheet` function didn't read `stacks` from database (Line 577-584)
2. `updateHalfTerm` function didn't accept `stacks` parameter (Line 591)
3. `updateHalfTerm` function didn't save `stacks` to database (Line 606-615)

**Fixes:**
```typescript
// ✅ Added stacks to getBySheet response
return (data || []).map(item => ({
  id: item.id,
  name: item.name,
  lessons: item.lessons || [],
  stacks: item.stacks || [], // ADDED
  isComplete: item.is_complete || false,
  createdAt: new Date(item.created_at),
  updatedAt: new Date(item.updated_at)
}));

// ✅ Added stacks parameter to updateHalfTerm
updateHalfTerm: async (sheet: string, halfTermId: string, lessons: string[], isComplete: boolean, academicYear?: string, stacks?: string[]) => {
  // ...
  const upsertData: any = {
    // ... other fields
  };
  
  if (stacks !== undefined) {
    upsertData.stacks = stacks; // ADDED
  }
  // ...
}
```

**Impact:** Stacks are now properly saved to and loaded from Supabase.

---

### 4. **DataContext Not Passing Stacks to API**
**File:** `src/contexts/DataContext.tsx`

**Problem:** Three API calls to `halfTermsApi.updateHalfTerm` were not passing the `stacks` parameter.

**Fixes:**
```typescript
// ✅ syncHalfTermsToSupabase - Added stacks parameter (Line 1040)
await halfTermsApi.updateHalfTerm(
  currentSheetInfo.sheet,
  halfTerm.id,
  halfTerm.lessons,
  halfTerm.isComplete,
  currentAcademicYear,
  halfTerm.stacks // ADDED
);

// ✅ updateHalfTerm - Added stacks parameter (Line 1200)
const currentHalfTerm = halfTerms.find(t => t.id === halfTermId);
const result = await halfTermsApi.updateHalfTerm(
  currentSheetInfo.sheet, 
  halfTermId, 
  lessons, 
  isComplete, 
  currentAcademicYear,
  stacks || currentHalfTerm?.stacks // ADDED
);

// ✅ Lesson assignment - Added stacks parameter (Line 2005)
halfTermsApi.updateHalfTerm(
  currentSheetInfo.sheet, 
  availableHalfTerm.id, 
  updatedLessons, 
  availableHalfTerm.isComplete,
  undefined,
  availableHalfTerm.stacks // ADDED
);
```

**Impact:** Stacks are now properly synced to database when half-terms are updated.

---

### 5. **LessonSelectionModal Had Wrong Prop Name**
**File:** `src/components/LessonSelectionModal.tsx` (Line 544)

**Problem:**
```typescript
// ❌ WRONG - StackModal expects 'onOpenLesson' not 'onEditLesson'
<StackModal
  onEditLesson={(lessonNumber) => setSelectedLessonForDetails(lessonNumber)}
/>
```

**Fix:**
```typescript
// ✅ CORRECT - Using proper prop name
<StackModal
  onOpenLesson={(lessonNumber) => setSelectedLessonForDetails(lessonNumber)}
/>
```

**Impact:** Clicking a lesson in a stack modal would fail because the prop name was wrong.

---

## 🔍 COMPREHENSIVE CONSOLE LOGGING ADDED

### 1. **Stack Assignment Tracking** (`src/components/LessonLibrary.tsx`)
```typescript
console.log('🔄 STACK ASSIGNMENT - Starting assignment:', {
  stackId, stackName, termId, stackLessons
});
console.log('✅ STACK ASSIGNMENT - Found half-term:', { id, name, currentStacks });
console.log('✅ STACK ASSIGNMENT - Successfully called updateHalfTerm');
console.log('📋 STACK ASSIGNMENT - Half-term should now have stacks:', newStacks);
```

### 2. **DataContext Update Tracking** (`src/contexts/DataContext.tsx`)
```typescript
console.log('🔄 DATACONTEXT - updateHalfTerm called:', { 
  halfTermId, lessons, isComplete, stacks, stacksProvided 
});
console.log('✅ DATACONTEXT - Updated existing half-term:', {
  halfTermId, year, oldStacks, newStacks, stacksWereUpdated
});
console.log('💾 DATACONTEXT - Saved to localStorage:', {
  key, halfTermsCount, updatedTerm
});
```

### 3. **Unit Viewer Stack Display** (`src/components/UnitViewer.tsx`)
```typescript
console.log('🔍 STACK DEBUG - Unit Viewer:', {
  unitId, unitTerm, halfTerms
});
console.log('🔍 STACK DEBUG - Found stacks:', {
  halfTermFound, halfTermId, stackIds, totalStacks
});
console.log('✅ STACK DEBUG - Rendering stack:', {
  stackId, stackName, lessonCount
});
```

### 4. **Lesson Selection Modal Stack Loading** (`src/components/LessonSelectionModal.tsx`)
```typescript
console.log('🔍 LESSON SELECTION MODAL - Stack data:', {
  halfTermId, halfTermData, assignedStackIds, allStacks, assignedStacks
});
```

---

## 📋 TESTING GUIDE

### Phase 1: Create a Lesson Stack
1. **Navigate to Lesson Library tab**
2. **Look for "Lesson Stacks" section** (should be collapsible)
3. **Click "Create New Stack" button**
4. **In the Stack Builder:**
   - Enter a stack name (e.g., "Fractions Unit")
   - Select 2-3 lessons from the left panel
   - Click "Create Stack"
5. **Verify:**
   - ✅ Stack appears in the Lesson Stacks section
   - ✅ Stack has a purple gradient header (distinct from regular lessons)
   - ✅ Stack shows lesson count and total time

**Console Logs to Check:**
```
🔍 LessonLibrary halfTerms data: { halfTerms: [...] }
```

---

### Phase 2: Assign Stack to Half-Term
1. **In Lesson Library, find your created stack**
2. **Click the "Assign to Term" button** (calendar icon)
3. **In the Assignment Modal:**
   - Select a half-term (e.g., "Autumn 1")
   - Click "Assign to Half-Term"
4. **Verify:**
   - ✅ Success alert appears: "Stack [name] has been assigned to Autumn 1!"
   - ✅ Modal closes

**Console Logs to Check:**
```
🔄 STACK ASSIGNMENT - Starting assignment: { stackId: "...", stackName: "...", termId: "A1" }
✅ STACK ASSIGNMENT - Found half-term: { id: "A1", name: "Autumn 1", currentStacks: [] }
🔄 STACK ASSIGNMENT - Updating half-term: { oldStacks: [], newStacks: ["stack-..."] }
✅ STACK ASSIGNMENT - Successfully called updateHalfTerm
🔄 DATACONTEXT - updateHalfTerm called: { halfTermId: "A1", stacks: ["stack-..."], stacksProvided: true }
✅ DATACONTEXT - Updated existing half-term: { oldStacks: [], newStacks: ["stack-..."], stacksWereUpdated: true }
💾 DATACONTEXT - Saved to localStorage: { key: "half-terms-LKG-2024-2025", ... }
```

---

### Phase 3: View Stack in Half-Term Planner
1. **Navigate to Unit Viewer / Half-Term Planner tab**
2. **Find the half-term you assigned the stack to** (e.g., Autumn 1)
3. **Click on the half-term card**
4. **In the Half-Term View modal:**
   - Look for "Lesson Stacks" section at the top
   - Your stack should be displayed with the purple gradient
   - Below that, "Individual Lessons" section shows regular lessons

**Console Logs to Check:**
```
🔍 LESSON SELECTION MODAL - Stack data: {
  halfTermId: "A1",
  halfTermData: { id: "A1", name: "Autumn 1", stacks: ["stack-..."] },
  assignedStackIds: ["stack-..."],
  assignedStacks: [{ id: "stack-...", name: "Fractions Unit" }]
}
```

**Verify:**
- ✅ Stack card appears in "Lesson Stacks" section
- ✅ Stack has layered/stacked visual effect (3 layers)
- ✅ Stack shows correct lesson count
- ✅ Stack shows correct total time

---

### Phase 4: Open Stack Modal
1. **In Half-Term View, click on the stack card**
2. **Stack Modal should open showing:**
   - Purple gradient header with stack name
   - Grid of all lessons in the stack
   - Each lesson shows as a lesson card
   - Sequential numbering (Lesson 1, Lesson 2, etc.)

**Console Logs to Check:**
```
(Should see lesson data being rendered for each lesson in the stack)
```

**Verify:**
- ✅ Modal opens with smooth animation
- ✅ All lessons from stack are displayed
- ✅ Clicking a lesson card opens lesson details
- ✅ Close button (X) works and closes modal

---

### Phase 5: View Stack in Unit Viewer (Unit Detail View)
1. **Create a Unit** (or use existing)
   - Go to Unit Viewer tab
   - Click "Create New Unit"
   - Assign unit to the same half-term where you assigned your stack (e.g., Autumn 1)
2. **Click on the unit to view details**
3. **In the "Lessons and Stacks in this Unit" section:**
   - Stack should appear alongside individual lessons
   - Stack should have the layered visual effect
   - Stack should be clickable

**Console Logs to Check:**
```
🔍 STACK DEBUG - Unit Viewer: {
  unitId: "unit-...",
  unitTerm: "A1",
  halfTerms: [{ id: "A1", name: "Autumn 1", stacks: ["stack-..."] }]
}
🔍 STACK DEBUG - Found stacks: {
  halfTermFound: true,
  halfTermId: "A1",
  stackIds: ["stack-..."],
  totalStacks: 1
}
✅ STACK DEBUG - Rendering stack: {
  stackId: "stack-...",
  stackName: "Fractions Unit",
  lessonCount: 3
}
```

**Verify:**
- ✅ Stack appears in the grid
- ✅ Stack has purple gradient header
- ✅ Stack shows lesson count
- ✅ Clicking stack opens Stack Modal

---

## ⚠️ COMMON ISSUES & TROUBLESHOOTING

### Issue 1: Stack Not Appearing in Half-Term View
**Check:**
1. Open browser console and look for `🔍 LESSON SELECTION MODAL - Stack data`
2. Verify `assignedStackIds` is not empty
3. If empty, stack wasn't properly assigned

**Solution:**
- Re-assign the stack to the half-term
- Check for `✅ STACK ASSIGNMENT - Successfully called updateHalfTerm` in console

---

### Issue 2: Stack Not Appearing in Unit Viewer
**Check:**
1. Open browser console and look for `🔍 STACK DEBUG - Unit Viewer`
2. Verify `unitTerm` matches the half-term where stack is assigned
3. Look for `🔍 STACK DEBUG - Found stacks` to see if stacks were found

**Common Cause:**
- Unit is assigned to different half-term than stack
- Unit.term doesn't match half-term ID

**Solution:**
- Verify unit is assigned to correct half-term
- Check unit details: unit.term should match half-term ID (e.g., "A1")

---

### Issue 3: Stack Modal Doesn't Open
**Check:**
1. Look for any console errors when clicking stack
2. Verify StackModal component is imported

**Solution:**
- Check that StackModal is rendered at bottom of component
- Verify `selectedStackForModal` state is being set

---

### Issue 4: Database Not Persisting Stacks
**Check:**
1. Run the database migration:
   ```bash
   npx supabase migration up
   ```
2. Verify `stacks` column exists in `half_terms` table
3. Check Supabase console for any errors

**Solution:**
- Ensure migration file is applied
- Check Supabase connection is working
- Look for API errors in browser console

---

## 🗄️ DATABASE MIGRATION

**IMPORTANT:** You must run the new migration for stacks to persist to database:

```bash
# Navigate to your project directory
cd /path/to/cursorchanges

# Apply the migration
npx supabase migration up

# Or if using Supabase CLI
supabase db push
```

The migration file is: `supabase/migrations/20250125000000_add_stacks_to_half_terms.sql`

---

## 📊 DATA FLOW SUMMARY

### Stack Assignment Flow:
```
1. User clicks "Assign to Term" on a stack
   └─> LessonLibrary.handleAssignStackToTerm()
       └─> Opens AssignStackToTermModal
           └─> User selects half-term
               └─> LessonLibrary.handleStackAssignment()
                   └─> DataContext.updateHalfTerm(..., stacks)
                       ├─> Updates halfTermsByYear state
                       ├─> Saves to localStorage
                       └─> Calls halfTermsApi.updateHalfTerm()
                           └─> Saves to Supabase database
```

### Stack Display Flow (Unit Viewer):
```
1. User opens Unit details
   └─> UnitViewer renders selectedUnit
       └─> Looks up halfTermData by selectedUnit.term (FIXED!)
           └─> Gets stackIds from halfTermData.stacks
               └─> Maps stackIds to stack objects from useLessonStacks()
                   └─> Renders StackCard for each stack
                       └─> User clicks stack
                           └─> Opens StackModal with stack lessons
```

### Stack Display Flow (Half-Term Planner):
```
1. User clicks half-term card
   └─> Opens LessonSelectionModal
       └─> Gets halfTermData by halfTermId
           └─> Gets assignedStackIds from halfTermData.stacks
               └─> Filters stacks by assignedStackIds
                   └─> Renders "Lesson Stacks" section with StackCards
                       └─> User clicks stack
                           └─> Opens StackModal with stack lessons
```

---

## 🎯 VERIFICATION CHECKLIST

Use this checklist to verify all fixes are working:

- [ ] **Stack Creation**: Can create a new lesson stack in Lesson Library
- [ ] **Stack Assignment**: Can assign stack to half-term with success message
- [ ] **Console Logs**: See all debug logs in browser console during assignment
- [ ] **Half-Term Planner**: Stack appears in half-term planner modal
- [ ] **Unit Viewer**: Stack appears when viewing unit details
- [ ] **Stack Visual**: Stack has distinctive layered/purple appearance
- [ ] **Stack Modal**: Clicking stack opens modal with all lessons
- [ ] **Lesson Details**: Clicking lesson in stack modal opens lesson details
- [ ] **Database Persistence**: Stack assignment persists after page refresh
- [ ] **Migration Applied**: Database has `stacks` column in `half_terms` table
- [ ] **API Logging**: See API calls in console with stacks parameter

---

## 📝 FILES MODIFIED

### New Files:
1. `supabase/migrations/20250125000000_add_stacks_to_half_terms.sql` - Database migration

### Modified Files:
1. `src/components/UnitViewer.tsx` - Fixed half-term lookup, added debug logging
2. `src/components/LessonLibrary.tsx` - Added comprehensive stack assignment logging
3. `src/components/LessonSelectionModal.tsx` - Fixed prop name, added debug logging
4. `src/contexts/DataContext.tsx` - Added stacks parameter to API calls, enhanced logging
5. `src/config/api.ts` - Added stacks support to API read/write operations

---

## 🚀 NEXT STEPS

After verifying all functionality works:

1. **Remove Debug Logging** (Optional)
   - The extensive console logging can be removed or commented out once debugging is complete
   - Look for logs starting with emojis: 🔍, ✅, 🔄, 💾, ❌, 📋

2. **Consider Additional Features**
   - Add ability to reorder lessons within a stack
   - Add ability to add/remove lessons from an existing stack
   - Add stack duplication
   - Add stack templates

3. **Performance Optimization**
   - If you have many stacks, consider pagination
   - Add loading states for async operations
   - Cache stack data to reduce database calls

---

## ❓ NEED HELP?

If stacks are still not appearing:

1. **Clear browser cache and localStorage**
   - Open DevTools → Application → Clear storage → Clear all
   - Refresh the page

2. **Check all console logs**
   - Look for any ❌ error logs
   - Verify stacks parameter is being passed: `stacksProvided: true`
   - Check if `stackIds` array is populated

3. **Verify database**
   - Check Supabase dashboard
   - Query `half_terms` table
   - Verify `stacks` column has data

4. **Test in isolation**
   - Create a fresh stack
   - Assign it to a fresh half-term
   - Follow all console logs step by step

---

**END OF DEBUG GUIDE**


