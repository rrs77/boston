/**
 * Utility functions to set up KS1 Maths example data
 * 
 * Usage in browser console:
 * 1. Open the app
 * 2. Open browser console (F12)
 * 3. Import this module or access via window object
 * 4. Call: await setupKS1MathsExample()
 */

import { activitiesApi, lessonsApi, yearGroupsApi, customCategoriesApi } from '../config/api';
import { supabase } from '../config/supabase';

export interface KS1MathsActivity {
  activity: string;
  description: string;
  activityText: string;
  time: number;
  link: string;
  category: string;
  level: string;
  yearGroups: string[];
  teachingUnit: string;
  unitName: string;
  lessonNumber: string;
}

export const KS1_MATHS_ACTIVITIES: KS1MathsActivity[] = [
  {
    activity: 'Number Bonds to 10',
    description: 'Interactive game to practice number bonds to 10',
    activityText: 'Students use an online game to match number pairs that add up to 10.',
    time: 10,
    link: 'https://www.topmarks.co.uk/maths-games/hit-the-button',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Number Bonds',
    lessonNumber: '1'
  },
  {
    activity: 'Shape Sorting',
    description: 'Sort 2D and 3D shapes into categories',
    activityText: 'Students drag and drop shapes into the correct categories using an interactive whiteboard activity.',
    time: 15,
    link: 'https://www.topmarks.co.uk/early-years/shape-monsters',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Shape',
    unitName: '2D and 3D Shapes',
    lessonNumber: '1'
  },
  {
    activity: 'Counting in 2s',
    description: 'Practice counting in multiples of 2',
    activityText: 'Students complete sequences counting in 2s using an online interactive resource.',
    time: 10,
    link: 'https://www.topmarks.co.uk/learning-to-count/counting',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Counting',
    lessonNumber: '1'
  },
  {
    activity: 'Addition Word Problems',
    description: 'Solve simple addition word problems',
    activityText: 'Students read and solve addition word problems using visual aids and manipulatives.',
    time: 20,
    link: 'https://www.bbc.co.uk/bitesize/topics/zf4bkqt',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Addition',
    lessonNumber: '1'
  },
  {
    activity: 'Maths Quiz Review',
    description: 'Quick quiz to review today\'s learning',
    activityText: 'Students answer quick questions about number bonds, shapes, and counting to consolidate learning.',
    time: 10,
    link: 'https://www.topmarks.co.uk/maths-games/mental-maths-train',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Review',
    unitName: 'Consolidation',
    lessonNumber: '1'
  }
];

export async function setupKS1MathsExample() {
  console.log('🚀 Starting KS1 Maths example setup...\n');

  try {
    // Step 1: Create category
    console.log('📁 Step 1: Creating "KS1 Maths" category...');
    try {
      await customCategoriesApi.upsert([{
        name: 'KS1 Maths',
        color: '#8B5CF6',
        position: 0
      }]);
      console.log('✅ Category created');
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('ℹ️ Category already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Create year group
    console.log('\n👥 Step 2: Creating "Example KS1 Maths" year group...');
    const existingYearGroups = await yearGroupsApi.getAll();
    const yearGroupExists = existingYearGroups.some(g => g.name === 'Example KS1 Maths');
    
    if (!yearGroupExists) {
      const newYearGroups = [
        ...existingYearGroups,
        {
          id: 'example-ks1-maths',
          name: 'Example KS1 Maths',
          color: '#8B5CF6'
        }
      ];
      await yearGroupsApi.upsert(newYearGroups);
      console.log('✅ Year group created');
    } else {
      console.log('ℹ️ Year group already exists, continuing...');
    }

    // Step 3: Create activities
    console.log('\n📚 Step 3: Creating activities...');
    const createdActivities = [];
    for (const activityData of KS1_MATHS_ACTIVITIES) {
      try {
        const activity = {
          ...activityData,
          videoLink: '',
          musicLink: '',
          backingLink: '',
          resourceLink: '',
          vocalsLink: '',
          imageLink: '',
          eyfsStandards: []
        };
        const created = await activitiesApi.create(activity as any);
        createdActivities.push(created);
        console.log(`  ✅ Created: ${activityData.activity}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`  ℹ️ Activity "${activityData.activity}" already exists, skipping...`);
        } else {
          console.error(`  ❌ Error creating "${activityData.activity}":`, error);
        }
      }
    }

    // Step 4: Create lesson
    console.log('\n📖 Step 4: Creating example lesson...');
    if (createdActivities.length >= 5) {
      const lessonData = {
        '1': {
          grouped: {
            'Starter': [createdActivities[0]],
            'Main': [createdActivities[1], createdActivities[2], createdActivities[3]],
            'Plenary': [createdActivities[4]]
          },
          categoryOrder: ['Starter', 'Main', 'Plenary'],
          totalTime: 65,
          title: 'Example Lesson'
        }
      };

      await lessonsApi.updateSheet('Example KS1 Maths', {
        allLessonsData: lessonData,
        lessonNumbers: ['1'],
        teachingUnits: ['Number', 'Shape', 'Review'],
        notes: ''
      }, '2026-2027');
      
      console.log('✅ Lesson created');
    } else {
      console.log('⚠️ Not enough activities created to build lesson');
    }

    console.log('\n✅ Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Settings → Categories');
    console.log('2. Find "KS1 Maths" and assign it to "Example KS1 Maths" year group');
    console.log('3. Select "Example KS1 Maths" as your current class');
    console.log('4. Go to Lesson Builder to see the "Example Lesson"');

    return { success: true };
  } catch (error) {
    console.error('❌ Error setting up KS1 Maths example:', error);
    throw error;
  }
}

// Make available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).setupKS1MathsExample = setupKS1MathsExample;
  (window as any).KS1_MATHS_ACTIVITIES = KS1_MATHS_ACTIVITIES;
}

