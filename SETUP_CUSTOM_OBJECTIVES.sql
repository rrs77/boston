-- =============================================================================
-- COMPLETE CUSTOM OBJECTIVES SETUP SQL
-- Run this entire file in Supabase SQL Editor
-- =============================================================================

-- STEP 1: Add section column to custom_objective_areas
ALTER TABLE custom_objective_areas
ADD COLUMN IF NOT EXISTS section TEXT;

COMMENT ON COLUMN custom_objective_areas.section IS 'Overall section heading that groups multiple areas together (e.g., "Communication and Language" groups "Listening" and "Speaking" areas)';

CREATE INDEX IF NOT EXISTS idx_custom_objective_areas_section 
ON custom_objective_areas (section);

-- STEP 2: Add is_locked column to custom_objective_year_groups
ALTER TABLE custom_objective_year_groups 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

COMMENT ON COLUMN custom_objective_year_groups.is_locked IS 'When true, this objective set can only be edited by administrators. Use for official curricula like EYFS.';

CREATE INDEX IF NOT EXISTS idx_custom_objective_year_groups_locked 
ON custom_objective_year_groups (is_locked);

-- STEP 3: Import Complete EYFS Early Learning Goals (51 objectives, 7 sections, 17 areas)

-- Create the main EYFS Year Group
INSERT INTO custom_objective_year_groups (
  id,
  name,
  description,
  color,
  sort_order,
  is_locked,
  created_at,
  updated_at
)
VALUES (
  'eyfs-early-learning-goals',
  'EYFS Early Learning Goals',
  'Official Early Years Foundation Stage Early Learning Goals - UK Government statutory framework',
  '#3B82F6',
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_locked = true,
  updated_at = NOW();

-- Create all Areas with Section field
-- Communication and Language
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-comm-lang-listening', 'eyfs-early-learning-goals', 'Communication and Language', 'Listening, Attention and Understanding', '', 1, NOW(), NOW()),
('eyfs-comm-lang-speaking', 'eyfs-early-learning-goals', 'Communication and Language', 'Speaking', '', 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Personal, Social and Emotional Development
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-psed-self-reg', 'eyfs-early-learning-goals', 'Personal, Social and Emotional Development', 'Self-Regulation', '', 3, NOW(), NOW()),
('eyfs-psed-managing-self', 'eyfs-early-learning-goals', 'Personal, Social and Emotional Development', 'Managing Self', '', 4, NOW(), NOW()),
('eyfs-psed-building-rel', 'eyfs-early-learning-goals', 'Personal, Social and Emotional Development', 'Building Relationships', '', 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Physical Development
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-phys-gross-motor', 'eyfs-early-learning-goals', 'Physical Development', 'Gross Motor Skills', '', 6, NOW(), NOW()),
('eyfs-phys-fine-motor', 'eyfs-early-learning-goals', 'Physical Development', 'Fine Motor Skills', '', 7, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Understanding the World
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-utw-past-present', 'eyfs-early-learning-goals', 'Understanding the World', 'Past and Present', '', 8, NOW(), NOW()),
('eyfs-utw-people-culture', 'eyfs-early-learning-goals', 'Understanding the World', 'People, Culture and Communities', '', 9, NOW(), NOW()),
('eyfs-utw-natural-world', 'eyfs-early-learning-goals', 'Understanding the World', 'The Natural World', '', 10, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Literacy
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-literacy-comprehension', 'eyfs-early-learning-goals', 'Literacy', 'Comprehension', '', 11, NOW(), NOW()),
('eyfs-literacy-word-reading', 'eyfs-early-learning-goals', 'Literacy', 'Word Reading', '', 12, NOW(), NOW()),
('eyfs-literacy-writing', 'eyfs-early-learning-goals', 'Literacy', 'Writing', '', 13, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Mathematics
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-maths-number', 'eyfs-early-learning-goals', 'Mathematics', 'Number', '', 14, NOW(), NOW()),
('eyfs-maths-numerical-patterns', 'eyfs-early-learning-goals', 'Mathematics', 'Numerical Patterns', '', 15, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Expressive Arts and Design
INSERT INTO custom_objective_areas (id, year_group_id, section, name, description, sort_order, created_at, updated_at) VALUES
('eyfs-ead-creating-materials', 'eyfs-early-learning-goals', 'Expressive Arts and Design', 'Creating with Materials', '', 16, NOW(), NOW()),
('eyfs-ead-being-imaginative', 'eyfs-early-learning-goals', 'Expressive Arts and Design', 'Being Imaginative and Expressive', '', 17, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, name = EXCLUDED.name, updated_at = NOW();

-- Insert all objectives (51 total)
-- Communication and Language - Listening, Attention and Understanding
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-cl-lau-1', 'eyfs-comm-lang-listening', '', 'Listen attentively and respond to what they hear with relevant questions, comments and actions when being read to and during whole class discussions and small group interactions.', '', 1, NOW(), NOW()),
('eyfs-cl-lau-2', 'eyfs-comm-lang-listening', '', 'Make comments about what they have heard and ask questions to clarify their understanding.', '', 2, NOW(), NOW()),
('eyfs-cl-lau-3', 'eyfs-comm-lang-listening', '', 'Hold conversation when engaged in back-and-forth exchanges with their teacher and peers.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Communication and Language - Speaking
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-cl-sp-1', 'eyfs-comm-lang-speaking', '', 'Participate in small group, class and one-to-one discussions, offering their own ideas, using recently introduced vocabulary.', '', 1, NOW(), NOW()),
('eyfs-cl-sp-2', 'eyfs-comm-lang-speaking', '', 'Offer explanations for why things might happen, making use of recently introduced vocabulary from stories, non-fiction, rhymes and poems when appropriate.', '', 2, NOW(), NOW()),
('eyfs-cl-sp-3', 'eyfs-comm-lang-speaking', '', 'Express their ideas and feelings about their experiences using full sentences, including use of past, present and future tenses and making use of conjunctions, with modelling and support from their teacher.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Personal, Social and Emotional Development - Self-Regulation
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-psed-sr-1', 'eyfs-psed-self-reg', '', 'Show an understanding of their own feelings and those of others, and begin to regulate their behaviour accordingly.', '', 1, NOW(), NOW()),
('eyfs-psed-sr-2', 'eyfs-psed-self-reg', '', 'Set and work towards simple goals, being able to wait for what they want and control their immediate impulses when appropriate.', '', 2, NOW(), NOW()),
('eyfs-psed-sr-3', 'eyfs-psed-self-reg', '', 'Give focused attention to what the teacher says, responding appropriately even when engaged in activity, and show an ability to follow instructions involving several ideas or actions.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Personal, Social and Emotional Development - Managing Self
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-psed-ms-1', 'eyfs-psed-managing-self', '', 'Be confident to try new activities and show independence, resilience and perseverance in the face of challenge.', '', 1, NOW(), NOW()),
('eyfs-psed-ms-2', 'eyfs-psed-managing-self', '', 'Explain the reasons for rules, know right from wrong and try to behave accordingly.', '', 2, NOW(), NOW()),
('eyfs-psed-ms-3', 'eyfs-psed-managing-self', '', 'Manage their own basic hygiene and personal needs, including dressing, going to the toilet and understanding the importance of healthy food choices.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Personal, Social and Emotional Development - Building Relationships
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-psed-br-1', 'eyfs-psed-building-rel', '', 'Work and play cooperatively and take turns with others.', '', 1, NOW(), NOW()),
('eyfs-psed-br-2', 'eyfs-psed-building-rel', '', 'Form positive attachments to adults and friendships with peers.', '', 2, NOW(), NOW()),
('eyfs-psed-br-3', 'eyfs-psed-building-rel', '', 'Show sensitivity to their own and others'' needs.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Physical Development - Gross Motor Skills
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-pd-gm-1', 'eyfs-phys-gross-motor', '', 'Negotiate space and obstacles safely, with consideration for themselves and others.', '', 1, NOW(), NOW()),
('eyfs-pd-gm-2', 'eyfs-phys-gross-motor', '', 'Demonstrate strength, balance and coordination when playing.', '', 2, NOW(), NOW()),
('eyfs-pd-gm-3', 'eyfs-phys-gross-motor', '', 'Move energetically, such as running, jumping, dancing, hopping, skipping and climbing.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Physical Development - Fine Motor Skills
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-pd-fm-1', 'eyfs-phys-fine-motor', '', 'Hold a pencil effectively in preparation for fluent writing – using the tripod grip in almost all cases.', '', 1, NOW(), NOW()),
('eyfs-pd-fm-2', 'eyfs-phys-fine-motor', '', 'Use a range of small tools, including scissors, paintbrushes and cutlery.', '', 2, NOW(), NOW()),
('eyfs-pd-fm-3', 'eyfs-phys-fine-motor', '', 'Begin to show accuracy and care when drawing.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Understanding the World - Past and Present
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-utw-pp-1', 'eyfs-utw-past-present', '', 'Talk about the lives of the people around them and their roles in society.', '', 1, NOW(), NOW()),
('eyfs-utw-pp-2', 'eyfs-utw-past-present', '', 'Know some similarities and differences between things in the past and now, drawing on their experiences and what has been read in class.', '', 2, NOW(), NOW()),
('eyfs-utw-pp-3', 'eyfs-utw-past-present', '', 'Understand the past through settings, characters and events encountered in books read in class and storytelling.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Understanding the World - People, Culture and Communities
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-utw-pcc-1', 'eyfs-utw-people-culture', '', 'Describe their immediate environment using knowledge from observation, discussion, stories, non-fiction texts and maps.', '', 1, NOW(), NOW()),
('eyfs-utw-pcc-2', 'eyfs-utw-people-culture', '', 'Know about similarities and differences between different religious and cultural communities in this country, drawing on their experiences and what has been read in class.', '', 2, NOW(), NOW()),
('eyfs-utw-pcc-3', 'eyfs-utw-people-culture', '', 'Explore some similarities and differences between life in this country and life in other countries, drawing on knowledge from stories, non-fiction texts and (when appropriate) maps.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Understanding the World - The Natural World
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-utw-nw-1', 'eyfs-utw-natural-world', '', 'Explore the natural world around them, making observations and drawing pictures of animals and plants.', '', 1, NOW(), NOW()),
('eyfs-utw-nw-2', 'eyfs-utw-natural-world', '', 'Know some similarities and differences between the natural world around them and contrasting environments, drawing on their experiences and what has been read in class.', '', 2, NOW(), NOW()),
('eyfs-utw-nw-3', 'eyfs-utw-natural-world', '', 'Understand some important processes and changes in the natural world around them, including the seasons and changing states of matter.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Literacy - Comprehension
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-lit-comp-1', 'eyfs-literacy-comprehension', '', 'Demonstrate understanding of what has been read to them by retelling stories and narratives using their own words and recently introduced vocabulary.', '', 1, NOW(), NOW()),
('eyfs-lit-comp-2', 'eyfs-literacy-comprehension', '', 'Anticipate (where appropriate) key events in stories.', '', 2, NOW(), NOW()),
('eyfs-lit-comp-3', 'eyfs-literacy-comprehension', '', 'Use and understand recently introduced vocabulary during discussions about stories, non-fiction, rhymes and during role-play.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Literacy - Word Reading
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-lit-wr-1', 'eyfs-literacy-word-reading', '', 'Say a sound for each letter in the alphabet and at least 10 digraphs.', '', 1, NOW(), NOW()),
('eyfs-lit-wr-2', 'eyfs-literacy-word-reading', '', 'Read words consistently with their phonic knowledge by sound-blending.', '', 2, NOW(), NOW()),
('eyfs-lit-wr-3', 'eyfs-literacy-word-reading', '', 'Read aloud simple sentences and books that are consistent with their phonic knowledge, including some common exception words.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Literacy - Writing
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-lit-writ-1', 'eyfs-literacy-writing', '', 'Write recognisable letters, most of which are correctly formed.', '', 1, NOW(), NOW()),
('eyfs-lit-writ-2', 'eyfs-literacy-writing', '', 'Spell words by identifying sounds in them and representing the sounds with a letter or letters.', '', 2, NOW(), NOW()),
('eyfs-lit-writ-3', 'eyfs-literacy-writing', '', 'Write simple phrases and sentences that can be read by others.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Mathematics - Number
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-math-num-1', 'eyfs-maths-number', '', 'Have a deep understanding of number to 10, including the composition of each number.', '', 1, NOW(), NOW()),
('eyfs-math-num-2', 'eyfs-maths-number', '', 'Subitise (recognise quantities without counting) up to 5.', '', 2, NOW(), NOW()),
('eyfs-math-num-3', 'eyfs-maths-number', '', 'Automatically recall (without reference to rhymes, counting or other aids) number bonds up to 5 (including subtraction facts) and some number bonds to 10, including double facts and how quantities can be distributed equally.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Mathematics - Numerical Patterns
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-math-np-1', 'eyfs-maths-numerical-patterns', '', 'Verbally count beyond 20, recognising the pattern of the counting system.', '', 1, NOW(), NOW()),
('eyfs-math-np-2', 'eyfs-maths-numerical-patterns', '', 'Compare quantities up to 10 in different contexts, recognising when one quantity is greater than, less than or the same as the other quantity.', '', 2, NOW(), NOW()),
('eyfs-math-np-3', 'eyfs-maths-numerical-patterns', '', 'Explore and represent patterns within numbers up to 10, including evens and odds, double facts and how quantities can be distributed equally.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Expressive Arts and Design - Creating with Materials
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-ead-cm-1', 'eyfs-ead-creating-materials', '', 'Safely use and explore a variety of materials, tools and techniques, experimenting with colour, design, texture, form and function.', '', 1, NOW(), NOW()),
('eyfs-ead-cm-2', 'eyfs-ead-creating-materials', '', 'Share their creations, explaining the processes they have used.', '', 2, NOW(), NOW()),
('eyfs-ead-cm-3', 'eyfs-ead-creating-materials', '', 'Make use of props and materials when role-playing characters in narratives and stories.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Expressive Arts and Design - Being Imaginative and Expressive
INSERT INTO custom_objectives (id, area_id, objective_code, objective_text, description, sort_order, created_at, updated_at) VALUES
('eyfs-ead-bie-1', 'eyfs-ead-being-imaginative', '', 'Invent, adapt and recount narratives and stories with peers and their teacher.', '', 1, NOW(), NOW()),
('eyfs-ead-bie-2', 'eyfs-ead-being-imaginative', '', 'Sing a range of well-known nursery rhymes and songs.', '', 2, NOW(), NOW()),
('eyfs-ead-bie-3', 'eyfs-ead-being-imaginative', '', 'Perform songs, rhymes, poems and stories with others, and (when appropriate) try to move in time with music.', '', 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Verification Query
SELECT 
  coyg.name as year_group,
  coyg.is_locked,
  COUNT(DISTINCT coa.id) as area_count,
  COUNT(co.id) as objective_count
FROM custom_objective_year_groups coyg
LEFT JOIN custom_objective_areas coa ON coa.year_group_id = coyg.id
LEFT JOIN custom_objectives co ON co.area_id = coa.id
WHERE coyg.id = 'eyfs-early-learning-goals'
GROUP BY coyg.id, coyg.name, coyg.is_locked;

