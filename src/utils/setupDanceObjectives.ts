/**
 * Utility function to create Dance curriculum objectives for Reception through Year 6
 * 
 * Usage in browser console:
 * 1. Open the app
 * 2. Open browser console (F12)
 * 3. Call: await setupDanceObjectives()
 */

import { customObjectivesApi } from '../config/customObjectivesApi';

interface DanceAreaData {
  section?: string;
  name: string;
  description?: string;
  objectives: Array<{
    code: string;
    text: string;
    description?: string;
  }>;
}

interface DanceYearGroupData {
  yearGroup: string;
  description: string;
  color: string;
  areas: DanceAreaData[];
}

// Dance curriculum structure for Reception through Year 6
const DANCE_CURRICULUM: Record<string, DanceYearGroupData> = {
  'Reception': {
    yearGroup: 'Reception Dance',
    description: 'Early Years Foundation Stage Dance curriculum objectives',
    color: '#EC4899',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Basic Movement',
        description: 'Fundamental movement skills and body awareness',
        objectives: [
          { code: 'R-D-M1', text: 'Move in response to music and rhythm', description: 'Respond to different tempos and styles of music' },
          { code: 'R-D-M2', text: 'Explore different ways of moving (walking, running, jumping, skipping)', description: 'Develop basic locomotor movements' },
          { code: 'R-D-M3', text: 'Use body parts to create simple movements', description: 'Awareness of different body parts and their movement potential' },
          { code: 'R-D-M4', text: 'Move in personal and shared space safely', description: 'Spatial awareness and safety in movement' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Using movement to express ideas and feelings',
        objectives: [
          { code: 'R-D-E1', text: 'Express feelings and ideas through movement', description: 'Use body language to communicate emotions' },
          { code: 'R-D-E2', text: 'Imitate movements and actions', description: 'Copy simple movements and gestures' },
          { code: 'R-D-E3', text: 'Respond to stories through movement', description: 'Act out simple stories and narratives' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Basic performance and presentation skills',
        objectives: [
          { code: 'R-D-P1', text: 'Perform simple movements to an audience', description: 'Confidence in sharing movement with others' },
          { code: 'R-D-P2', text: 'Watch and respond to others\' performances', description: 'Audience skills and appreciation' },
        ]
      }
    ]
  },
  'Year 1': {
    yearGroup: 'Year 1 Dance',
    description: 'Year 1 Dance curriculum objectives',
    color: '#F59E0B',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Basic Movement Skills',
        description: 'Developing fundamental movement vocabulary',
        objectives: [
          { code: 'Y1-D-M1', text: 'Perform basic locomotor movements (walk, run, jump, hop, skip, gallop)', description: 'Develop a range of travelling movements' },
          { code: 'Y1-D-M2', text: 'Perform basic non-locomotor movements (bend, stretch, twist, turn)', description: 'Develop stationary movement vocabulary' },
          { code: 'Y1-D-M3', text: 'Move at different speeds (fast, slow, medium)', description: 'Control tempo and dynamics' },
          { code: 'Y1-D-M4', text: 'Move at different levels (high, medium, low)', description: 'Use vertical space effectively' },
          { code: 'Y1-D-M5', text: 'Move in different directions (forwards, backwards, sideways)', description: 'Spatial awareness and directional control' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Using movement to express ideas',
        objectives: [
          { code: 'Y1-D-E1', text: 'Create movements to represent characters, animals, or objects', description: 'Use movement to tell stories' },
          { code: 'Y1-D-E2', text: 'Express different emotions through movement', description: 'Use body language to convey feelings' },
          { code: 'Y1-D-E3', text: 'Respond to music and rhythm with appropriate movements', description: 'Musicality and timing' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Basic performance skills',
        objectives: [
          { code: 'Y1-D-P1', text: 'Perform simple sequences of movements', description: 'Link movements together' },
          { code: 'Y1-D-P2', text: 'Perform with expression and confidence', description: 'Performance quality' },
          { code: 'Y1-D-P3', text: 'Watch and describe movements performed by others', description: 'Observation and evaluation skills' },
        ]
      }
    ]
  },
  'Year 2': {
    yearGroup: 'Year 2 Dance',
    description: 'Year 2 Dance curriculum objectives',
    color: '#EF4444',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Movement Skills',
        description: 'Expanding movement vocabulary',
        objectives: [
          { code: 'Y2-D-M1', text: 'Perform a wider range of locomotor and non-locomotor movements', description: 'Expanded movement vocabulary' },
          { code: 'Y2-D-M2', text: 'Combine movements to create simple sequences', description: 'Movement composition' },
          { code: 'Y2-D-M3', text: 'Control movements with increasing accuracy', description: 'Technical control' },
          { code: 'Y2-D-M4', text: 'Use different pathways (straight, curved, zigzag)', description: 'Spatial pathways' },
          { code: 'Y2-D-M5', text: 'Move in unison with others', description: 'Synchronization' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Developing expressive movement',
        objectives: [
          { code: 'Y2-D-E1', text: 'Create movements inspired by themes, stories, or music', description: 'Creative interpretation' },
          { code: 'Y2-D-E2', text: 'Use gesture and facial expression to enhance movement', description: 'Expressive detail' },
          { code: 'Y2-D-E3', text: 'Respond to different styles of music with appropriate movements', description: 'Musical interpretation' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Developing performance skills',
        objectives: [
          { code: 'Y2-D-P1', text: 'Perform sequences with clear beginning, middle, and end', description: 'Structure in performance' },
          { code: 'Y2-D-P2', text: 'Use space effectively in performance', description: 'Spatial awareness in performance' },
          { code: 'Y2-D-P3', text: 'Evaluate own and others\' performances', description: 'Critical thinking and reflection' },
        ]
      }
    ]
  },
  'Year 3': {
    yearGroup: 'Year 3 Dance',
    description: 'Year 3 Dance curriculum objectives',
    color: '#10B981',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Movement Skills',
        description: 'Refining movement technique',
        objectives: [
          { code: 'Y3-D-M1', text: 'Perform movements with improved control and coordination', description: 'Technical refinement' },
          { code: 'Y3-D-M2', text: 'Create and perform movement phrases', description: 'Movement composition' },
          { code: 'Y3-D-M3', text: 'Use transitions between movements smoothly', description: 'Flow and continuity' },
          { code: 'Y3-D-M4', text: 'Work with a partner to create complementary movements', description: 'Partner work' },
          { code: 'Y3-D-M5', text: 'Use canon and unison in group work', description: 'Group choreographic devices' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Developing artistic expression',
        objectives: [
          { code: 'Y3-D-E1', text: 'Create movements that communicate specific ideas or themes', description: 'Intentional communication' },
          { code: 'Y3-D-E2', text: 'Use dynamics (strong/gentle, quick/slow) to express meaning', description: 'Dynamic range' },
          { code: 'Y3-D-E3', text: 'Respond to different musical structures (verse, chorus, bridge)', description: 'Musical structure awareness' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Developing performance quality',
        objectives: [
          { code: 'Y3-D-P1', text: 'Perform with focus and concentration', description: 'Performance focus' },
          { code: 'Y3-D-P2', text: 'Use performance space effectively', description: 'Spatial performance skills' },
          { code: 'Y3-D-P3', text: 'Give and receive constructive feedback', description: 'Peer evaluation' },
        ]
      }
    ]
  },
  'Year 4': {
    yearGroup: 'Year 4 Dance',
    description: 'Year 4 Dance curriculum objectives',
    color: '#3B82F6',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Movement Skills',
        description: 'Advanced movement vocabulary',
        objectives: [
          { code: 'Y4-D-M1', text: 'Perform complex movement sequences with accuracy', description: 'Technical complexity' },
          { code: 'Y4-D-M2', text: 'Create movements using different body parts as initiators', description: 'Body part isolation' },
          { code: 'Y4-D-M3', text: 'Use weight transfer and balance in movement', description: 'Balance and weight' },
          { code: 'Y4-D-M4', text: 'Work in small groups to create synchronised movements', description: 'Group synchronisation' },
          { code: 'Y4-D-M5', text: 'Use repetition and contrast in movement sequences', description: 'Choreographic devices' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Sophisticated expression',
        objectives: [
          { code: 'Y4-D-E1', text: 'Create movements that tell a story or convey a message', description: 'Narrative dance' },
          { code: 'Y4-D-E2', text: 'Use movement to represent abstract concepts', description: 'Abstract expression' },
          { code: 'Y4-D-E3', text: 'Adapt movements to different musical styles and cultures', description: 'Cultural awareness' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Professional performance skills',
        objectives: [
          { code: 'Y4-D-P1', text: 'Perform with clear projection and presence', description: 'Stage presence' },
          { code: 'Y4-D-P2', text: 'Maintain character or theme throughout performance', description: 'Consistency' },
          { code: 'Y4-D-P3', text: 'Analyze and improve performances using specific criteria', description: 'Critical analysis' },
        ]
      }
    ]
  },
  'Year 5': {
    yearGroup: 'Year 5 Dance',
    description: 'Year 5 Dance curriculum objectives',
    color: '#8B5CF6',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Movement Skills',
        description: 'Mastery of movement technique',
        objectives: [
          { code: 'Y5-D-M1', text: 'Perform technically challenging movements with precision', description: 'Technical mastery' },
          { code: 'Y5-D-M2', text: 'Create complex movement phrases with clear structure', description: 'Advanced composition' },
          { code: 'Y5-D-M3', text: 'Use counterbalance and support in partner work', description: 'Advanced partner work' },
          { code: 'Y5-D-M4', text: 'Create group formations and patterns', description: 'Group choreography' },
          { code: 'Y5-D-M5', text: 'Use motif development and variation', description: 'Choreographic development' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Artistic interpretation',
        objectives: [
          { code: 'Y5-D-E1', text: 'Create original movements inspired by various stimuli', description: 'Creative originality' },
          { code: 'Y5-D-E2', text: 'Use movement to explore and express complex ideas', description: 'Conceptual expression' },
          { code: 'Y5-D-E3', text: 'Interpret and respond to professional dance works', description: 'Dance appreciation' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Professional performance',
        objectives: [
          { code: 'Y5-D-P1', text: 'Perform with confidence, expression, and technical accuracy', description: 'Performance excellence' },
          { code: 'Y5-D-P2', text: 'Adapt performance for different audiences and spaces', description: 'Performance adaptability' },
          { code: 'Y5-D-P3', text: 'Evaluate performances using dance terminology', description: 'Dance vocabulary' },
        ]
      }
    ]
  },
  'Year 6': {
    yearGroup: 'Year 6 Dance',
    description: 'Year 6 Dance curriculum objectives',
    color: '#6366F1',
    areas: [
      {
        section: 'Movement and Control',
        name: 'Movement Skills',
        description: 'Advanced technical skills',
        objectives: [
          { code: 'Y6-D-M1', text: 'Demonstrate mastery of a wide range of movement vocabulary', description: 'Comprehensive movement skills' },
          { code: 'Y6-D-M2', text: 'Create sophisticated movement sequences independently', description: 'Independent choreography' },
          { code: 'Y6-D-M3', text: 'Use complex choreographic devices (canon, accumulation, retrograde)', description: 'Advanced choreography' },
          { code: 'Y6-D-M4', text: 'Lead and follow in group choreography', description: 'Leadership skills' },
          { code: 'Y6-D-M5', text: 'Refine and improve movements through practice', description: 'Self-improvement' },
        ]
      },
      {
        section: 'Movement and Control',
        name: 'Expression and Communication',
        description: 'Mature artistic expression',
        objectives: [
          { code: 'Y6-D-E1', text: 'Create original choreography that communicates personal ideas', description: 'Personal voice' },
          { code: 'Y6-D-E2', text: 'Use movement to comment on social or cultural themes', description: 'Social awareness' },
          { code: 'Y6-D-E3', text: 'Appreciate and analyze different dance styles and traditions', description: 'Cultural appreciation' },
        ]
      },
      {
        section: 'Performance',
        name: 'Performance Skills',
        description: 'Professional performance standards',
        objectives: [
          { code: 'Y6-D-P1', text: 'Perform with professional-level commitment and artistry', description: 'Professional standards' },
          { code: 'Y6-D-P2', text: 'Collaborate effectively in group performances', description: 'Collaboration' },
          { code: 'Y6-D-P3', text: 'Critically evaluate and improve own and others\' work', description: 'Critical evaluation' },
        ]
      }
    ]
  }
};

/**
 * Create Dance curriculum objectives for Reception through Year 6
 */
export async function setupDanceObjectives() {
  console.log('🚀 Setting up Dance curriculum objectives for Reception through Year 6...\n');

  const yearGroups = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
  const results: Array<{ yearGroup: string; success: boolean; yearGroupId?: string; error?: string }> = [];

  for (const yearGroupName of yearGroups) {
    const curriculum = DANCE_CURRICULUM[yearGroupName];
    if (!curriculum) {
      console.error(`❌ No curriculum data found for ${yearGroupName}`);
      results.push({ yearGroup: yearGroupName, success: false, error: 'No curriculum data' });
      continue;
    }

    try {
      console.log(`\n📚 Processing ${curriculum.yearGroup}...`);

      // Check if year group already exists
      const existingYearGroups = await customObjectivesApi.yearGroups.getAll();
      let yearGroup = existingYearGroups.find(yg => yg.name === curriculum.yearGroup);

      if (!yearGroup) {
        // Create the year group
        console.log(`  📁 Creating year group: ${curriculum.yearGroup}...`);
        yearGroup = await customObjectivesApi.yearGroups.create({
          name: curriculum.yearGroup,
          description: curriculum.description,
          color: curriculum.color,
          sort_order: yearGroups.indexOf(yearGroupName)
        });
        console.log(`  ✅ Year group created`);
      } else {
        console.log(`  ℹ️ Year group already exists: ${curriculum.yearGroup}`);
      }

      // Get existing areas for this year group
      const existingAreas = await customObjectivesApi.areas.getByYearGroup(yearGroup.id);

      // Create or update areas and objectives
      for (const areaData of curriculum.areas) {
        let area = existingAreas.find(a => a.name === areaData.name && a.section === areaData.section);

        if (!area) {
          // Create new area
          console.log(`  📚 Creating area: ${areaData.name}...`);
          area = await customObjectivesApi.areas.create({
            year_group_id: yearGroup.id,
            section: areaData.section,
            name: areaData.name,
            description: areaData.description,
            sort_order: curriculum.areas.indexOf(areaData)
          });
          console.log(`  ✅ Area created: ${areaData.name}`);
        } else {
          console.log(`  ℹ️ Area already exists: ${areaData.name}`);
        }

        // Get existing objectives for this area
        const existingObjectives = await customObjectivesApi.objectives.getByArea(area.id);

        // Create objectives
        for (const objectiveData of areaData.objectives) {
          const existingObjective = existingObjectives.find(obj => obj.objective_code === objectiveData.code);

          if (!existingObjective) {
            console.log(`    ➕ Creating objective: ${objectiveData.code} - ${objectiveData.text.substring(0, 50)}...`);
            await customObjectivesApi.objectives.create({
              area_id: area.id,
              objective_code: objectiveData.code,
              objective_text: objectiveData.text,
              description: objectiveData.description,
              sort_order: areaData.objectives.indexOf(objectiveData)
            });
          } else {
            console.log(`    ℹ️ Objective already exists: ${objectiveData.code}`);
          }
        }
      }

      console.log(`  ✅ ${curriculum.yearGroup} completed successfully!`);
      results.push({ yearGroup: yearGroupName, success: true, yearGroupId: yearGroup.id });
    } catch (error: any) {
      console.error(`  ❌ Error processing ${curriculum.yearGroup}:`, error);
      results.push({ yearGroup: yearGroupName, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully created: ${successful.length} year groups`);
  successful.forEach(r => console.log(`   - ${r.yearGroup}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} year groups`);
    failed.forEach(r => console.log(`   - ${r.yearGroup}: ${r.error}`));
  }

  console.log('\n📝 Next steps:');
  console.log('1. Go to Settings → Custom Objectives');
  console.log('2. You should see Dance year groups: Reception Dance, Year 1 Dance, etc.');
  console.log('3. Select a year group to view areas and objectives');
  console.log('4. When creating activities, you can now link these Dance objectives');
  console.log('5. When building lessons, objectives will be tracked automatically');

  return { success: failed.length === 0, results };
}

// Make available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).setupDanceObjectives = setupDanceObjectives;
}

