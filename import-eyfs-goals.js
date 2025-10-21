import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const eyfsData = [
  {
    area: "Communication and Language",
    subarea: "Listening, Attention and Understanding",
    goals: [
      "Listen attentively and respond to what they hear with relevant questions, comments and actions when being read to and during whole class discussions and small group interactions.",
      "Make comments about what they have heard and ask questions to clarify their understanding.",
      "Hold conversation when engaged in back-and-forth exchanges with their teacher and peers."
    ]
  },
  {
    area: "Communication and Language",
    subarea: "Speaking",
    goals: [
      "Participate in small group, class and one-to-one discussions, offering their own ideas, using recently introduced vocabulary.",
      "Offer explanations for why things might happen, making use of recently introduced vocabulary from stories, non-fiction, rhymes and poems when appropriate.",
      "Express their ideas and feelings about their experiences using full sentences, including use of past, present and future tenses and making use of conjunctions, with modelling and support from their teacher."
    ]
  },
  {
    area: "Personal, Social and Emotional Development",
    subarea: "Self-Regulation",
    goals: [
      "Show an understanding of their own feelings and those of others, and begin to regulate their behaviour accordingly.",
      "Set and work towards simple goals, being able to wait for what they want and control their immediate impulses when appropriate.",
      "Give focused attention to what the teacher says, responding appropriately even when engaged in activity, and show an ability to follow instructions involving several ideas or actions."
    ]
  },
  {
    area: "Personal, Social and Emotional Development",
    subarea: "Managing Self",
    goals: [
      "Be confident to try new activities and show independence, resilience and perseverance in the face of challenge.",
      "Explain the reasons for rules, know right from wrong and try to behave accordingly.",
      "Manage their own basic hygiene and personal needs, including dressing, going to the toilet and understanding the importance of healthy food choices."
    ]
  },
  {
    area: "Personal, Social and Emotional Development",
    subarea: "Building Relationships",
    goals: [
      "Work and play cooperatively and take turns with others.",
      "Form positive attachments to adults and friendships with peers.",
      "Show sensitivity to their own and others' needs."
    ]
  },
  {
    area: "Physical Development",
    subarea: "Gross Motor Skills",
    goals: [
      "Negotiate space and obstacles safely, with consideration for themselves and others.",
      "Demonstrate strength, balance and coordination when playing.",
      "Move energetically, such as running, jumping, dancing, hopping, skipping and climbing."
    ]
  },
  {
    area: "Physical Development",
    subarea: "Fine Motor Skills",
    goals: [
      "Hold a pencil effectively in preparation for fluent writing – using the tripod grip in almost all cases.",
      "Use a range of small tools, including scissors, paintbrushes and cutlery.",
      "Begin to show accuracy and care when drawing."
    ]
  },
  {
    area: "Understanding the World",
    subarea: "Past and Present",
    goals: [
      "Talk about the lives of the people around them and their roles in society.",
      "Know some similarities and differences between things in the past and now, drawing on their experiences and what has been read in class.",
      "Understand the past through settings, characters and events encountered in books read in class and storytelling."
    ]
  },
  {
    area: "Understanding the World",
    subarea: "People, Culture and Communities",
    goals: [
      "Describe their immediate environment using knowledge from observation, discussion, stories, non-fiction texts and maps.",
      "Know about similarities and differences between different religious and cultural communities in this country, drawing on their experiences and what has been read in class.",
      "Explore some similarities and differences between life in this country and life in other countries, drawing on knowledge from stories, non-fiction texts and (when appropriate) maps."
    ]
  },
  {
    area: "Understanding the World",
    subarea: "The Natural World",
    goals: [
      "Explore the natural world around them, making observations and drawing pictures of animals and plants.",
      "Know some similarities and differences between the natural world around them and contrasting environments, drawing on their experiences and what has been read in class.",
      "Understand some important processes and changes in the natural world around them, including the seasons and changing states of matter."
    ]
  },
  {
    area: "Literacy",
    subarea: "Comprehension",
    goals: [
      "Demonstrate understanding of what has been read to them by retelling stories and narratives using their own words and recently introduced vocabulary.",
      "Anticipate (where appropriate) key events in stories.",
      "Use and understand recently introduced vocabulary during discussions about stories, non-fiction, rhymes and during role-play."
    ]
  },
  {
    area: "Literacy",
    subarea: "Word Reading",
    goals: [
      "Say a sound for each letter in the alphabet and at least 10 digraphs.",
      "Read words consistently with their phonic knowledge by sound-blending.",
      "Read aloud simple sentences and books that are consistent with their phonic knowledge, including some common exception words."
    ]
  },
  {
    area: "Literacy",
    subarea: "Writing",
    goals: [
      "Write recognisable letters, most of which are correctly formed.",
      "Spell words by identifying sounds in them and representing the sounds with a letter or letters.",
      "Write simple phrases and sentences that can be read by others."
    ]
  },
  {
    area: "Mathematics",
    subarea: "Number",
    goals: [
      "Have a deep understanding of number to 10, including the composition of each number.",
      "Subitise (recognise quantities without counting) up to 5.",
      "Automatically recall (without reference to rhymes, counting or other aids) number bonds up to 5 (including subtraction facts) and some number bonds to 10, including double facts and how quantities can be distributed equally."
    ]
  },
  {
    area: "Mathematics",
    subarea: "Numerical Patterns",
    goals: [
      "Verbally count beyond 20, recognising the pattern of the counting system.",
      "Compare quantities up to 10 in different contexts, recognising when one quantity is greater than, less than or the same as the other quantity.",
      "Explore and represent patterns within numbers up to 10, including evens and odds, double facts and how quantities can be distributed equally."
    ]
  },
  {
    area: "Expressive Arts and Design",
    subarea: "Creating with Materials",
    goals: [
      "Safely use and explore a variety of materials, tools and techniques, experimenting with colour, design, texture, form and function.",
      "Share their creations, explaining the processes they have used.",
      "Make use of props and materials when role-playing characters in narratives and stories."
    ]
  },
  {
    area: "Expressive Arts and Design",
    subarea: "Being Imaginative and Expressive",
    goals: [
      "Invent, adapt and recount narratives and stories with peers and their teacher.",
      "Sing a range of well-known nursery rhymes and songs.",
      "Perform songs, rhymes, poems and stories with others, and (when appropriate) try to move in time with music."
    ]
  }
];

async function importEYFSGoals() {
  console.log('Starting EYFS Goals import...\n');
  
  // Build the structured statements object and all statements array
  const structuredStatements = {};
  const allStatements = [];
  
  eyfsData.forEach(item => {
    if (!structuredStatements[item.area]) {
      structuredStatements[item.area] = {};
    }
    
    if (!structuredStatements[item.area][item.subarea]) {
      structuredStatements[item.area][item.subarea] = [];
    }
    
    item.goals.forEach(goal => {
      // Generate a unique ID for each goal
      const id = `EYFS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const statement = {
        id,
        area: item.area,
        aspect: item.subarea,
        text: goal,
        ageRange: 'Reception'
      };
      
      structuredStatements[item.area][item.subarea].push(statement);
      allStatements.push(statement);
      
      console.log(`✅ Added: ${item.area} - ${item.subarea}`);
      console.log(`   "${goal.substring(0, 60)}..."`);
    });
  });
  
  console.log(`\n📊 Total statements prepared: ${allStatements.length}`);
  console.log('\n🔄 Updating Supabase...');
  
  // Get current user for RLS
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Failed to get current user:', userError);
    console.log('ℹ️ Please ensure you are logged in to the application');
    return;
  }
  
  console.log(`\n👤 Importing as user: ${user.email || user.id}`);
  
  // Update the eyfs_statements table for each sheet
  const sheets = ['Lower Kindergarten Music', 'Upper Kindergarten Music', 'Reception Music'];
  
  for (const sheet of sheets) {
    console.log(`\n📚 Updating sheet: ${sheet}`);
    
    const { error } = await supabase
      .from('eyfs_statements')
      .upsert({
        sheet_name: sheet,
        all_statements: allStatements,
        structured_statements: structuredStatements,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'sheet_name' });
    
    if (error) {
      console.error(`❌ Failed to update ${sheet}:`, error);
    } else {
      console.log(`✅ Successfully updated ${sheet}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Import complete!`);
  console.log(`   📥 Inserted: ${allStatements.length} goals across ${sheets.length} sheets`);
  console.log('='.repeat(60));
}

importEYFSGoals().catch(console.error);
