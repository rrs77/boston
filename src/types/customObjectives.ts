// Types for Custom Objectives system

export interface CustomObjectiveYearGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_locked?: boolean;
  linked_year_groups?: string[]; // Links to activity year groups (e.g., ['LKG', 'UKG', 'Reception'])
  created_at: string;
  updated_at: string;
}

export interface CustomObjectiveArea {
  id: string;
  year_group_id: string;
  section?: string; // Overall section heading (e.g., "Communication and Language")
  name: string; // Subheading (e.g., "Listening, Attention and Understanding")
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomObjective {
  id: string;
  area_id: string;
  objective_code: string;
  objective_text: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityCustomObjective {
  id: string;
  activity_id: string;
  objective_id: string;
  created_at: string;
}

// Extended interfaces for display purposes
export interface CustomObjectiveWithDetails extends CustomObjective {
  area?: CustomObjectiveArea;
  year_group?: CustomObjectiveYearGroup;
}

export interface CustomObjectiveAreaWithObjectives extends CustomObjectiveArea {
  objectives: CustomObjective[];
  year_group?: CustomObjectiveYearGroup;
}

export interface CustomObjectiveYearGroupWithAreas extends CustomObjectiveYearGroup {
  areas: CustomObjectiveAreaWithObjectives[];
}

// Form data types for admin interface
export interface CustomObjectiveFormData {
  year_group: {
    name: string;
    description?: string;
    color: string;
    linked_year_groups?: string[]; // Links to activity year groups
  };
  areas: Array<{
    section?: string; // Overall section heading
    name: string; // Subheading
    description?: string;
    objectives: Array<{
      code: string;
      text: string;
      description?: string;
    }>;
  }>;
}

// CSV import/export types
export interface CustomObjectiveCSVRow {
  year_group: string;
  year_group_description?: string;
  year_group_color?: string;
  area: string;
  area_description?: string;
  objective_code: string;
  objective_text: string;
  objective_description?: string;
}

// API response types
export interface CustomObjectivesResponse {
  year_groups: CustomObjectiveYearGroup[];
  areas: CustomObjectiveArea[];
  objectives: CustomObjective[];
}

export interface ActivityWithCustomObjectives {
  id: string;
  curriculum_type: 'EYFS' | 'CUSTOM';
  custom_objectives?: CustomObjectiveWithDetails[];
}

// Curriculum type enum
export type CurriculumType = 'EYFS' | 'CUSTOM';

// Bulk operation types
export interface BulkObjectiveOperation {
  type: 'clone' | 'import' | 'export';
  source_year_group_id?: string;
  target_year_group_id?: string;
  data?: any;
}
