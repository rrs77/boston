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
import { customObjectivesApi } from '../config/customObjectivesApi';
import { supabase } from '../config/supabase';
import type { CustomObjectiveYearGroup } from '../types/customObjectives';

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
  // Starter Activities
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
    activity: 'Counting Warm-Up',
    description: 'Quick counting activity to get students engaged',
    activityText: 'Students count objects on screen and identify the total number.',
    time: 5,
    link: 'https://www.topmarks.co.uk/learning-to-count/counting',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Counting',
    lessonNumber: '1'
  },
  {
    activity: 'Shape Recognition',
    description: 'Quick shape identification activity',
    activityText: 'Students identify and name common 2D shapes shown on screen.',
    time: 8,
    link: 'https://www.topmarks.co.uk/early-years/shape-monsters',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Shape',
    unitName: '2D Shapes',
    lessonNumber: '1'
  },
  
  // Main Activities - Number
  {
    activity: 'Counting in 2s',
    description: 'Practice counting in multiples of 2',
    activityText: 'Students complete sequences counting in 2s using an online interactive resource.',
    time: 15,
    link: 'https://www.topmarks.co.uk/learning-to-count/counting',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Counting',
    lessonNumber: '1'
  },
  {
    activity: 'Counting in 5s',
    description: 'Practice counting in multiples of 5',
    activityText: 'Students complete sequences counting in 5s and identify patterns.',
    time: 15,
    link: 'https://www.topmarks.co.uk/maths-games/5-7-years/counting',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Counting',
    lessonNumber: '1'
  },
  {
    activity: 'Counting in 10s',
    description: 'Practice counting in multiples of 10',
    activityText: 'Students practice skip counting in 10s up to 100.',
    time: 15,
    link: 'https://www.topmarks.co.uk/maths-games/5-7-years/counting',
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
    activity: 'Subtraction within 20',
    description: 'Practice subtraction facts within 20',
    activityText: 'Students solve subtraction problems using visual representations and number lines.',
    time: 20,
    link: 'https://www.topmarks.co.uk/maths-games/subtraction-grids',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Subtraction',
    lessonNumber: '1'
  },
  {
    activity: 'Place Value to 100',
    description: 'Understand tens and ones',
    activityText: 'Students identify the value of digits in two-digit numbers using base 10 blocks.',
    time: 20,
    link: 'https://www.topmarks.co.uk/place-value/place-value-charts',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Number',
    unitName: 'Place Value',
    lessonNumber: '1'
  },
  
  // Main Activities - Shape
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
    activity: '3D Shape Properties',
    description: 'Identify properties of 3D shapes',
    activityText: 'Students explore 3D shapes and identify faces, edges, and vertices.',
    time: 20,
    link: 'https://www.topmarks.co.uk/early-years/shape-monsters',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Shape',
    unitName: '3D Shapes',
    lessonNumber: '1'
  },
  {
    activity: 'Pattern Making',
    description: 'Create and continue patterns',
    activityText: 'Students create repeating patterns using shapes, colors, and numbers.',
    time: 15,
    link: 'https://www.topmarks.co.uk/early-years/shape-patterns',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Shape',
    unitName: 'Patterns',
    lessonNumber: '1'
  },
  
  // Main Activities - Measurement
  {
    activity: 'Comparing Lengths',
    description: 'Compare and order objects by length',
    activityText: 'Students compare objects and use language like longer, shorter, tallest, shortest.',
    time: 15,
    link: 'https://www.topmarks.co.uk/early-years/measuring',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Measurement',
    unitName: 'Length',
    lessonNumber: '1'
  },
  {
    activity: 'Telling Time',
    description: 'Read and tell time to the hour and half hour',
    activityText: 'Students practice reading analogue and digital clocks.',
    time: 20,
    link: 'https://www.topmarks.co.uk/time/teaching-clock',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Measurement',
    unitName: 'Time',
    lessonNumber: '1'
  },
  
  // Main Activities - Statistics
  {
    activity: 'Pictogram Creation',
    description: 'Create simple pictograms',
    activityText: 'Students collect data and create pictograms to represent their findings.',
    time: 20,
    link: 'https://www.topmarks.co.uk/data-handling/data-handling',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Statistics',
    unitName: 'Data Handling',
    lessonNumber: '1'
  },
  {
    activity: 'Tally Charts',
    description: 'Use tally marks to record data',
    activityText: 'Students practice recording data using tally marks and counting groups of 5.',
    time: 15,
    link: 'https://www.topmarks.co.uk/data-handling/data-handling',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Statistics',
    unitName: 'Data Handling',
    lessonNumber: '1'
  },
  
  // Plenary Activities
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
  },
  {
    activity: 'Exit Ticket',
    description: 'Quick assessment of learning',
    activityText: 'Students complete a quick question to demonstrate their understanding before leaving.',
    time: 5,
    link: 'https://www.topmarks.co.uk/maths-games/mental-maths-train',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Review',
    unitName: 'Assessment',
    lessonNumber: '1'
  },
  {
    activity: 'Maths Reflection',
    description: 'Reflect on what was learned',
    activityText: 'Students share one thing they learned and one question they still have.',
    time: 5,
    link: '',
    category: 'KS1 Maths',
    level: 'KS1',
    yearGroups: ['Example KS1 Maths'],
    teachingUnit: 'Review',
    unitName: 'Reflection',
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

/**
 * Add KS1 Maths curriculum objectives to Settings
 * This creates a year group with areas and objectives that can be linked to activities and lessons
 */
export async function addKS1MathsObjectives() {
  console.log('🚀 Adding KS1 Maths curriculum objectives...');

  try {
    // Check if KS1 Maths year group already exists
    const existingYearGroups = await customObjectivesApi.yearGroups.getAll();
    let ks1MathsYearGroup = existingYearGroups.find(yg => yg.name === 'KS1 Maths');

    if (!ks1MathsYearGroup) {
      // Create the year group
      console.log('📁 Creating KS1 Maths year group...');
      ks1MathsYearGroup = await customObjectivesApi.yearGroups.create({
        name: 'KS1 Maths',
        description: 'Key Stage 1 Mathematics curriculum objectives',
        color: '#8B5CF6',
        sort_order: 0
      });
      console.log('✅ Year group created');
    } else {
      console.log('ℹ️ Year group already exists, using existing one');
    }

    // Define the areas and objectives
    const areasData = [
      {
        section: 'Number',
        name: 'Number',
        description: 'Number and place value, addition and subtraction, multiplication and division',
        objectives: [
          {
            code: 'N1',
            text: 'Count to and across 100, forwards and backwards, beginning with 0 or 1, or from any given number',
            description: 'Pupils should be able to count fluently in both directions'
          },
          {
            code: 'N2',
            text: 'Count, read and write numbers to 100 in numerals; count in multiples of twos, fives and tens',
            description: 'Understanding number representation and skip counting'
          },
          {
            code: 'N3',
            text: 'Given a number, identify one more and one less',
            description: 'Understanding number relationships'
          },
          {
            code: 'N4',
            text: 'Identify and represent numbers using objects and pictorial representations including the number line',
            description: 'Using concrete and visual representations'
          },
          {
            code: 'N5',
            text: 'Read and write numbers from 1 to 20 in numerals and words',
            description: 'Number recognition and written form'
          },
          {
            code: 'N6',
            text: 'Use place value and number facts to solve problems',
            description: 'Applying understanding of place value'
          },
          {
            code: 'N7',
            text: 'Add and subtract one-digit and two-digit numbers to 20, including zero',
            description: 'Basic addition and subtraction facts'
          },
          {
            code: 'N8',
            text: 'Solve one-step problems that involve addition and subtraction, using concrete objects and pictorial representations',
            description: 'Problem solving with addition and subtraction'
          },
          {
            code: 'N9',
            text: 'Solve one-step problems involving multiplication and division, by calculating the answer using concrete objects, pictorial representations and arrays',
            description: 'Introduction to multiplication and division'
          }
        ]
      },
      {
        section: 'Shape',
        name: 'Shape, Space and Measures',
        description: 'Properties of shapes, position and direction, measurement',
        objectives: [
          {
            code: 'S1',
            text: 'Recognise and name common 2-D shapes, including rectangles (including squares), circles and triangles',
            description: 'Identifying 2D shapes'
          },
          {
            code: 'S2',
            text: 'Recognise and name common 3-D shapes, including cuboids (including cubes), pyramids and spheres',
            description: 'Identifying 3D shapes'
          },
          {
            code: 'S3',
            text: 'Describe position, direction and movement, including whole, half, quarter and three-quarter turns',
            description: 'Understanding position and rotation'
          },
          {
            code: 'S4',
            text: 'Compare, describe and solve practical problems for: lengths and heights; mass/weight; capacity and volume; time',
            description: 'Comparing measurements'
          },
          {
            code: 'S5',
            text: 'Measure and begin to record: lengths and heights; mass/weight; capacity and volume; time',
            description: 'Using standard and non-standard units'
          },
          {
            code: 'S6',
            text: 'Recognise and know the value of different denominations of coins and notes',
            description: 'Understanding money'
          },
          {
            code: 'S7',
            text: 'Sequence events in chronological order using language such as: before and after, next, first, today, yesterday, tomorrow, morning, afternoon and evening',
            description: 'Understanding time and sequence'
          },
          {
            code: 'S8',
            text: 'Recognise and use language relating to dates, including days of the week, weeks, months and years',
            description: 'Calendar and time vocabulary'
          }
        ]
      },
      {
        section: 'Statistics',
        name: 'Statistics',
        description: 'Handling data and statistics',
        objectives: [
          {
            code: 'ST1',
            text: 'Interpret and construct simple pictograms, tally charts, block diagrams and simple tables',
            description: 'Reading and creating simple data representations'
          },
          {
            code: 'ST2',
            text: 'Ask and answer simple questions by counting the number of objects in each category and sorting the categories by quantity',
            description: 'Collecting and organizing data'
          },
          {
            code: 'ST3',
            text: 'Ask and answer questions about totalling and comparing categorical data',
            description: 'Analyzing and comparing data'
          }
        ]
      }
    ];

    // Get existing areas for this year group
    const existingAreas = await customObjectivesApi.areas.getByYearGroup(ks1MathsYearGroup.id);
    
    // Create or update areas and objectives
    for (const areaData of areasData) {
      let area = existingAreas.find(a => a.name === areaData.name);
      
      if (!area) {
        // Create new area
        console.log(`📚 Creating area: ${areaData.name}...`);
        area = await customObjectivesApi.areas.create({
          year_group_id: ks1MathsYearGroup.id,
          section: areaData.section,
          name: areaData.name,
          description: areaData.description,
          sort_order: areasData.indexOf(areaData)
        });
        console.log(`✅ Area created: ${areaData.name}`);
      } else {
        console.log(`ℹ️ Area already exists: ${areaData.name}`);
      }

      // Get existing objectives for this area
      const existingObjectives = await customObjectivesApi.objectives.getByArea(area.id);

      // Create objectives
      for (const objectiveData of areaData.objectives) {
        const existingObjective = existingObjectives.find(obj => obj.objective_code === objectiveData.code);
        
        if (!existingObjective) {
          console.log(`  ➕ Creating objective: ${objectiveData.code} - ${objectiveData.text.substring(0, 50)}...`);
          await customObjectivesApi.objectives.create({
            area_id: area.id,
            objective_code: objectiveData.code,
            objective_text: objectiveData.text,
            description: objectiveData.description,
            sort_order: areaData.objectives.indexOf(objectiveData)
          });
        } else {
          console.log(`  ℹ️ Objective already exists: ${objectiveData.code}`);
        }
      }
    }

    console.log('\n✅ KS1 Maths curriculum objectives added successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Settings → Custom Objectives');
    console.log('2. Select "KS1 Maths" year group');
    console.log('3. You should see the areas: Number, Shape, Statistics');
    console.log('4. When creating activities, you can now link these objectives');
    console.log('5. When building lessons, objectives will be tracked automatically');

    return { success: true, yearGroupId: ks1MathsYearGroup.id };
  } catch (error) {
    console.error('❌ Error adding KS1 Maths objectives:', error);
    throw error;
  }
}

// Make available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).setupKS1MathsExample = setupKS1MathsExample;
  (window as any).addKS1MathsObjectives = addKS1MathsObjectives;
  (window as any).KS1_MATHS_ACTIVITIES = KS1_MATHS_ACTIVITIES;
}

