/**
 * Utility function to add "For Parents" lesson to LKG Autumn 1 2025-26
 * 
 * Run this in the browser console:
 * await addForParentsToLKG()
 * 
 * Or if you know the lesson number:
 * await addLessonToLKG('lesson-number-here')
 */

import { supabase, TABLES } from '../config/supabase';
import { halfTermsApi } from '../config/api';

/**
 * Helper function to inspect all lessons and find "For Parents"
 * Run: await inspectLessons()
 */
export async function inspectLessons() {
  try {
    console.log('🔍 Fetching all lessons from Supabase...');
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
    
    console.log(`\n📚 Found ${lessons.length} lessons in database\n`);
    
    // Show detailed information about each lesson
    lessons.forEach((lesson, index) => {
      const lessonData = lesson.data || {};
      console.log(`\n--- Lesson ${index + 1} ---`);
      console.log('ID:', lesson.id);
      console.log('Sheet Name:', lesson.sheet_name);
      console.log('Academic Year:', lesson.academic_year);
      console.log('Data Structure:', JSON.stringify(lessonData, null, 2));
      
      // Try to extract titles
      if (lessonData.title) {
        console.log('Main Title:', lessonData.title);
      }
      if (lessonData.allLessonsData) {
        console.log('Lessons in allLessonsData:');
        Object.entries(lessonData.allLessonsData).forEach(([key, ld]: [string, any]) => {
          console.log(`  - Key: ${key}, Title: ${ld.title || 'N/A'}`);
        });
      }
    });
    
    // Look for anything containing "parent" or "for"
    const matches = lessons.filter(l => {
      const data = l.data || {};
      const title = (data.title || '').toLowerCase();
      const sheet = (l.sheet_name || '').toLowerCase();
      return title.includes('parent') || title.includes('for') || sheet.includes('lkg') || sheet.includes('lower');
    });
    
    if (matches.length > 0) {
      console.log('\n\n🔍 Possible matches for "For Parents" or LKG:');
      matches.forEach(l => {
        console.log(`  - Sheet: ${l.sheet_name}, Year: ${l.academic_year}, Title: ${l.data?.title || 'N/A'}`);
      });
    }
    
    return lessons;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

/**
 * Add a specific lesson to LKG Autumn 1 by lesson number
 * Run: await addLessonToLKG('lesson-number')
 */
export async function addLessonToLKG(lessonNumber: string) {
  try {
    console.log(`🔍 Adding lesson "${lessonNumber}" to LKG Autumn 1 2025-26...`);
    
    // Step 1: Find LKG sheet name
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
    
    // Step 2: Get current half-term data for A1
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
    
    let currentLessons: string[] = [];
    
    if (halfTerms && halfTerms.length > 0) {
      currentLessons = halfTerms[0].lessons || [];
      console.log('✅ Found existing half-term:', {
        id: halfTerms[0].id,
        current_lessons: currentLessons
      });
    } else {
      console.log('⚠️ No existing half-term found, will create new one');
    }
    
    // Check if lesson is already in the half-term
    if (currentLessons.includes(lessonNumber)) {
      console.log('ℹ️ Lesson is already assigned to Autumn 1');
      return;
    }
    
    // Step 3: Add lesson to half-term
    const updatedLessons = [...currentLessons, lessonNumber];
    console.log('📝 Updated lessons array:', updatedLessons);
    
    const result = await halfTermsApi.updateHalfTerm(
      lkgSheetName,
      'A1',
      updatedLessons,
      false,
      academicYear
    );
    
    console.log('\n✅ Successfully added lesson to LKG Autumn 1 2025-26!');
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

export async function addForParentsToLKG() {
  try {
    console.log('🔍 Searching for "For Parents" lesson...');
    
    // Step 1: Find the lesson titled "For Parents"
    console.log('📋 Fetching all lessons from Supabase...');
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
    
    console.log(`📚 Found ${lessons.length} lessons in database`);
    
    // First, let's see all available lessons to help debug
    console.log('\n📋 All available lessons:');
    lessons.forEach((lesson, index) => {
      const lessonData = lesson.data || {};
      const titles: string[] = [];
      
      // Try to extract all possible titles from the data structure
      if (lessonData.title) {
        titles.push(lessonData.title);
      }
      if (lessonData.allLessonsData) {
        Object.values(lessonData.allLessonsData).forEach((ld: any) => {
          if (ld.title) titles.push(ld.title);
        });
      }
      
      console.log(`${index + 1}. Sheet: ${lesson.sheet_name}, Year: ${lesson.academic_year}, Titles: ${titles.join(', ') || 'N/A'}`);
    });
    
    // Find the lesson with title "For Parents" - search more broadly
    let forParentsLesson = null;
    let lessonNumber = null;
    
    for (const lesson of lessons) {
      const lessonData = lesson.data || {};
      
      // Check multiple ways the title might be stored
      const title = lessonData.title || '';
      const titleLower = title.toLowerCase();
      
      // Also check in allLessonsData
      let foundInAllLessons = false;
      if (lessonData.allLessonsData) {
        for (const [key, ld] of Object.entries(lessonData.allLessonsData)) {
          const ldData = ld as any;
          if (ldData.title && ldData.title.toLowerCase().includes('for parents')) {
            forParentsLesson = lesson;
            lessonNumber = key;
            foundInAllLessons = true;
            break;
          }
        }
      }
      
      // Check main title
      if (!foundInAllLessons && (titleLower.includes('for parents') || titleLower === 'for parents')) {
        forParentsLesson = lesson;
        // Try to find the lesson number from the data structure
        if (lessonData.allLessonsData) {
          lessonNumber = Object.keys(lessonData.allLessonsData)[0];
        }
        break;
      }
    }
    
    if (!forParentsLesson) {
      console.error('\n❌ Could not find lesson with title containing "For Parents"');
      console.log('\n💡 Please check the lesson titles above and verify:');
      console.log('   1. The lesson exists in Supabase');
      console.log('   2. The title contains "For Parents" (case-insensitive)');
      console.log('   3. The lesson is associated with the correct sheet');
      
      // Try to find lessons that might be related
      const possibleMatches = lessons.filter(l => {
        const data = l.data || {};
        const title = (data.title || '').toLowerCase();
        return title.includes('parent') || title.includes('for');
      });
      
      if (possibleMatches.length > 0) {
        console.log('\n🔍 Found possible matches:');
        possibleMatches.forEach(l => {
          console.log(`   - Sheet: ${l.sheet_name}, Title: ${l.data?.title || 'N/A'}`);
        });
      }
      
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
    
    // Find LKG sheet
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
    
    let currentLessons: string[] = [];
    
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
      // Try to find it from the lesson data structure
      if (forParentsLesson.data && forParentsLesson.data.allLessonsData) {
        lessonNumber = Object.keys(forParentsLesson.data.allLessonsData)[0];
      } else {
        // Check if there's a lesson number in the data
        const dataKeys = Object.keys(forParentsLesson.data || {});
        console.log('Lesson data keys:', dataKeys);
        
        // Try to find lesson number from the sheet_name pattern or data
        // The lesson might be stored with a number like "1", "lesson1", etc.
        if (forParentsLesson.sheet_name) {
          // Extract number from sheet if possible
          const match = forParentsLesson.sheet_name.match(/(\d+)/);
          if (match) {
            lessonNumber = match[1];
          }
        }
        
        if (!lessonNumber) {
          console.warn('⚠️ Could not determine lesson number automatically');
          console.log('Please check the lesson data structure and provide the lesson number manually');
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
    
    // Step 5: Add lesson to half-term using the API function
    const updatedLessons = [...currentLessons, lessonNumber];
    console.log('📝 Updated lessons array:', updatedLessons);
    
    const result = await halfTermsApi.updateHalfTerm(
      lkgSheetName,
      'A1',
      updatedLessons,
      false,
      academicYear
    );
    
    console.log('\n✅ Successfully added "For Parents" lesson to LKG Autumn 1 2025-26!');
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).addForParentsToLKG = addForParentsToLKG;
  (window as any).inspectLessons = inspectLessons;
  (window as any).addLessonToLKG = addLessonToLKG;
}

