import { supabase, TABLES } from './supabase';
import type { StackedLesson } from '../hooks/useLessonStacks';

export const lessonStacksApi = {
  // Get all lesson stacks
  getAll: async (): Promise<StackedLesson[]> => {
    try {
      console.log('🔍 Fetching lesson stacks from Supabase...');
      const { data, error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw error;
      }
      
      console.log('✅ Fetched lesson stacks:', data?.length || 0, 'stacks');
      
      // Convert snake_case to camelCase for frontend
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        color: item.color,
        lessons: item.lessons,
        totalTime: item.total_time,
        totalActivities: item.total_activities,
        customObjectives: item.custom_objectives || [],
        curriculumType: item.curriculum_type,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('❌ Failed to fetch lesson stacks:', error);
      return [];
    }
  },

  // Create a new lesson stack
  create: async (stackData: Omit<StackedLesson, 'id' | 'created_at'>): Promise<StackedLesson> => {
    try {
      // Convert camelCase to snake_case for database
      const dbStack = {
        id: `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: stackData.name,
        description: stackData.description,
        color: stackData.color,
        lessons: stackData.lessons,
        total_time: stackData.totalTime,
        total_activities: stackData.totalActivities,
        custom_objectives: stackData.customObjectives || [],
        curriculum_type: stackData.curriculumType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔍 Creating lesson stack:', dbStack);

      const { data, error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .insert(dbStack)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Lesson stack created successfully:', data);
      
      // Convert snake_case back to camelCase for frontend
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        lessons: data.lessons,
        totalTime: data.total_time,
        totalActivities: data.total_activities,
        customObjectives: data.custom_objectives || [],
        curriculumType: data.curriculum_type,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('❌ Failed to create lesson stack:', error);
      throw error;
    }
  },

  // Update a lesson stack
  update: async (id: string, updates: Partial<Omit<StackedLesson, 'id' | 'created_at'>>): Promise<StackedLesson> => {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.lessons !== undefined) dbUpdates.lessons = updates.lessons;
      if (updates.totalTime !== undefined) dbUpdates.total_time = updates.totalTime;
      if (updates.totalActivities !== undefined) dbUpdates.total_activities = updates.totalActivities;
      if (updates.customObjectives !== undefined) dbUpdates.custom_objectives = updates.customObjectives;
      if (updates.curriculumType !== undefined) dbUpdates.curriculum_type = updates.curriculumType;
      
      const { data, error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert snake_case back to camelCase for frontend
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        lessons: data.lessons,
        totalTime: data.total_time,
        totalActivities: data.total_activities,
        customObjectives: data.custom_objectives || [],
        curriculumType: data.curriculum_type,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Failed to update lesson stack:', error);
      throw error;
    }
  },

  // Delete a lesson stack
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete lesson stack:', error);
      throw error;
    }
  },

  // Get stacks by lesson number
  getByLesson: async (lessonNumber: string): Promise<StackedLesson[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .select('*')
        .contains('lessons', [lessonNumber])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch stacks by lesson:', error);
      return [];
    }
  }
};
