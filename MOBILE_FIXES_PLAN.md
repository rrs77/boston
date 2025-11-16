# Mobile Responsiveness Fixes Plan

## Critical Issues Found:

### 1. **Modals Too Wide**
- `LessonDetailsModal`: `max-w-6xl` → needs `max-w-full` on mobile
- `UserSettings`: `max-w-6xl` → needs responsive sizing
- `ActivityDetails`: needs mobile padding adjustments

### 2. **Fixed Width Layouts**
- `LessonPlanBuilderNew`: Uses `width: '58%'` → needs to stack on mobile
- Split-screen layouts don't work on phones

### 3. **Text Overflow**
- Long titles without `truncate` or `break-words`
- Activity names bleeding over edges
- Lesson descriptions not wrapping

### 4. **Tabs Overflow**
- User Settings tabs need horizontal scroll on mobile
- Dashboard tabs need better mobile layout

### 5. **Forms & Inputs**
- Input fields too wide
- Buttons stacking poorly
- Select dropdowns cutting off

### 6. **Grid Layouts**
- Cards in grids need fewer columns on mobile
- Gap sizes too large on small screens

## Fix Strategy:

1. Add mobile-specific max-widths to all modals (`sm:max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl`)
2. Make split-screen layouts stack on mobile (`flex-col md:flex-row`)
3. Add `break-words` and `truncate` to long text
4. Make tabs scrollable horizontally on mobile
5. Adjust padding/spacing for mobile (`p-3 md:p-6`)
6. Reduce grid columns on mobile (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
7. Add `overflow-x-auto` to tables and wide content
8. Test on actual mobile viewport (375px width minimum)

## Files to Fix:
1. ✅ LessonDetailsModal.tsx
2. ✅ UserSettings.tsx
3. ✅ ActivityDetails.tsx
4. ✅ StandaloneLessonCreator.tsx
5. ✅ Dashboard.tsx (tabs)
6. ✅ UnitViewer.tsx (cards)
7. ✅ LessonLibrary.tsx
8. ✅ ActivityLibrary.tsx
9. ✅ Header.tsx
10. ✅ LessonPlanBuilder.tsx

## Testing Checklist:
- [ ] All modals fit on 375px width screen
- [ ] Text doesn't overflow horizontally
- [ ] Tabs are accessible/scrollable
- [ ] Forms are usable
- [ ] Cards display properly in grid
- [ ] Navigation works on mobile
- [ ] No horizontal scrolling on any page

