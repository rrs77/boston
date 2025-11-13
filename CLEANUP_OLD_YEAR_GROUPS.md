# 🧹 CLEANUP OLD YEAR GROUP LABELS

## Problem
Activities in your database have old year group labels like "EYFS L" and "EYFS U" that no longer exist in the system. These show up on activity cards but shouldn't be there.

## Solution
Run this cleanup script in your browser console to update all activities.

---

## 🔧 CLEANUP SCRIPT

**Instructions:**
1. Open your app in the browser
2. Open DevTools (F12)
3. Go to Console tab
4. Paste this script and press Enter

```javascript
// Cleanup old year group labels from activities
(async function cleanupOldYearGroups() {
  console.log('🧹 Starting cleanup of old year group labels...');
  
  // Map of old labels to new labels
  const yearGroupMapping = {
    'EYFS L': 'Lower Kindergarten',
    'EYFS U': 'Upper Kindergarten',
    'EYFS': 'EYFS',
    'LKG': 'Lower Kindergarten',
    'UKG': 'Upper Kindergarten',
    'Reception': 'Reception',
    'Year 1': 'Year 1',
    'Year 2': 'Year 2'
  };
  
  // Get all activities from Supabase
  const { data: activities, error } = await window.supabase
    .from('activities')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching activities:', error);
    return;
  }
  
  console.log(`📦 Found ${activities.length} activities to check`);
  
  let updatedCount = 0;
  const oldLabels = ['EYFS L', 'EYFS U', 'Lower EYFS', 'Upper EYFS'];
  
  for (const activity of activities) {
    let needsUpdate = false;
    let newYearGroups = [];
    
    // Check if activity has year_groups field (could be string or array)
    if (activity.year_groups) {
      const currentYearGroups = typeof activity.year_groups === 'string' 
        ? [activity.year_groups] 
        : activity.year_groups;
      
      // Check if any year groups are old labels
      const hasOldLabels = currentYearGroups.some(yg => oldLabels.includes(yg));
      
      if (hasOldLabels) {
        needsUpdate = true;
        
        // Map old labels to new ones, or remove if no mapping
        newYearGroups = currentYearGroups
          .map(yg => yearGroupMapping[yg] || yg)
          .filter(yg => !oldLabels.includes(yg)); // Remove any unmapped old labels
        
        // Remove duplicates
        newYearGroups = [...new Set(newYearGroups)];
        
        // If no year groups left, set to default
        if (newYearGroups.length === 0) {
          newYearGroups = ['Lower Kindergarten'];
        }
        
        console.log(`🔄 Updating activity "${activity.activity}":`);
        console.log(`   Old: ${JSON.stringify(currentYearGroups)}`);
        console.log(`   New: ${JSON.stringify(newYearGroups)}`);
        
        // Update in Supabase
        const { error: updateError } = await window.supabase
          .from('activities')
          .update({ year_groups: newYearGroups })
          .eq('id', activity.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating:`, updateError);
        } else {
          console.log(`   ✅ Updated successfully`);
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`📊 Updated ${updatedCount} activities`);
  console.log(`🔄 Refreshing page in 2 seconds...`);
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
})();
```

---

## 🎯 WHAT THIS DOES

1. **Fetches all activities** from Supabase
2. **Identifies activities** with old year group labels:
   - "EYFS L"
   - "EYFS U"
   - "Lower EYFS"
   - "Upper EYFS"
3. **Maps old labels to new ones:**
   - "EYFS L" → "Lower Kindergarten"
   - "EYFS U" → "Upper Kindergarten"
4. **Updates Supabase** with corrected labels
5. **Reloads the page** to show updated activities

---

## ⚠️ ALTERNATIVE: Manual Fix

If you prefer to fix specific activities manually:

### For "Yes we can" activity:

1. Click Edit (pencil icon) on the activity card
2. Uncheck "EYFS L" and "EYFS U" in the Year Groups section
3. Check the correct year groups (e.g., "Lower Kindergarten Music")
4. Save

---

## 🔍 VERIFY CLEANUP

After running the script:

1. ✅ Activity cards should show correct year group labels
2. ✅ No "EYFS L" or "EYFS U" labels anywhere
3. ✅ Activities are properly categorized

---

## 📋 PREVENTION

To prevent this in the future, the system now:
- ✅ Only uses current year groups defined in Settings
- ✅ Validates year groups when creating/editing activities
- ✅ Shows only valid year groups in dropdowns

---

**Need help?** Let me know if you encounter any issues running this cleanup!

