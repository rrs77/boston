import { supabase, TABLES } from './supabase';
import type { 
  CustomObjectiveYearGroup, 
  CustomObjectiveArea, 
  CustomObjective, 
  ActivityCustomObjective,
  CustomObjectiveWithDetails,
  CustomObjectiveAreaWithObjectives,
  CustomObjectiveYearGroupWithAreas,
  CustomObjectiveFormData,
  CustomObjectiveCSVRow,
  CustomObjectivesResponse,
  ActivityWithCustomObjectives,
  CurriculumType,
  BulkObjectiveOperation
} from '../types/customObjectives';

// Custom Objectives API
export const customObjectivesApi = {
  // Year Groups Management
  yearGroups: {
    getAll: async (): Promise<CustomObjectiveYearGroup[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
          .select('*')
          .order('sort_order, name');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to get custom objective year groups:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<CustomObjectiveYearGroup | null> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn(`Failed to get custom objective year group ${id}:`, error);
        throw error;
      }
    },

    create: async (yearGroup: Omit<CustomObjectiveYearGroup, 'id' | 'created_at' | 'updated_at'>): Promise<CustomObjectiveYearGroup> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
          .insert(yearGroup)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Failed to create custom objective year group:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<CustomObjectiveYearGroup>): Promise<CustomObjectiveYearGroup> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn(`Failed to update custom objective year group ${id}:`, error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.warn(`Failed to delete custom objective year group ${id}:`, error);
        throw error;
      }
    }
  },

  // Areas Management
  areas: {
    getAll: async (): Promise<CustomObjectiveArea[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
          .select('*')
          .order('sort_order, name');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to get all custom objective areas:', error);
        throw error;
      }
    },

    getByYearGroup: async (yearGroupId: string): Promise<CustomObjectiveArea[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
          .select('*')
          .eq('year_group_id', yearGroupId)
          .order('sort_order, name');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn(`Failed to get areas for year group ${yearGroupId}:`, error);
        throw error;
      }
    },

    create: async (area: Omit<CustomObjectiveArea, 'id' | 'created_at' | 'updated_at'>): Promise<CustomObjectiveArea> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
          .insert(area)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Failed to create custom objective area:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<CustomObjectiveArea>): Promise<CustomObjectiveArea> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn(`Failed to update custom objective area ${id}:`, error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.warn(`Failed to delete custom objective area ${id}:`, error);
        throw error;
      }
    }
  },

  // Objectives Management
  objectives: {
    getAll: async (): Promise<CustomObjective[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVES)
          .select('*')
          .order('sort_order, objective_code');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to get all custom objectives:', error);
        throw error;
      }
    },

    getByArea: async (areaId: string): Promise<CustomObjective[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVES)
          .select('*')
          .eq('area_id', areaId)
          .order('sort_order, objective_code');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn(`Failed to get objectives for area ${areaId}:`, error);
        throw error;
      }
    },

    create: async (objective: Omit<CustomObjective, 'id' | 'created_at' | 'updated_at'>): Promise<CustomObjective> => {
      try {
        // Generate a simple code if not provided
        const objectiveWithCode = {
          ...objective,
          objective_code: objective.objective_code || `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
        };
        
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVES)
          .insert(objectiveWithCode)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Failed to create custom objective:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<CustomObjective>): Promise<CustomObjective> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVES)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn(`Failed to update custom objective ${id}:`, error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from(TABLES.CUSTOM_OBJECTIVES)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.warn(`Failed to delete custom objective ${id}:`, error);
        throw error;
      }
    }
  },

  // Complete Data Retrieval
  getCompleteStructure: async (): Promise<CustomObjectiveYearGroupWithAreas[]> => {
    try {
      // Get all year groups with their areas and objectives
      const { data, error } = await supabase
        .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
        .select(`
          *,
          areas:custom_objective_areas(
            *,
            objectives:custom_objectives(*)
          )
        `)
        .order('sort_order, name');
      
      if (error) throw error;
      
      // Transform the data to match our interface
      const transformed = (data || []).map(yearGroup => ({
        ...yearGroup,
        areas: yearGroup.areas.map((area: any) => ({
          ...area,
          objectives: area.objectives || []
        }))
      }));
      
      return transformed;
    } catch (error) {
      console.warn('Failed to get complete custom objectives structure:', error);
      throw error;
    }
  },

  getByYearGroup: async (yearGroupId: string): Promise<CustomObjectiveAreaWithObjectives[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
        .select(`
          *,
          objectives:custom_objectives(*)
        `)
        .eq('year_group_id', yearGroupId)
        .order('sort_order, name');
      
      if (error) throw error;
      
      return (data || []).map((area: any) => ({
        ...area,
        objectives: area.objectives || []
      }));
    } catch (error) {
      console.warn(`Failed to get custom objectives for year group ${yearGroupId}:`, error);
      throw error;
    }
  },

  // Activity Custom Objectives
  activityObjectives: {
    getByActivity: async (activityId: string): Promise<CustomObjectiveWithDetails[]> => {
      try {
        const { data, error } = await supabase
          .from(TABLES.ACTIVITY_CUSTOM_OBJECTIVES)
          .select(`
            *,
            objective:custom_objectives(
              *,
              area:custom_objective_areas(
                *,
                year_group:custom_objective_year_groups(*)
              )
            )
          `)
          .eq('activity_id', activityId);
        
        if (error) throw error;
        
        return (data || []).map((item: any) => ({
          ...item.objective,
          area: item.objective.area,
          year_group: item.objective.area.year_group
        }));
      } catch (error) {
        console.warn(`Failed to get custom objectives for activity ${activityId}:`, error);
        throw error;
      }
    },

    setForActivity: async (activityId: string, objectiveIds: string[]): Promise<void> => {
      try {
        // First, remove existing objectives for this activity
        const { error: deleteError } = await supabase
          .from(TABLES.ACTIVITY_CUSTOM_OBJECTIVES)
          .delete()
          .eq('activity_id', activityId);
        
        if (deleteError) throw deleteError;
        
        // Then, insert new objectives
        if (objectiveIds.length > 0) {
          const insertData = objectiveIds.map(objectiveId => ({
            activity_id: activityId,
            objective_id: objectiveId
          }));
          
          const { error: insertError } = await supabase
            .from(TABLES.ACTIVITY_CUSTOM_OBJECTIVES)
            .insert(insertData);
          
          if (insertError) throw insertError;
        }
      } catch (error) {
        console.warn(`Failed to set custom objectives for activity ${activityId}:`, error);
        throw error;
      }
    }
  },

  // Bulk Operations
  bulkOperations: {
    cloneYearGroup: async (sourceId: string, targetName: string, targetColor: string): Promise<CustomObjectiveYearGroup> => {
      try {
        // Get source year group with all its data
        const sourceData = await customObjectivesApi.getByYearGroup(sourceId);
        const sourceYearGroup = await customObjectivesApi.yearGroups.getById(sourceId);
        
        if (!sourceYearGroup) throw new Error('Source year group not found');
        
        // Create new year group
        const newYearGroup = await customObjectivesApi.yearGroups.create({
          name: targetName,
          description: sourceYearGroup.description,
          color: targetColor,
          sort_order: 999 // Will be reordered later
        });
        
        // Clone areas and objectives
        for (const area of sourceData) {
          const newArea = await customObjectivesApi.areas.create({
            year_group_id: newYearGroup.id,
            name: area.name,
            description: area.description,
            sort_order: area.sort_order
          });
          
          for (const objective of area.objectives) {
            await customObjectivesApi.objectives.create({
              area_id: newArea.id,
              objective_code: objective.objective_code,
              objective_text: objective.objective_text,
              description: objective.description,
              sort_order: objective.sort_order
            });
          }
        }
        
        return newYearGroup;
      } catch (error) {
        console.warn(`Failed to clone year group ${sourceId}:`, error);
        throw error;
      }
    },

    exportToCSV: async (yearGroupId?: string): Promise<CustomObjectiveCSVRow[]> => {
      try {
        let data: CustomObjectiveYearGroupWithAreas[];
        
        if (yearGroupId) {
          const yearGroup = await customObjectivesApi.yearGroups.getById(yearGroupId);
          if (!yearGroup) throw new Error('Year group not found');
          
          const areas = await customObjectivesApi.getByYearGroup(yearGroupId);
          data = [{ ...yearGroup, areas }];
        } else {
          data = await customObjectivesApi.getCompleteStructure();
        }
        
        const csvRows: CustomObjectiveCSVRow[] = [];
        
        for (const yearGroup of data) {
          for (const area of yearGroup.areas) {
            for (const objective of area.objectives) {
              csvRows.push({
                year_group: yearGroup.name,
                year_group_description: yearGroup.description,
                year_group_color: yearGroup.color,
                area: area.name,
                area_description: area.description,
                objective_code: objective.objective_code,
                objective_text: objective.objective_text,
                objective_description: objective.description
              });
            }
          }
        }
        
        return csvRows;
      } catch (error) {
        console.warn('Failed to export custom objectives to CSV:', error);
        throw error;
      }
    }
  }
};
