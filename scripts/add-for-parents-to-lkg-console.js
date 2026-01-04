/**
 * Console script to add "For Parents" lesson to LKG Autumn 1 2025-26
 * 
 * Copy and paste this into the browser console while on the app page.
 */

async function addForParentsToLKG() {
  try {
    console.log('🔍 Searching for "For Parents" lesson...');
    
    // Get Supabase client from window or import
    const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';
    
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Find the lesson titled "For Parents"
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*');
    
    if (lessonsError) {
      console.error('❌ Error querying lessons:', lessonsError);
      throw lessonsError;
    }
    
    if (!lessons || lessons.length === 0) {
      console.error('❌ No lessons found');
      return;
    }
    
    // Find the lesson with title "For Parents"
    let forParentsLesson = null;
    let lessonNumber = null;
    
    for (const lesson of lessons) {
      const lessonData = lesson.data;
      if (lessonData && lessonData.title && 
          lessonData.title.toLowerCase().includes('for parents')) {
        forParentsLesson = lesson;
        // Try to find the lesson number
        if (lessonData.allLessonsData) {
          lessonNumber = Object.keys(lessonData.allLessonsData)[0];
        }
        break;
      }
    }
    
    if (!forParentsLesson) {
      console.error('❌ Could not find lesson with title "For Parents"');
      console.log('Available lessons:', lessons.map(l => ({
        sheet: l.sheet_name,
        year: l.academic_year,
        title: l.data?.title
      })));
      return;
    }
    
    console.log('✅ Found lesson:', {
      id: forParentsLesson.id,
      sheet_name: forParentsLesson.sheet_name,
      academic_year: forParentsLesson.academic_year,
      title: forParentsLesson.data?.title,
      lessonNumber: lessonNumber
    });
    
    // Step 2: Find LKG sheet name
    console.log('\n🔍 Searching for LKG sheet...');
    const { data: yearGroups, error: ygError } = await supabase
      .from('year_groups')
      .select('*')
      .or('name.ilike.%lower kindergarten%,name.ilike.%lkg%');
    
    if (ygError) {
      console.error('❌ Error querying year groups:', ygError);
      throw ygError;
    }
    
    if (!yearGroups || yearGroups.length === 0) {
      console.error('❌ No LKG year group found');
      return;
    }
    
    const lkgYearGroup = yearGroups.find(yg => 
      yg.name.toLowerCase().includes('lower kindergarten') || 
      yg.name.toLowerCase().includes('lkg')
    );
    
    if (!lkgYearGroup) {
      console.error('❌ Could not find LKG year group');
      console.log('Found year groups:', yearGroups.map(yg => ({ id: yg.id, name: yg.name })));
      return;
    }
    
    const lkgSheetName = lkgYearGroup.id || lkgYearGroup.name;
    console.log('✅ Found LKG sheet:', lkgSheetName);
    
    // Step 3: Get current half-term data for A1
    console.log('\n🔍 Fetching Autumn 1 half-term data...');
    const academicYear = '2025-2026';
    const { data: halfTerms, error: htError } = await supabase
      .from('half_terms')
      .select('*')
      .eq('sheet_name', lkgSheetName)
      .eq('academic_year', academicYear)
      .eq('term_id', 'A1');
    
    if (htError) {
      console.error('❌ Error querying half-terms:', htError);
      throw htError;
    }
    
    let currentLessons = [];
    
    if (halfTerms && halfTerms.length > 0) {
      currentLessons = halfTerms[0].lessons || [];
      console.log('✅ Found existing half-term:', {
        id: halfTerms[0].id,
        current_lessons: currentLessons
      });
    } else {
      console.log('⚠️ No existing half-term found, will create new one');
    }
    
    // Step 4: Extract lesson number
    if (!lessonNumber) {
      // Try to find it from the lesson data
      if (forParentsLesson.data && forParentsLesson.data.allLessonsData) {
        lessonNumber = Object.keys(forParentsLesson.data.allLessonsData)[0];
      } else {
        console.warn('⚠️ Could not determine lesson number from data structure');
        console.log('Lesson data structure:', Object.keys(forParentsLesson.data || {}));
        // We need to find the actual lesson number - let's check the sheet_name pattern
        // The lesson might be stored with a specific number
        lessonNumber = prompt('Please enter the lesson number (e.g., "1", "lesson1", etc.):');
        if (!lessonNumber) {
          console.error('❌ Lesson number is required');
          return;
        }
      }
    }
    
    console.log('\n📝 Lesson number to add:', lessonNumber);
    
    // Check if lesson is already in the half-term
    if (currentLessons.includes(lessonNumber)) {
      console.log('ℹ️ Lesson is already assigned to Autumn 1');
      return;
    }
    
    // Step 5: Add lesson to half-term
    const updatedLessons = [...currentLessons, lessonNumber];
    console.log('📝 Updated lessons array:', updatedLessons);
    
    const { data: updatedHalfTerm, error: updateError } = await supabase
      .from('half_terms')
      .upsert({
        sheet_name: lkgSheetName,
        academic_year: academicYear,
        term_id: 'A1',
        name: 'Autumn 1',
        lessons: updatedLessons,
        is_complete: false
      }, {
        onConflict: 'sheet_name,term_id,academic_year'
      })
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating half-term:', updateError);
      throw updateError;
    }
    
    console.log('\n✅ Successfully added "For Parents" lesson to LKG Autumn 1 2025-26!');
    console.log('Updated half-term:', {
      id: updatedHalfTerm.id,
      sheet_name: updatedHalfTerm.sheet_name,
      academic_year: updatedHalfTerm.academic_year,
      term_id: updatedHalfTerm.term_id,
      lessons: updatedHalfTerm.lessons
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
addForParentsToLKG();

