/**
 * Script to add example KS1 Maths curriculum objectives
 * 
 * This creates:
 * - Year Group: "KS1 Maths"
 * - Areas: Number, Shape, Measurement, Statistics
 * - Objectives: Example curriculum objectives for each area
 * 
 * Run in browser console after app loads:
 * await addKS1MathsObjectives()
 */

import { customObjectivesApi } from '../config/customObjectivesApi';

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
  (window as any).addKS1MathsObjectives = addKS1MathsObjectives;
}

