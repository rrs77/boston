# KS1 Maths Example Setup

This guide explains how to create the KS1 Maths example data including:
- A new category "KS1 Maths"
- Example activities with online links
- A new year group "Example KS1 Maths"
- An example lesson with starter, main, and plenary activities

## Quick Setup (Recommended)

1. **Open the app in your browser**
2. **Open the browser console** (F12 or Cmd+Option+I)
3. **Run the setup function:**
   ```javascript
   await setupKS1MathsExample()
   ```
4. **Complete the setup in Settings:**
   - Go to **Settings → Categories**
   - Find **"KS1 Maths"** category
   - Assign it to **"Example KS1 Maths"** year group
   - Save settings

5. **View the lesson:**
   - Select **"Example KS1 Maths"** as your current class
   - Go to **Lesson Builder**
   - You should see the **"Example Lesson"** with:
     - **Starter:** Number Bonds to 10
     - **Main:** Shape Sorting, Counting in 2s, Addition Word Problems
     - **Plenary:** Maths Quiz Review

## What Gets Created

### Category
- **Name:** KS1 Maths
- **Color:** #8B5CF6 (Purple)

### Year Group
- **Name:** Example KS1 Maths
- **Color:** #8B5CF6 (Purple)

### Activities (5 total)
1. **Number Bonds to 10** (10 min)
   - Link: https://www.topmarks.co.uk/maths-games/hit-the-button
   - Category: KS1 Maths
   - Teaching Unit: Number

2. **Shape Sorting** (15 min)
   - Link: https://www.topmarks.co.uk/early-years/shape-monsters
   - Category: KS1 Maths
   - Teaching Unit: Shape

3. **Counting in 2s** (10 min)
   - Link: https://www.topmarks.co.uk/learning-to-count/counting
   - Category: KS1 Maths
   - Teaching Unit: Number

4. **Addition Word Problems** (20 min)
   - Link: https://www.bbc.co.uk/bitesize/topics/zf4bkqt
   - Category: KS1 Maths
   - Teaching Unit: Number

5. **Maths Quiz Review** (10 min)
   - Link: https://www.topmarks.co.uk/maths-games/mental-maths-train
   - Category: KS1 Maths
   - Teaching Unit: Review

### Lesson
- **Title:** Example Lesson
- **Class:** Example KS1 Maths
- **Academic Year:** 2026-2027
- **Structure:**
  - **Starter:** Number Bonds to 10
  - **Main:** Shape Sorting, Counting in 2s, Addition Word Problems
  - **Plenary:** Maths Quiz Review
- **Total Time:** 65 minutes

## Manual Setup (Alternative)

If you prefer to set up manually:

1. **Create Category:**
   - Go to Settings → Categories
   - Click "Add Category"
   - Name: "KS1 Maths"
   - Color: #8B5CF6
   - Save

2. **Create Year Group:**
   - Go to Settings → Year Groups
   - Click "Add Year Group"
   - ID: "example-ks1-maths"
   - Name: "Example KS1 Maths"
   - Color: #8B5CF6
   - Save

3. **Assign Category to Year Group:**
   - Go to Settings → Categories
   - Find "KS1 Maths"
   - Check "Example KS1 Maths" in the year group assignments
   - Save

4. **Create Activities:**
   - Go to Activity Library
   - Click "Add Activity"
   - Fill in the details for each of the 5 activities listed above
   - Make sure to assign them to "Example KS1 Maths" year group

5. **Create Lesson:**
   - Select "Example KS1 Maths" as your current class
   - Go to Lesson Builder
   - Create a new lesson titled "Example Lesson"
   - Add activities in this order:
     - Starter: Number Bonds to 10
     - Main: Shape Sorting, Counting in 2s, Addition Word Problems
     - Plenary: Maths Quiz Review
   - Save the lesson

## Troubleshooting

### Setup function not found
- Make sure the app is fully loaded
- Refresh the page and try again
- Check that `setupKS1MathsExample` is available in the console by typing: `window.setupKS1MathsExample`

### Activities not showing
- Make sure the category is assigned to the year group in Settings
- Check that you've selected "Example KS1 Maths" as your current class
- Refresh the page

### Lesson not appearing
- Make sure the lesson was created for the correct academic year (2026-2027)
- Check that you've selected "Example KS1 Maths" as your current class
- Try refreshing the page

## Files Created

- `src/utils/setupKS1Maths.ts` - Main setup utility
- `scripts/setup-ks1-maths.js` - Node.js script (requires network access)
- `scripts/setup-ks1-maths-browser.js` - Browser console script (data structure only)
- `scripts/create-ks1-maths-example.js` - Data structure reference

