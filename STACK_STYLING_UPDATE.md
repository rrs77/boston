# Stack Card Styling Update - House Style Colors 🎨

## Changes Made

### ✅ Color Scheme Updated

**BEFORE (Purple):**
- Primary: `#8B5CF6` (Purple)
- Secondary: `#7C3AED` (Darker Purple)
- Accent: `#6D28D9` (Deep Purple)

**AFTER (Teal/Blue House Style):**
- Primary: `#10A293` (Teal - matches house style)
- Secondary: `#0EA5E9` (Cyan Blue)
- Accent: `#0D9488` (Darker Teal)

---

## Files Updated

### 1. **StackCard.tsx** ✅
- Updated layered background colors (back/middle layers) to teal shades
- Changed header gradient from purple to teal/blue: `linear-gradient(135deg, #10A293 0%, #0EA5E9 100%)`
- Updated border color to match teal: `#10A293`
- Maintained the distinctive 3-layer stacked visual effect
- Updated card styling to match lesson card structure:
  - Changed `shadow-xl` to `shadow-lg` (consistency)
  - Changed `hover:scale-[1.01]` to `hover:scale-[1.02]` (consistency)
  - Changed border from `borderLeftWidth: '6px'` to `borderWidth: '1px'` (consistency)

### 2. **StackModal.tsx** ✅
- Updated modal header gradient to match: `linear-gradient(135deg, #10A293 0%, #0EA5E9 100%)`
- Updated theme props for lesson cards inside modal:
  - `primary: '#10A293'` (teal)
  - `secondary: '#0EA5E9'` (cyan blue)
  - `accent: '#0D9488'` (dark teal)

### 3. **LessonSelectionModal.tsx** ✅
- Updated "Lesson Stacks" section header star icon from purple to teal: `#10A293`
- Updated both instances (Half-Term View and Lesson Selection View)

---

## Visual Result

### Stack Card Appearance:
```
┌─────────────────────────────────┐
│    [Layered Shadow - Teal]      │  ← Back layer (#0D9488)
│  ┌─────────────────────────────┐│
│  │  [Layered Shadow - Teal]    ││  ← Middle layer (#10A293)
│  │┌────────────────────────────┐││
│  ││ TEAL/BLUE GRADIENT HEADER  │││  ← Gradient (#10A293 → #0EA5E9)
│  ││ Stack Name                 │││
│  ││ "Stack" badge              │││
│  ││────────────────────────────│││
│  ││ 3 lessons | 90 min         │││
│  ││                            │││
│  ││ Description text...        │││
│  ││                            │││
│  ││ • Lesson 1                 │││
│  ││ • Lesson 2                 │││
│  ││ • Lesson 3                 │││
│  │└────────────────────────────┘││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

---

## Color Palette Reference

### House Style Colors:
- **Primary Teal:** `#10A293` - Main brand color
- **Cyan Blue:** `#0EA5E9` - Secondary accent
- **Dark Teal:** `#0D9488` - Darker shade for depth
- **Blue:** `#4580ED` - Used for lesson cards

### Where Colors Are Used:
- **Stack layers:** Teal shades for the 3D stacked effect
- **Header gradient:** Teal to Cyan Blue gradient
- **Border:** Teal color matching house style
- **Icons:** Teal for "Lesson Stacks" section headers

---

## Card Sizing

Stack cards now match lesson card dimensions:
- Same `h-full flex flex-col` structure
- Same border width (1px instead of 6px left border)
- Same shadow effects (`shadow-lg`)
- Same hover effects (`hover:scale-[1.02]`)
- Same padding and spacing

This ensures **consistent grid layout** when stacks and lessons appear together in:
- Half-Term Planner
- Unit Viewer
- Lesson Selection Modal

---

## Testing Checklist

✅ **Visual Consistency:**
- [ ] Stack cards display with teal/blue gradient header
- [ ] Stack cards are same size as lesson cards in grid
- [ ] Layered effect uses teal shades (not purple)
- [ ] Stack modal header uses teal/blue gradient
- [ ] "Lesson Stacks" section headers use teal star icon

✅ **Locations to Check:**
1. **Lesson Library** - Lesson Stacks section
2. **Half-Term Planner** - When viewing a half-term with stacks
3. **Unit Viewer** - When viewing unit details with stacks
4. **Stack Modal** - When clicking a stack

---

## Before & After Comparison

### BEFORE:
- 💜 Purple color scheme
- 🟣 Thick left border (6px)
- ⚖️ Slightly different sizing from lesson cards

### AFTER:
- 🟢 Teal/blue house style colors
- 🔷 Standard border (1px all around)
- ✅ Consistent sizing with lesson cards
- ✅ Maintains distinctive 3-layer stacked visual

---

## Additional Benefits

1. **Brand Consistency:** Matches your app's teal/blue color scheme throughout
2. **Visual Hierarchy:** Teal color clearly distinguishes stacks while staying on-brand
3. **Professional Look:** Consistent styling creates polished, cohesive UI
4. **Easy Identification:** Layered teal effect makes stacks instantly recognizable

---

**All changes applied successfully! ✨**

The stack cards now follow your house style and maintain consistent sizing with lesson cards throughout the app.


