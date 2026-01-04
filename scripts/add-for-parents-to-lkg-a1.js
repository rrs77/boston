/**
 * Script to add "For Parents" lesson to LKG Autumn 1 2025-26
 * 
 * This script:
 * 1. Finds the lesson titled "For Parents" in Supabase
 * 2. Finds the LKG sheet name
 * 3. Gets current lessons for Autumn 1 (A1) half-term
 * 4. Adds the lesson to that half-term
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addForParentsToLKG() {
  try {
    console.log('🔍 Searching for "For Parents" lesson...');
    
    // Step 1: Find the lesson titled "For Parents"
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .or('data->>title.ilike.%For Parents%,data->>title.ilike.%for parents%');
    
    if (lessonsError) {
      console.error('❌ Error querying lessons:', lessonsError);
      throw lessonsError;
    }
    
    if (!lessons || lessons.length === 0) {
      console.error('❌ No lesson found with title "For Parents"');
      return;
    }
    
    // Find the exact match
    let forParentsLesson = null;
    for (const lesson of lessons) {
      const lessonData = lesson.data;
      if (lessonData && lessonData.title && 
          (lessonData.title.toLowerCase().includes('for parents') || 
           lessonData.title === 'For Parents')) {
        forParentsLesson = lesson;
        break;
      }
    }
    
    if (!forParentsLesson) {
      console.error('❌ Could not find exact match for "For Parents" lesson');
      console.log('Found lessons:', lessons.map(l => l.data?.title));
      return;
    }
    
    console.log('✅ Found lesson:', {
      id: forParentsLesson.id,
      sheet_name: forParentsLesson.sheet_name,
      academic_year: forParentsLesson.academic_year,
      title: forParentsLesson.data?.title
    });
    
    // Step 2: Find LKG sheet name
    console.log('\n🔍 Searching for LKG sheet...');
    const { data: yearGroups, error: ygError } = await supabase
      .from('year_groups')
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
      console.log('Found year groups:', yearGroups.map(yg => yg.name));
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
    
    // Step 4: Extract lesson number from the lesson data
    // The lesson number might be in the data object or we need to find it
    const lessonNumber = forParentsLesson.data?.lessonNumber || 
                        Object.keys(forParentsLesson.data?.allLessonsData || {})[0] ||
                        'for-parents';
    
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
    process.exit(1);
  }
}

// Run the script
addForParentsToLKG();

