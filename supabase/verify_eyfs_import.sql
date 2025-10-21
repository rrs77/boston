-- Verification query to check EYFS import status

-- Check Year Group
SELECT 
  'Year Groups' as entity_type,
  id,
  name,
  is_locked,
  color
FROM custom_objective_year_groups
WHERE id = 'eyfs-early-learning-goals';

-- Check Areas
SELECT 
  'Areas' as entity_type,
  id,
  section,
  name,
  year_group_id
FROM custom_objective_areas
WHERE year_group_id = 'eyfs-early-learning-goals'
ORDER BY sort_order;

-- Check Objectives Count
SELECT 
  coa.section,
  coa.name as area_name,
  COUNT(co.id) as objective_count
FROM custom_objective_areas coa
LEFT JOIN custom_objectives co ON co.area_id = coa.id
WHERE coa.year_group_id = 'eyfs-early-learning-goals'
GROUP BY coa.section, coa.name, coa.sort_order
ORDER BY coa.sort_order;

-- Total Summary
SELECT 
  COUNT(DISTINCT coa.id) as total_areas,
  COUNT(co.id) as total_objectives
FROM custom_objective_areas coa
LEFT JOIN custom_objectives co ON co.area_id = coa.id
WHERE coa.year_group_id = 'eyfs-early-learning-goals';

