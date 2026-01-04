/**
 * Browser Console Script to add "For Parents" lesson to LKG Autumn 1 2025-26
 * 
 * Run this in the browser console while on the app page.
 * It will:
 * 1. Find the lesson titled "For Parents" in Supabase
 * 2. Find the LKG sheet name
 * 3. Get current lessons for Autumn 1 (A1) half-term
 * 4. Add the lesson to that half-term
 */

(async function addForParentsToLKG() {
  try {
    console.log('🔍 Searching for "For Parents" lesson...');
    
    // Import Supabase client from the app
    const { supabase, TABLES } = await import('/src/config/supabase.ts');
    
    // Step 1: Find the lesson titled "For Parents"
    // Query lessons table - the title is stored in the data JSONB column
    const { data: lessons, error: lessonsError } = await supabase
      .from(TABLES.LESSONS)
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
      if (lessonData) {
        // Check if title matches
        const title = lessonData.title || '';
        if (title.toLowerCase().includes('for parents')) {
          forParentsLesson = lesson;
          // Try to find the lesson number from the data structure
          if (lessonData.allLessonsData) {
            lessonNumber = Object.keys(lessonData.allLessonsData)[0];
          }
          break;
        }
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
      .from(TABLES.YEAR_GROUPS)
      .select('*')
      .or('name.ilike.%lower kindergarten%,name.ilike.%lkg%,id.ilike.%lkg%');
    
    if (ygError) {
      console.error('❌ Error querying year groups:', ygError);
      throw ygError;
    }
    
    if (!yearGroups || yearGroups.length === 0) {
      console.error('❌ No LKG year group found');
      return;
    }
    
    // Find LKG sheet - it might be "Lower Kindergarten Music" or similar
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
      .from(TABLES.HALF_TERMS)
      .select('*')
      .eq('sheet_name', lkgSheetName)
      .eq('academic_year', academicYear)
      .eq('term_id', 'A1');
    
    if (htError) {
      console.error('❌ Error querying half-terms:', htError);
      throw htError;
    }
    
    let currentLessons = [];
    let halfTermId = null;
    
    if (halfTerms && halfTerms.length > 0) {
      halfTermId = halfTerms[0].id;
      currentLessons = halfTerms[0].lessons || [];
      console.log('✅ Found existing half-term:', {
        id: halfTermId,
        current_lessons: currentLessons
      });
    } else {
      console.log('⚠️ No existing half-term found, will create new one');
    }
    
    // Step 4: Extract lesson number
    // If we didn't find it in the data structure, try to extract from sheet_name or use a default
    if (!lessonNumber) {
      // Try to find lesson number from the lesson data structure
      if (forParentsLesson.data && forParentsLesson.data.allLessonsData) {
        lessonNumber = Object.keys(forParentsLesson.data.allLessonsData)[0];
      } else {
        // Fallback: use a pattern based on the sheet
        console.warn('⚠️ Could not determine lesson number, checking lesson data structure...');
        console.log('Lesson data keys:', Object.keys(forParentsLesson.data || {}));
        // We'll need to prompt the user or try common patterns
        lessonNumber = 'for-parents'; // Fallback
      }
    }
    
    console.log('\n📝 Lesson number to add:', lessonNumber);
    
    // Check if lesson is already in the half-term
    if (currentLessons.includes(lessonNumber)) {
      console.log('ℹ️ Lesson is already assigned to Autumn 1');
      return;
    }
    
    // Step 5: Add lesson to half-term using the API function
    const updatedLessons = [...currentLessons, lessonNumber];
    console.log('📝 Updated lessons array:', updatedLessons);
    
    // Import the API function
    const { halfTermsApi } = await import('/src/config/api.ts');
    
    const result = await halfTermsApi.updateHalfTerm(
      lkgSheetName,
      'A1',
      updatedLessons,
      false,
      academicYear
    );
    
    console.log('\n✅ Successfully added "For Parents" lesson to LKG Autumn 1 2025-26!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();

