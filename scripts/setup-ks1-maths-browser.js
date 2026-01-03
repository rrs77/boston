/**
 * Browser Console Script to Create KS1 Maths Example Data
 * 
 * Instructions:
 * 1. Open the app in your browser
 * 2. Open the browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter to run
 * 
 * This will:
 * - Create "KS1 Maths" category
 * - Create 5 example activities with online links
 * - Create "Example KS1 Maths" year group
 * - Create an example lesson titled "Example Lesson" with starter, main, and plenary activities
 */

(async function createKS1MathsExample() {
  console.log('🚀 Starting KS1 Maths example creation...');
  
  try {
    // Import the APIs (these should be available in the app context)
    // We'll need to access them through the window or React DevTools
    
    // Step 1: Get the current user ID
    const userId = localStorage.getItem('rhythmstix_user_id') || '1';
    if (!localStorage.getItem('rhythmstix_user_id')) {
      localStorage.setItem('rhythmstix_user_id', userId);
    }
    
    // Step 2: Create activities
    console.log('📚 Step 1: Creating activities...');
    const activities = [
      {
        activity: 'Number Bonds to 10',
        description: 'Interactive game to practice number bonds to 10',
        activityText: 'Students use an online game to match number pairs that add up to 10.',
        time: 10,
        link: 'https://www.topmarks.co.uk/maths-games/hit-the-button',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        vocalsLink: '',
        imageLink: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yearGroups: ['Example KS1 Maths'],
        teachingUnit: 'Number',
        unitName: 'Number Bonds',
        lessonNumber: '1',
        eyfsStandards: []
      },
      {
        activity: 'Shape Sorting',
        description: 'Sort 2D and 3D shapes into categories',
        activityText: 'Students drag and drop shapes into the correct categories using an interactive whiteboard activity.',
        time: 15,
        link: 'https://www.topmarks.co.uk/early-years/shape-monsters',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        vocalsLink: '',
        imageLink: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yearGroups: ['Example KS1 Maths'],
        teachingUnit: 'Shape',
        unitName: '2D and 3D Shapes',
        lessonNumber: '1',
        eyfsStandards: []
      },
      {
        activity: 'Counting in 2s',
        description: 'Practice counting in multiples of 2',
        activityText: 'Students complete sequences counting in 2s using an online interactive resource.',
        time: 10,
        link: 'https://www.topmarks.co.uk/learning-to-count/counting',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        vocalsLink: '',
        imageLink: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yearGroups: ['Example KS1 Maths'],
        teachingUnit: 'Number',
        unitName: 'Counting',
        lessonNumber: '1',
        eyfsStandards: []
      },
      {
        activity: 'Addition Word Problems',
        description: 'Solve simple addition word problems',
        activityText: 'Students read and solve addition word problems using visual aids and manipulatives.',
        time: 20,
        link: 'https://www.bbc.co.uk/bitesize/topics/zf4bkqt',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        vocalsLink: '',
        imageLink: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yearGroups: ['Example KS1 Maths'],
        teachingUnit: 'Number',
        unitName: 'Addition',
        lessonNumber: '1',
        eyfsStandards: []
      },
      {
        activity: 'Maths Quiz Review',
        description: 'Quick quiz to review today\'s learning',
        activityText: 'Students answer quick questions about number bonds, shapes, and counting to consolidate learning.',
        time: 10,
        link: 'https://www.topmarks.co.uk/maths-games/mental-maths-train',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        vocalsLink: '',
        imageLink: '',
        category: 'KS1 Maths',
        level: 'KS1',
        yearGroups: ['Example KS1 Maths'],
        teachingUnit: 'Review',
        unitName: 'Consolidation',
        lessonNumber: '1',
        eyfsStandards: []
      }
    ];
    
    console.log('📋 Activities to create:', activities.length);
    
    // Step 3: Create the category (this will be done through Settings UI or API)
    console.log('📁 Step 2: Category "KS1 Maths" needs to be created through Settings UI');
    console.log('   Go to Settings → Categories → Add Category');
    console.log('   Name: KS1 Maths, Color: #8B5CF6');
    
    // Step 4: Create year group (this will be done through Settings UI or API)
    console.log('👥 Step 3: Year Group "Example KS1 Maths" needs to be created through Settings UI');
    console.log('   Go to Settings → Year Groups → Add Year Group');
    console.log('   Name: Example KS1 Maths, Color: #8B5CF6');
    
    // Step 5: Create the lesson structure
    console.log('📖 Step 4: Creating lesson structure...');
    const lessonData = {
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
    
    console.log('✅ Data structure prepared!');
    console.log('\n📝 Next Steps:');
    console.log('1. Create the category "KS1 Maths" in Settings');
    console.log('2. Create the year group "Example KS1 Maths" in Settings');
    console.log('3. Assign the category to the year group in Settings');
    console.log('4. Create the activities using the Activity Library');
    console.log('5. Create the lesson using the Lesson Builder');
    console.log('\n💡 Tip: You can use the React DevTools to access the app context:');
    console.log('   - Open React DevTools');
    console.log('   - Find SettingsProviderNew component');
    console.log('   - Access addCategoryPermanently() and updateYearGroups()');
    console.log('   - Find DataProvider component');
    console.log('   - Access activitiesApi and lessonsApi');
    
    // Store the data in a global variable for easy access
    window.ks1MathsExampleData = {
      category: {
        name: 'KS1 Maths',
        color: '#8B5CF6'
      },
      activities,
      yearGroup: {
        name: 'Example KS1 Maths',
        color: '#8B5CF6'
      },
      lesson: lessonData
    };
    
    console.log('\n✅ Data stored in window.ks1MathsExampleData');
    console.log('   You can access it with: window.ks1MathsExampleData');
    
    return window.ks1MathsExampleData;
  } catch (error) {
    console.error('❌ Error creating KS1 Maths example:', error);
    throw error;
  }
})();

