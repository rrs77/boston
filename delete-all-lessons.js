/**
 * Script to delete all lessons and lesson plans from Supabase
 * 
 * Usage:
 * 1. Open browser console
 * 2. Copy and paste this entire script
 * 3. Run: deleteAllLessons()
 * 
 * Or import in your code:
 * import { deleteAllLessons } from './delete-all-lessons.js';
 */

import { supabase, TABLES } from './src/config/supabase.js';

export async function deleteAllLessons() {
  console.log('🗑️ Starting deletion of all lessons and lesson plans...');
  
  try {
    // Delete all lessons
    console.log('📚 Deleting all lessons from Supabase...');
    const { error: lessonsError } = await supabase
      .from(TABLES.LESSONS)
      .delete()
      .neq('sheet_name', ''); // Delete all rows
    
    if (lessonsError) {
      console.error('❌ Error deleting lessons:', lessonsError);
      throw lessonsError;
    }
    console.log('✅ Successfully deleted all lessons');
    
    // Delete all lesson plans
    console.log('📅 Deleting all lesson plans from Supabase...');
    const { error: plansError } = await supabase
      .from(TABLES.LESSON_PLANS)
      .delete()
      .neq('id', ''); // Delete all rows
    
    if (plansError) {
      console.error('❌ Error deleting lesson plans:', plansError);
      throw plansError;
    }
    console.log('✅ Successfully deleted all lesson plans');
    
    // Clear localStorage
    console.log('🧹 Clearing lesson data from localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lesson-data-') || key.startsWith('half-terms-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  Removed: ${key}`);
    });
    
    console.log('✅ Successfully cleared localStorage');
    console.log('🎉 All lessons and lesson plans deleted successfully!');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete lessons:', error);
    throw error;
  }
}

// For browser console usage
if (typeof window !== 'undefined') {
  window.deleteAllLessons = deleteAllLessons;
  console.log('💡 Run deleteAllLessons() in the console to delete all lessons');
}

