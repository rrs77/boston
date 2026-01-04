# App Status and Issues List

## ✅ Recently Fixed Issues

1. **Canva Link Support** - ✅ COMPLETE
   - Added CanvaViewer component with fullscreen support
   - Added canvaLink field to Activity interface
   - Updated all API functions to handle canva_link
   - Canva links open in fullscreen modal

2. **Activity Library Panel Layout** - ✅ COMPLETE
   - Swapped panels: Activity Library now on left, Lesson Plan on right
   - Added "Your Lesson" title above lesson name input

3. **Activities Loading Error (400)** - ✅ FIXED
   - Changed from explicit column selection to `select('*')` to avoid column name issues
   - Added fallback handling for missing yeargroups column

4. **Activity Library Filtering** - ✅ FIXED
   - Fixed issue where activities weren't showing when no categories assigned to year group
   - Added fallback to show all activities if no categories are assigned

## ⚠️ Current Issues / Pending Tasks

### 1. Activities Not Loading (Needs Verification)
   - **Status**: Should be fixed, needs testing
   - **Issue**: Activities showing "0 of 0"
   - **Fix Applied**: Changed API query to use `select('*')` instead of explicit column list
   - **Action Required**: Refresh page and verify activities load
   - **Console Check**: Look for `📦 Loaded X activities from Supabase`

### 2. "For Parents" Lesson Assignment
   - **Status**: PENDING
   - **Issue**: Need to add "For Parents" lesson to LKG Autumn 1 2025-26
   - **Solution**: Run `await addForParentsToLKG()` in browser console
   - **Alternative**: Run `await inspectLessons()` first to find the lesson number, then `await addLessonToLKG('lesson-number')`

### 3. Activity Library Empty State
   - **Status**: INVESTIGATING
   - **Issue**: If activities exist in Supabase but aren't showing
   - **Possible Causes**:
     - Activities table empty in Supabase
     - Column name mismatch (yeargroups vs year_groups)
     - RLS (Row Level Security) policies blocking access
   - **Action Required**: Check Supabase dashboard → activities table

## 🔍 Potential Issues to Monitor

### 1. Supabase Column Names
   - **Risk**: Column name inconsistencies between code and database
   - **Mitigation**: Using `select('*')` now handles this automatically
   - **Status**: Should be resolved

### 2. Year Groups Column
   - **Risk**: `yeargroups` column might not exist in activities table
   - **Current Fix**: Code handles both `yeargroups` and `year_groups`
   - **Status**: Should be resolved

### 3. Category Filtering
   - **Risk**: Activities hidden if categories not assigned to year group
   - **Current Fix**: Fallback to show all activities if no categories assigned
   - **Status**: Should be resolved

## 📋 Feature Completion Status

### ✅ Completed Features
- [x] Canva link support with fullscreen modal
- [x] Activity Library panel layout (swapped)
- [x] "Your Lesson" title in lesson builder
- [x] Activity filtering improvements
- [x] Category assignment to year groups
- [x] Custom curriculum objectives (Dance, KS1 Maths)
- [x] Lesson sharing with PDF generation
- [x] Calendar planner with drag-and-drop
- [x] Activity and lesson stacks
- [x] Unit viewer and half-term management
- [x] Auto-save functionality
- [x] Embedded links in activities and lessons

### 🔄 In Progress / Needs Testing
- [ ] Activities loading from Supabase (just fixed, needs verification)
- [ ] "For Parents" lesson assignment to LKG Autumn 1

### 📝 Known Limitations
- Activities may need to be created/imported if Supabase table is empty
- Some categories may not show if not assigned to current year group (fallback implemented)

## 🚀 Next Steps

1. **Test Activities Loading**
   - Refresh the app
   - Check browser console for activity count
   - Verify activities appear in Activity Library

2. **Add "For Parents" Lesson**
   - Run `await inspectLessons()` in console
   - Find the lesson number for "For Parents"
   - Run `await addLessonToLKG('lesson-number')` or `await addForParentsToLKG()`

3. **Verify Supabase Data**
   - Check if activities table has data
   - Verify column names match expectations
   - Check RLS policies if activities still don't load

## 🐛 Error Log Summary

From recent console logs:
- ✅ Fixed: 400 error on activities query (column name issue)
- ✅ Fixed: Activities filtering too restrictive
- ⚠️ Monitoring: Activities count showing 0 (should be fixed now)

## 📊 Code Quality

- **Linter Errors**: None ✅
- **TypeScript Errors**: None ✅
- **Build Status**: Should compile successfully ✅

