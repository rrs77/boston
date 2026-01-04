/**
 * Utility function to add all Lower Kindergarten Music activities to LKG, UKG, and Reception year groups
 * 
 * Run this in the browser console:
 * await addLKGActivitiesToAllYearGroups()
 */

import { supabase, TABLES } from '../config/supabase';
import { activitiesApi } from '../config/api';

export async function addLKGActivitiesToAllYearGroups() {
  try {
    console.log('🔍 Finding all activities for Lower Kindergarten Music...');
    
    // Step 1: Get year groups from Supabase to find exact names
    const { data: yearGroupsData, error: ygError } = await supabase
      .from(TABLES.YEAR_GROUPS)
      .select('*');
    
    if (ygError) {
      console.warn('⚠️ Could not load year groups, will use default names:', ygError);
    }
    
    // Find exact year group names
    let lkgName = 'Lower Kindergarten Music';
    let ukgName = 'Upper Kindergarten Music';
    let receptionName = 'Reception Music';
    
    if (yearGroupsData && yearGroupsData.length > 0) {
      const lkg = yearGroupsData.find(yg => 
        yg.name.toLowerCase().includes('lower kindergarten') || 
        yg.id.toLowerCase().includes('lkg')
      );
      const ukg = yearGroupsData.find(yg => 
        yg.name.toLowerCase().includes('upper kindergarten') || 
        yg.id.toLowerCase().includes('ukg')
      );
      const reception = yearGroupsData.find(yg => 
        yg.name.toLowerCase().includes('reception') && 
        !yg.name.toLowerCase().includes('lower') && 
        !yg.name.toLowerCase().includes('upper')
      );
      
      if (lkg) lkgName = lkg.name;
      if (ukg) ukgName = ukg.name;
      if (reception) receptionName = reception.name;
    }
    
    console.log(`📋 Using year group names:`);
    console.log(`   - LKG: "${lkgName}"`);
    console.log(`   - UKG: "${ukgName}"`);
    console.log(`   - Reception: "${receptionName}"`);
    
    // Step 2: Get all activities
    const { data: allActivities, error: activitiesError } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*');
    
    if (activitiesError) {
      console.error('❌ Error loading activities:', activitiesError);
      throw activitiesError;
    }
    
    if (!allActivities || allActivities.length === 0) {
      console.error('❌ No activities found in Supabase');
      return;
    }
    
    console.log(`📦 Found ${allActivities.length} total activities`);
    
    // Step 3: Filter activities that are for Lower Kindergarten Music
    // Check if activity has yearGroups that include LKG name or similar
    const lkgActivities = allActivities.filter(activity => {
      const yearGroups = activity.yeargroups || activity.year_groups || [];
      const level = activity.level || '';
      
      // Check if it's assigned to Lower Kindergarten Music
      const isLKG = Array.isArray(yearGroups) && (
        yearGroups.some((yg: string) => 
          yg.toLowerCase().includes('lower kindergarten') || 
          yg.toLowerCase().includes('lkg') ||
          yg === lkgName
        ) ||
        level.toLowerCase().includes('lower kindergarten') ||
        level.toLowerCase().includes('lkg')
      );
      
      return isLKG;
    });
    
    console.log(`✅ Found ${lkgActivities.length} activities for Lower Kindergarten Music`);
    
    if (lkgActivities.length === 0) {
      console.warn('⚠️ No activities found for Lower Kindergarten Music');
      return;
    }
    
    // Step 4: Update each activity to include LKG, UKG, and Reception in yearGroups
    const targetYearGroups = [lkgName, ukgName, receptionName];
    let updatedCount = 0;
    let errorCount = 0;
    
    console.log('\n🔄 Updating activities...');
    
    for (const activity of lkgActivities) {
      try {
        const currentYearGroups = activity.yeargroups || activity.year_groups || [];
        const currentYearGroupsArray = Array.isArray(currentYearGroups) 
          ? currentYearGroups 
          : (currentYearGroups ? [currentYearGroups] : []);
        
        // Add target year groups if not already present
        const updatedYearGroups = [...new Set([...currentYearGroupsArray, ...targetYearGroups])];
        
        // Only update if there are changes
        if (updatedYearGroups.length === currentYearGroupsArray.length && 
            targetYearGroups.every(yg => currentYearGroupsArray.includes(yg))) {
          console.log(`⏭️ Skipping "${activity.activity}" - already has all year groups`);
          continue;
        }
        
        // Convert to frontend format
        const activityForUpdate = {
          _id: activity.id,
          activity: activity.activity,
          description: activity.description,
          activityText: activity.activity_text,
          time: activity.time,
          videoLink: activity.video_link || '',
          musicLink: activity.music_link || '',
          backingLink: activity.backing_link || '',
          resourceLink: activity.resource_link || '',
          link: activity.link || '',
          vocalsLink: activity.vocals_link || '',
          imageLink: activity.image_link || '',
          canvaLink: activity.canva_link || '',
          teachingUnit: activity.teaching_unit || '',
          category: activity.category || '',
          level: activity.level || '',
          unitName: activity.unit_name || '',
          lessonNumber: activity.lesson_number || '',
          eyfsStandards: activity.eyfs_standards || [],
          yearGroups: updatedYearGroups
        };
        
        // Update via API
        await activitiesApi.update(activity.id, activityForUpdate);
        
        updatedCount++;
        console.log(`✅ Updated "${activity.activity}" - Added year groups: ${targetYearGroups.join(', ')}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to update "${activity.activity}":`, error);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} activities`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} activities`);
    }
    console.log(`📝 Total processed: ${lkgActivities.length} activities`);
    
    return {
      total: lkgActivities.length,
      updated: updatedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).addLKGActivitiesToAllYearGroups = addLKGActivitiesToAllYearGroups;
}

