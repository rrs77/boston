# 🎨 Coral Accent Color Guide

## Overview
A vibrant **Coral** (#FF6B6B) accent color has been added to complement the existing teal color scheme. This creates a modern, eye-catching contrast that makes the app more visually appealing and helps highlight important actions.

## Color Palette

### Primary Colors
- **Teal (Primary)**: `#14B8A6` → `#0D9488` (gradient)
- **Coral (Accent)**: `#FF6B6B` → `#FF5252` (gradient)

### Coral Shades Available
- `coral-50`: `#FFF5F5` (lightest)
- `coral-100`: `#FFE5E5`
- `coral-200`: `#FFCCCC`
- `coral-300`: `#FF9999`
- `coral-400`: `#FF6B6B` (main accent)
- `coral-500`: `#FF5252` (darker)
- `coral-600`: `#FF4444`
- `coral-700`: `#E63946`
- `coral-800`: `#C62828`
- `coral-900`: `#B71C1C` (darkest)

## Usage Guidelines

### ✅ Use Coral For:
1. **Special Actions**
   - "Create New" buttons
   - "Add" actions
   - "Save & Publish" buttons
   - Important CTAs (Call-to-Actions)

2. **Highlights & Badges**
   - New/Featured indicators
   - Important notifications
   - Status badges (e.g., "New", "Hot", "Featured")
   - Achievement badges

3. **Accent Elements**
   - Hover states on special cards
   - Active state indicators
   - Progress bars for special tasks
   - Icon highlights

4. **Visual Interest**
   - Alternating card accents
   - Section dividers
   - Decorative elements

### ❌ Don't Use Coral For:
- Primary navigation (use teal)
- Standard buttons (use teal)
- Error states (use red)
- Warning states (use amber/yellow)
- Success states (use green)

## Implementation Examples

### Buttons
```tsx
// Special action button
<button className="btn-accent">
  Create New Lesson
</button>

// Using Tailwind classes
<button className="bg-gradient-to-r from-coral-400 to-coral-500 text-white rounded-button px-4 py-2">
  Add Stack
</button>
```

### Badges
```tsx
<span className="badge-accent">New</span>

// Or with Tailwind
<span className="bg-gradient-to-r from-coral-400 to-coral-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
  Featured
</span>
```

### Cards with Coral Accent
```tsx
<div className="rounded-card shadow-soft border-l-4 border-coral-400">
  {/* Card content */}
</div>
```

### Hover States
```tsx
<button className="hover-accent border border-gray-300 rounded-button px-4 py-2">
  Special Action
</button>
```

## Suggested Places to Add Coral

1. **"Create New Lesson" button** in Lesson Library
2. **"Add Stack" button** in Lesson Stacks section
3. **"Create Unit" button** in Unit Viewer
4. **"Add Activity" button** in Activity Library
5. **"New" badges** on recently created items
6. **Featured/Highlighted cards** with coral left border
7. **Special action buttons** in modals
8. **Progress indicators** for important workflows
9. **Hover states** on interactive cards
10. **Active tab indicators** (alternating with teal)

## Design Principles

- **Balance**: Use coral sparingly (20-30% of colored elements)
- **Contrast**: Coral works beautifully against teal backgrounds
- **Hierarchy**: Coral draws attention to important actions
- **Consistency**: Use the same coral shade (#FF6B6B) throughout

## Tailwind Classes Available

- `bg-coral-{50-900}` - Background colors
- `text-coral-{50-900}` - Text colors
- `border-coral-{50-900}` - Border colors
- `bg-gradient-accent` - Coral gradient background
- `bg-gradient-teal-coral` - Teal to coral gradient

## CSS Classes Available

- `.btn-accent` - Coral accent button
- `.badge-accent` - Coral badge/pill
- `.border-accent` - Coral border
- `.text-accent` - Coral text
- `.bg-accent-light` - Light coral background
- `.hover-accent` - Coral hover state

