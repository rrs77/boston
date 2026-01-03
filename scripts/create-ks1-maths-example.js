/**
 * Script to create KS1 Maths example data:
 * 1. Create "KS1 Maths" category
 * 2. Create example activities with links
 * 3. Create "Example KS1 Maths" year group
 * 4. Create an example lesson with starter, main, and plenary activities
 * 
 * Run this in the browser console when the app is loaded, or adapt for Node.js
 */

// This script should be run in the browser console after the app loads
// It uses the app's context and API functions

async function createKS1MathsExample() {
  console.log('🚀 Starting KS1 Maths example creation...');

  try {
    // Step 1: Create the category "KS1 Maths"
    console.log('📁 Step 1: Creating "KS1 Maths" category...');
    // This would use SettingsContext's addCategoryPermanently
    // In browser console: window.settingsContext?.addCategoryPermanently('KS1 Maths', '#8B5CF6');
    
    // Step 2: Create activities
    console.log('📚 Step 2: Creating activities...');
    const activities = [
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

    // Step 3: Create year group "Example KS1 Maths"
    console.log('👥 Step 3: Creating "Example KS1 Maths" year group...');
    
    // Step 4: Create example lesson
    console.log('📖 Step 4: Creating example lesson...');
    const exampleLesson = {
      '1': {
        grouped: {
          'Starter': [activities[0]], // Number Bonds to 10
          'Main': [activities[1], activities[2], activities[3]], // Shape Sorting, Counting in 2s, Addition Word Problems
          'Plenary': [activities[4]] // Maths Quiz Review
        },
        categoryOrder: ['Starter', 'Main', 'Plenary'],
        totalTime: 65, // 10 + 15 + 10 + 20 + 10
        title: 'Example Lesson'
      }
    };

    console.log('✅ Example data structure created!');
    console.log('📋 Next steps:');
    console.log('1. Use SettingsContext to add the category');
    console.log('2. Use activitiesApi.create() for each activity');
    console.log('3. Use yearGroupsApi.upsert() to add the year group');
    console.log('4. Use lessonsApi.updateSheet() to save the lesson');
    
    return {
      category: {
        name: 'KS1 Maths',
        color: '#8B5CF6'
      },
      activities,
      yearGroup: {
        name: 'Example KS1 Maths',
        color: '#8B5CF6'
      },
      lesson: exampleLesson
    };
  } catch (error) {
    console.error('❌ Error creating KS1 Maths example:', error);
    throw error;
  }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createKS1MathsExample };
} else {
  // Make available in browser console
  window.createKS1MathsExample = createKS1MathsExample;
  console.log('✅ createKS1MathsExample() is now available. Call it to see the data structure.');
}

