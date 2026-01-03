/**
 * Node.js script to create KS1 Maths example data in Supabase
 * 
 * Run with: node scripts/setup-ks1-maths.js
 * 
 * Requires: @supabase/supabase-js package (already installed)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const userId = '1'; // Default user ID

async function createKS1MathsExample() {
  console.log('🚀 Starting KS1 Maths example creation...\n');

  try {
    // Step 1: Create the category "KS1 Maths"
    console.log('📁 Step 1: Creating "KS1 Maths" category...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('custom_categories')
      .insert([{
        name: 'KS1 Maths',
        color: '#8B5CF6',
        position: 0
      }])
      .select()
      .single();

    if (categoryError && categoryError.code !== '23505') { // Ignore duplicate key errors
      console.error('❌ Error creating category:', categoryError);
      throw categoryError;
    }
    
    if (categoryData) {
      console.log('✅ Category created:', categoryData.name);
    } else {
      console.log('ℹ️ Category may already exist, continuing...');
    }

    // Step 2: Create year group "Example KS1 Maths"
    console.log('\n👥 Step 2: Creating "Example KS1 Maths" year group...');
    const { data: yearGroupData, error: yearGroupError } = await supabase
      .from('year_groups')
      .insert([{
        name: 'Example KS1 Maths',
        color: '#8B5CF6',
        sort_order: 0
      }])
      .select()
      .single();

    if (yearGroupError && yearGroupError.code !== '23505') {
      console.error('❌ Error creating year group:', yearGroupError);
      throw yearGroupError;
    }
    
    if (yearGroupData) {
      console.log('✅ Year group created:', yearGroupData.name);
    } else {
      console.log('ℹ️ Year group may already exist, continuing...');
    }

    // Step 3: Create activities
    console.log('\n📚 Step 3: Creating activities...');
    const activities = [
      {
        activity: 'Number Bonds to 10',
        description: 'Interactive game to practice number bonds to 10',
        activity_text: 'Students use an online game to match number pairs that add up to 10.',
        time: 10,
        link: 'https://www.topmarks.co.uk/maths-games/hit-the-button',
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        vocals_link: '',
        image_link: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yeargroups: ['Example KS1 Maths'],
        teaching_unit: 'Number',
        unit_name: 'Number Bonds',
        lesson_number: '1',
        eyfs_standards: [],
        user_id: userId
      },
      {
        activity: 'Shape Sorting',
        description: 'Sort 2D and 3D shapes into categories',
        activity_text: 'Students drag and drop shapes into the correct categories using an interactive whiteboard activity.',
        time: 15,
        link: 'https://www.topmarks.co.uk/early-years/shape-monsters',
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        vocals_link: '',
        image_link: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yeargroups: ['Example KS1 Maths'],
        teaching_unit: 'Shape',
        unit_name: '2D and 3D Shapes',
        lesson_number: '1',
        eyfs_standards: [],
        user_id: userId
      },
      {
        activity: 'Counting in 2s',
        description: 'Practice counting in multiples of 2',
        activity_text: 'Students complete sequences counting in 2s using an online interactive resource.',
        time: 10,
        link: 'https://www.topmarks.co.uk/learning-to-count/counting',
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        vocals_link: '',
        image_link: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yeargroups: ['Example KS1 Maths'],
        teaching_unit: 'Number',
        unit_name: 'Counting',
        lesson_number: '1',
        eyfs_standards: [],
        user_id: userId
      },
      {
        activity: 'Addition Word Problems',
        description: 'Solve simple addition word problems',
        activity_text: 'Students read and solve addition word problems using visual aids and manipulatives.',
        time: 20,
        link: 'https://www.bbc.co.uk/bitesize/topics/zf4bkqt',
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        vocals_link: '',
        image_link: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yeargroups: ['Example KS1 Maths'],
        teaching_unit: 'Number',
        unit_name: 'Addition',
        lesson_number: '1',
        eyfs_standards: [],
        user_id: userId
      },
      {
        activity: 'Maths Quiz Review',
        description: 'Quick quiz to review today\'s learning',
        activity_text: 'Students answer quick questions about number bonds, shapes, and counting to consolidate learning.',
        time: 10,
        link: 'https://www.topmarks.co.uk/maths-games/mental-maths-train',
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        vocals_link: '',
        image_link: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yeargroups: ['Example KS1 Maths'],
        teaching_unit: 'Review',
        unit_name: 'Consolidation',
        lesson_number: '1',
        eyfs_standards: [],
        user_id: userId
      }
    ];

    // Insert activities
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .insert(activities)
      .select();

    if (activitiesError) {
      console.error('❌ Error creating activities:', activitiesError);
      throw activitiesError;
    }
    
    console.log(`✅ Created ${activitiesData.length} activities`);

    // Step 4: Create the lesson
    console.log('\n📖 Step 4: Creating example lesson...');
    
    // Get the activity IDs we just created
    const activityIds = activitiesData.map(a => a.id);
    
    // Create lesson data structure
    const lessonData = {
      '1': {
        grouped: {
          'Starter': [activitiesData[0]], // Number Bonds to 10
          'Main': [activitiesData[1], activitiesData[2], activitiesData[3]], // Shape Sorting, Counting in 2s, Addition Word Problems
          'Plenary': [activitiesData[4]] // Maths Quiz Review
        },
        categoryOrder: ['Starter', 'Main', 'Plenary'],
        totalTime: 65, // 10 + 15 + 10 + 20 + 10
        title: 'Example Lesson'
      }
    };

    // Save lesson to Supabase
    const { data: lessonRecord, error: lessonError } = await supabase
      .from('lessons')
      .upsert({
        sheet_name: 'Example KS1 Maths',
        academic_year: '2026-2027',
        data: lessonData,
        lesson_numbers: ['1'],
        teaching_units: ['Number', 'Shape', 'Review'],
        notes: ''
      }, {
        onConflict: 'sheet_name,academic_year'
      })
      .select()
      .single();

    if (lessonError) {
      console.error('❌ Error creating lesson:', lessonError);
      throw lessonError;
    }
    
    console.log('✅ Lesson created:', lessonRecord.sheet_name);

    // Step 5: Update category to assign it to the year group
    console.log('\n🔗 Step 5: Assigning category to year group...');
    // Note: Category-year group assignment is done through the Settings UI
    // The category needs to be assigned to "Example KS1 Maths" in Settings → Categories
    
    console.log('\n✅ All data created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Settings → Categories');
    console.log('2. Find "KS1 Maths" category');
    console.log('3. Assign it to "Example KS1 Maths" year group');
    console.log('4. Go to Lesson Builder and select "Example KS1 Maths"');
    console.log('5. You should see the "Example Lesson" with starter, main, and plenary activities');
    
  } catch (error) {
    console.error('❌ Error creating KS1 Maths example:', error);
    process.exit(1);
  }
}

// Run the script
createKS1MathsExample()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

