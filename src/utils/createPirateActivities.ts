// Utility function to create all 20 pirate activities
// This can be called from the browser console or imported into a component

import { activitiesApi } from '../config/api';
import type { Activity } from '../contexts/DataContext';

const pirateActivities: Omit<Activity, 'id' | '_id'>[] = [
  {
    activity: "Pirate Ship Steady Beat",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `We are pirates sailing across the sea. Our ship can only move if we work together and keep a steady beat.

Activity:
Children sit or stand in a circle pretending to row a pirate ship. The teacher establishes a steady beat by tapping knees or a drum. Children copy the beat using their bodies.
Introduce instruments (drums or rhythm sticks) and repeat the steady beat together.
Change the beat speed to reflect the sea:

slow beat = calm sea

fast beat = stormy sea

Extensions:
- Children take turns being the pirate captain who sets the beat.
- Use scarves to show the beat moving across the sea.
- Reception: maintain steady beat while teacher changes dynamics (loud/quiet).`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Walk the Plank – Fast & Slow",
    category: "Music & Movement",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates must listen carefully as they walk the plank so they don't fall into the sea.

Activity:
A line or rope is placed on the floor as the plank. Children take turns walking along it while the teacher plays music or taps a beat.

Slow music = slow careful steps

Fast music = quick pirate steps

Children freeze when the music stops.

Extensions:
- Add tiptoe walking for quiet music.
- Reception: change direction or add stop/start cues.
- Add scarves to show movement speed visually.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Movement",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "High Seas – High & Low Sounds",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `The sea is full of sounds. Some are high like seagulls, and some are low like ocean waves.

Activity:
Teacher sings or plays high and low sounds using voice or instruments.
Children respond with body movement:

high sounds = stretch tall / lift scarves high

low sounds = crouch low / move scarves close to the floor

Extensions:
- Children identify high or low using hand signs.
- Reception: children suggest sounds and movements.
- Use xylophone or glockenspiel for pitch contrast.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Cannonball Loud & Quiet",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirate ships make loud cannon sounds and quiet sneaky sounds.

Activity:
Children explore loud and quiet sounds using drums or body percussion.
Teacher calls:

"Cannonball!" → loud sound

"Sneaky pirates!" → quiet sound

Children listen carefully and adjust their volume.

Extensions:
- Use visual cues (big arms = loud, small arms = quiet).
- Reception: children lead volume changes.
- Combine loud/quiet with fast/slow.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Drum Echoes",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates send secret rhythm messages using drums.

Activity:
Teacher plays a short rhythm pattern on a drum. Children echo the pattern using body percussion or instruments.
Start with simple patterns and gradually increase length.

Extensions:
- Use pirate words to match rhythms.
- Children take turns being the rhythm leader.
- Reception: echo rhythms with contrasting dynamics.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Stormy Seas Movement",
    category: "Music & Movement",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `The sea can be calm or stormy on a pirate adventure.

Activity:
Children move freely with scarves to music that changes in tempo and volume.

Calm sea = slow, smooth movements

Stormy sea = fast, strong movements

Children listen closely to match movement to sound.

Extensions:
- Add freeze moments when the storm stops.
- Reception: children describe the music using musical language.
- Layer instruments to create the storm.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Movement",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Freeze Dance",
    category: "Music & Listening",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates must freeze when danger appears.

Activity:
Children dance like pirates to music. When the music stops, they freeze in a pirate pose.
Different pirate movements are encouraged (marching, sneaking, rowing).

Extensions:
- Freeze in high or low shapes.
- Reception: children control the music stops.
- Add loud/quiet contrast.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Listening",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Treasure Chest Beat",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates must unlock the treasure chest using rhythm.

Activity:
Children tap a steady beat on a box or drum pretending it is a treasure chest.
The teacher models patterns that children copy.

Extensions:
- Add simple rhythm patterns.
- Use instruments for different treasure sounds.
- Reception: create group rhythms together.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Seagulls & Sharks – Pitch Game",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates hear seagulls high in the sky and sharks low in the sea.

Activity:
High sounds represent seagulls; low sounds represent sharks.
Children move accordingly using arms or scarves.

Extensions:
- Children identify sounds before moving.
- Reception: children play the sounds.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate March",
    category: "Music & Movement",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates march proudly across the deck.

Activity:
Children march to a steady beat played on a drum. Tempo changes encourage listening and control.

Extensions:
- Add stop/start cues.
- Reception: children maintain beat independently.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Movement",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Sneaky Pirates – Quiet Sounds",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Sometimes pirates must move very quietly so they are not heard.

Activity:
Children explore making very quiet sounds using fingers, soft tapping, or gently shaking instruments.
Teacher models quiet movements and sounds.
Children listen carefully and match the volume.

Extensions:
- Contrast with loud pirate sounds.
- Use scarves for tiny, controlled movements.
- Reception: children decide whether sounds are too loud or just right.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Captain Says – Musical Commands",
    category: "Music & Listening",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `Pirates must listen carefully to the captain's instructions.

Activity:
Teacher gives musical commands:

"Captain says play loud"

"Captain says play quietly"

"Captain says play fast / slow"

Children respond only when "Captain says" is spoken.

Extensions:
- Children take turns being the captain.
- Combine pitch (high/low) with commands.
- Reception: use musical language verbally before playing.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Listening",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Row the Boat – Long & Short Sounds",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates use long and short movements as they row their boats.

Activity:
Teacher demonstrates long sounds (smooth arm movements) and short sounds (quick taps).
Children copy using voices, instruments, or scarves.

Extensions:
- Alternate long and short patterns.
- Children identify sound length before copying.
- Reception: children create their own patterns.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Sound Hunt",
    category: "Music & Listening",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `Pirates listen carefully to find hidden sounds.

Activity:
Teacher plays sounds behind a screen or out of sight using instruments.
Children listen and guess:

loud or quiet

high or low

Extensions:
- Children describe sounds using musical words.
- Reception: children hide and play the sounds.
- Add movement responses instead of verbal answers.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Listening",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Waves Up, Waves Down",
    category: "Music & Movement",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `The ocean waves move up and down around the pirate ship.

Activity:
Children use scarves to follow the shape of the music.
High sounds = scarves float high
Low sounds = scarves move low

Extensions:
- Combine pitch with slow/fast changes.
- Children draw wave shapes in the air.
- Reception: children lead wave movements.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Movement",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Instrument Parade",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `Pirates celebrate with a noisy parade on deck.

Activity:
Children march in a circle playing instruments to a steady beat.
Teacher controls:

start / stop

loud / quiet

Extensions:
- Change tempo while marching.
- Add high/low instruments.
- Reception: children keep beat without teacher support.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Hide the Treasure – Sound Direction",
    category: "Music & Listening",
    yearGroups: ["Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates follow sound clues to find treasure.

Activity:
One child hides the treasure.
Teacher or class plays instruments louder as the seeker gets closer, quieter when far away.

Extensions:
- Children identify changes in volume.
- Reception: children control the sound clues.
- Add high/low clues as well.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Listening",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Voice Explorers",
    category: "Music",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 10,
    unitName: "Pirates at Sea",
    description: `Pirates use their voices in many different ways.

Activity:
Children explore their voices:

high pirate voices

low pirate voices

loud shouts

quiet whispers

Teacher models and children echo.

Extensions:
- Match voice sounds to movements.
- Use scarves to show sound shape.
- Reception: children describe their voice choices.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Storm Build-Up",
    category: "Music",
    yearGroups: ["Upper Kindergarten Music", "Reception Music"],
    time: 12,
    unitName: "Pirates at Sea",
    description: `A storm slowly builds at sea and then fades away.

Activity:
Children create a storm using body percussion and instruments.
Sounds start quiet and slow, then gradually become louder and faster, before calming again.

Extensions:
- Add conductor-style gestures.
- Children identify the loudest part.
- Reception: children lead sections of the storm.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  },
  {
    activity: "Pirate Sound Story",
    category: "Music & Creative",
    yearGroups: ["Lower Kindergarten Music", "Upper Kindergarten Music", "Reception Music"],
    time: 15,
    unitName: "Pirates at Sea",
    description: `Pirates go on adventures filled with exciting sounds.

Activity:
Teacher tells a short pirate story.
Children add sounds using instruments, voices, and movements at key moments (waves, ship, treasure, storm).

Extensions:
- Children suggest sounds for parts of the story.
- Use scarves to support movement.
- Reception: children help create the story structure.`,
    activityText: "",
    videoLink: "",
    musicLink: "",
    backingLink: "",
    resourceLink: "",
    link: "",
    vocalsLink: "",
    imageLink: "",
    teachingUnit: "Music & Creative",
    level: "All",
    lessonNumber: "",
    eyfsStandards: []
  }
];

export async function createAllPirateActivities(): Promise<void> {
  console.log('🏴‍☠️ Starting to create', pirateActivities.length, 'pirate activities...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < pirateActivities.length; i++) {
    const activityData = pirateActivities[i];
    try {
      console.log(`📝 Creating activity ${i + 1}/${pirateActivities.length}: ${activityData.activity}`);
      
      const createdActivity = await activitiesApi.create(activityData as Activity);
      
      console.log(`✅ Successfully created: ${activityData.activity}`, createdActivity);
      successCount++;
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to create: ${activityData.activity}`, error);
      errorCount++;
    }
  }
  
  console.log(`\n🎉 Finished! Created ${successCount} activities, ${errorCount} errors.`);
}

export { pirateActivities };

