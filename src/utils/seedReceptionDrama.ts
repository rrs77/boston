import { customObjectivesApi } from '../config/customObjectivesApi';

// Reception Drama - Drama (Practitioner Example Statements)
export const seedReceptionDramaObjectives = async () => {
  console.log('🎭 Starting to seed Reception Drama objectives...');
  
  try {
    // Create the Year Group
    console.log('📝 Creating year group...');
    const yearGroup = await customObjectivesApi.yearGroups.create({
      name: 'Reception Drama',
      description: 'Drama (Practitioner Example Statements)',
      color: '#9333EA', // Purple color for drama
      sort_order: 10
    });
    
    if (!yearGroup || !yearGroup.id) {
      throw new Error('Failed to create year group - no ID returned');
    }
    console.log('✅ Created year group:', yearGroup.name, 'ID:', yearGroup.id);

    // Helper function to create area with objectives
    const createAreaWithObjectives = async (
      areaName: string,
      areaDescription: string,
      sortOrder: number,
      codePrefix: string,
      objectives: string[]
    ) => {
      console.log(`📝 Creating area: ${areaName}...`);
      const area = await customObjectivesApi.areas.create({
        year_group_id: yearGroup.id,
        name: areaName,
        description: areaDescription || null,
        sort_order: sortOrder
      });
      
      if (!area || !area.id) {
        throw new Error(`Failed to create area ${areaName} - no ID returned`);
      }
      console.log(`✅ Created area: ${area.name}, ID: ${area.id}`);

      for (let i = 0; i < objectives.length; i++) {
        console.log(`  📝 Adding objective ${i + 1}/${objectives.length}...`);
        await customObjectivesApi.objectives.create({
          area_id: area.id,
          objective_code: `${codePrefix}-${i + 1}`,
          objective_text: objectives[i],
          description: null,
          sort_order: i + 1
        });
      }
      console.log(`✅ Created ${objectives.length} objectives for ${area.name}`);
      return area;
    };

    // Area 1: Expressive Arts and Design – Being Imaginative and Expressive
    await createAreaWithObjectives(
      'Expressive Arts and Design – Being Imaginative and Expressive',
      'Drama-related objectives for creative expression',
      1,
      'RD-EAD',
      [
        'Plays alongside others, taking on simple roles in imaginative play.',
        'Uses movement, gesture and facial expression to explore characters.',
        'Acts out familiar stories using words, actions and props.',
        'Invents simple storylines and scenarios during role play.',
        'Joins in with songs, rhymes and repeated refrains in performance.',
        'Uses available resources to represent ideas, characters or settings.',
        'Begins to adapt ideas when playing with others.',
        'Shows enjoyment and confidence when performing to a small group.'
      ]
    );

    // Area 2: Communication and Language – Speaking
    await createAreaWithObjectives(
      'Communication and Language – Speaking',
      'Drama-related objectives for communication',
      2,
      'RD-CL',
      [
        'Uses talk to organise and develop role play ideas.',
        'Speaks in role, using different voices or language for characters.',
        'Shares ideas and listens to others when planning play or drama.',
        'Uses new vocabulary introduced through stories and drama activities.',
        'Communicates ideas clearly to peers and adults during play.'
      ]
    );

    // Area 3: Personal, Social and Emotional Development
    await createAreaWithObjectives(
      'Personal, Social and Emotional Development',
      'Drama-related objectives for social and emotional skills',
      3,
      'RD-PSED',
      [
        'Takes turns and shares space and resources during drama activities.',
        'Works collaboratively with others to develop a shared role-play scenario.',
        'Shows confidence to perform or speak in front of a familiar group.',
        'Manages feelings appropriately when negotiating roles or rules.',
        "Shows awareness of others' ideas and responds respectfully."
      ]
    );

    // Area 4: Literacy – Comprehension (Drama-Supported)
    await createAreaWithObjectives(
      'Literacy – Comprehension (Drama-Supported)',
      'Drama-supported literacy objectives',
      4,
      'RD-LIT',
      [
        'Retells familiar stories through role play and small-world play.',
        'Uses story language when acting out narratives.',
        'Sequences events in a story through actions and dialogue.',
        'Creates simple narratives based on known texts or experiences.'
      ]
    );

    console.log('🎉 Successfully seeded all Reception Drama objectives!');
    return { success: true, yearGroup };
  } catch (error) {
    console.error('❌ Failed to seed Reception Drama objectives:', error);
    throw error;
  }
};

// Export a function that can be called from the browser console
if (typeof window !== 'undefined') {
  (window as any).seedReceptionDrama = seedReceptionDramaObjectives;
}
