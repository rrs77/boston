/**
 * Browser Console Script - Delete All Lessons
 * 
 * Copy and paste this entire script into your browser console to delete all lessons
 */

(async function deleteAllLessons() {
  console.log('🗑️ Starting deletion of all lessons and lesson plans...');
  
  // Import Supabase client (adjust path if needed)
  const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';
  
  // Create Supabase client
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Delete all lessons
    console.log('📚 Deleting all lessons from Supabase...');
    const { error: lessonsError, count: lessonsCount } = await supabase
      .from('lessons')
      .delete({ count: 'exact' })
      .neq('sheet_name', ''); // Delete all rows
    
    if (lessonsError) {
      console.error('❌ Error deleting lessons:', lessonsError);
      throw lessonsError;
    }
    console.log(`✅ Successfully deleted ${lessonsCount || 0} lessons`);
    
    // Delete all lesson plans
    console.log('📅 Deleting all lesson plans from Supabase...');
    const { error: plansError, count: plansCount } = await supabase
      .from('lesson_plans')
      .delete({ count: 'exact' })
      .neq('id', ''); // Delete all rows
    
    if (plansError) {
      console.error('❌ Error deleting lesson plans:', plansError);
      throw plansError;
    }
    console.log(`✅ Successfully deleted ${plansCount || 0} lesson plans`);
    
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
    
    console.log(`✅ Successfully cleared ${keysToRemove.length} localStorage keys`);
    console.log('🎉 All lessons and lesson plans deleted successfully!');
    console.log('💡 Refresh the page to see the changes');
    
    return { success: true, lessonsDeleted: lessonsCount, plansDeleted: plansCount };
  } catch (error) {
    console.error('❌ Failed to delete lessons:', error);
    alert('Error deleting lessons. Check console for details.');
    throw error;
  }
})();

