import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { activitiesApi, lessonsApi, eyfsApi } from '../config/api';
import { halfTermsApi } from '../config/api';
import { customObjectivesApi } from '../config/customObjectivesApi';
import { activityStacksApi } from '../config/activityStacksApi';
import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';

export interface Activity {
  id?: string;
  _id?: string;
  activity: string;
  description: string;
  activityText?: string; // New field for activity text
  htmlDescription?: string;
  time: number;
  videoLink: string;
  musicLink: string;
  backingLink: string;
  resourceLink: string;
  link: string;
  vocalsLink: string;
  imageLink: string;
  teachingUnit: string;
  category: string;
  level: string; // Keep for backward compatibility
  yearGroups?: string[]; // New field for multiple year groups
  unitName: string;
  lessonNumber: string;
  standards?: string[];
  eyfsStandards?: string[]; // Keep for backward compatibility
  customObjectives?: string[]; // New field for custom objectives
  curriculumType?: 'EYFS' | 'CUSTOM'; // New field to distinguish curriculum type
  _uniqueId?: string; // Added for drag and drop uniqueness
}

export interface ActivityStack {
  id: string;
  name: string;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
  category?: string; // Primary category for the stack
  totalTime: number; // Sum of all activity times
  description?: string; // Optional description for the stack
}

export interface LessonData {
  grouped: Record<string, Activity[]>;
  categoryOrder: string[];
  totalTime: number;
  lessonStandards?: string[];
  title?: string; // Added title field for lessons
  customObjectives?: string[];
  curriculumType?: 'EYFS' | 'CUSTOM';
  academicYear?: string; // Academic year this lesson belongs to
}

interface SheetInfo {
  sheet: string;
  display: string;
  eyfs: string;
}

export interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled' | 'draft';
  unitId?: string;
  unitName?: string;
  lessonNumber?: string;
  title?: string;
  term?: string;
  time?: string; // Added time field for scheduled lessons
  createdAt: Date;
  updatedAt: Date;
}

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HalfTerm {
  id: string;
  name: string;
  months: string;
  lessons: string[]; // Array of lesson numbers in display order
  stacks?: string[]; // Array of stack IDs assigned to this half-term
  isComplete: boolean;
}

// ADD: Subject and SubjectCategory interfaces
interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

interface SubjectCategory {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_locked: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

interface AcademicYearData {
  year: string; // e.g., "2024-2025"
  lessons: Record<string, LessonData>;
  halfTerms: HalfTerm[];
  units: Unit[];
  lessonStandards: Record<string, string[]>;
}

interface DataContextType {
  currentSheetInfo: SheetInfo;
  setCurrentSheetInfo: (info: SheetInfo) => void;
  lessonNumbers: string[];
  teachingUnits: string[];
  allLessonsData: Record<string, LessonData>;
  lessonStandards: Record<string, string[]>;
  nestedStandards: Record<string, Record<string, string[]>>;
  loading: boolean;
  refreshData: () => Promise<void>;
  uploadExcelFile: (file: File) => Promise<void>;
  addStandardToLesson: (lessonNumber: string, standard: string) => void;
  removeStandardFromLesson: (lessonNumber: string, standard: string) => void;
  addCustomObjectiveToLesson: (lessonNumber: string, objectiveId: string) => Promise<void>;
  removeCustomObjectiveFromLesson: (lessonNumber: string, objectiveId: string) => Promise<void>;
  
  // Standards editing functions
  addStandard: (area: string, subArea: string, standard: string) => Promise<void>;
  updateStandard: (area: string, subArea: string, oldStandard: string, newStandard: string) => Promise<void>;
  deleteStandard: (area: string, subArea: string, standard: string) => Promise<void>;
  addSubArea: (area: string, subArea: string) => Promise<void>;
  deleteSubArea: (area: string, subArea: string) => Promise<void>;
  addArea: (area: string) => Promise<void>;
  deleteArea: (area: string) => Promise<void>;
  resetStandardsToDefaults: () => Promise<void>;
  updateNestedStandards: (standards: Record<string, Record<string, string[]>>) => void;
  updateLessonTitle: (lessonNumber: string, title: string) => void;
  updateLessonNotes: (lessonNumber: string, notes: string) => Promise<void>;
  userCreatedLessonPlans: LessonPlan[]; // New property for user-created lesson plans
  addOrUpdateUserLessonPlan: (plan: LessonPlan) => void; // New function to add/update user lesson plans
  updateLessonData?: (lessonNumber: string, updatedData: any) => Promise<void>;
  deleteUserLessonPlan: (planId: string) => void; // New function to delete user lesson plans
  deleteLesson: (lessonNumber: string) => void; // New function to delete a lesson
  allActivities: Activity[]; // Centralized activities
  addActivity: (activity: Activity) => Promise<Activity>; // Add a new activity
  updateActivity: (activity: Activity) => Promise<Activity>; // Update an existing activity
  deleteActivity: (activityId: string) => Promise<void>; // Delete an activity
  units: Unit[]; // Units for the current class
  updateUnit: (unit: Unit) => void;
  // Academic Year Management
  currentAcademicYear: string;
  setCurrentAcademicYear: (year: string) => void;
  getAvailableYears: () => string[];
  getAcademicYearData: (year: string) => AcademicYearData | null;
  copyTermToYear: (sourceYear: string, sourceTerm: string, targetYear: string, targetTerm: string) => Promise<void>;
  deleteUnit: (unitId: string) => void; // Delete a unit
  halfTerms: HalfTerm[]; // Half-terms for the current class
  updateHalfTerm: (halfTermId: string, lessons: string[], isComplete: boolean, stacks?: string[]) => void; // Update a half-term
  getLessonsForHalfTerm: (halfTermId: string) => string[]; // ADDED: Get lessons for a half-term
  syncHalfTermsToSupabase: () => Promise<void>;
  loadHalfTermsFromSupabase: () => Promise<void>;
  
  // ADD: Subject Management properties and functions
  subjects: Subject[];
  subjectCategories: SubjectCategory[];
  currentSubject: Subject | null;
  subjectsLoading: boolean; // ADD: Separate loading state for subjects
  setCurrentSubject: (subject: Subject | null) => void;
  loadSubjects: () => Promise<void>;
  loadSubjectCategories: (subjectId: string) => Promise<void>;
  retryLoadSubjects: () => Promise<void>; // ADD: Retry function
  createSubject: (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => Promise<Subject>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<Subject>;
  deleteSubject: (id: string) => Promise<void>;
  createSubjectCategory: (category: Omit<SubjectCategory, 'id' | 'created_at' | 'updated_at'>) => Promise<SubjectCategory>;
  updateSubjectCategory: (id: string, category: Partial<SubjectCategory>) => Promise<SubjectCategory>;
  deleteSubjectCategory: (id: string) => Promise<void>;
  reorderSubjectCategories: (subjectId: string, categoryIds: string[]) => Promise<void>;
  toggleCategoryLock: (id: string) => Promise<void>;
  toggleCategoryVisibility: (id: string) => Promise<void>;
  debugSubjectSetup?: () => Promise<void>; // ADD: Debug function
  
  // Activity Stack Management
  activityStacks: ActivityStack[];
  createActivityStack: (name: string, activities: Activity[], description?: string) => ActivityStack;
  updateActivityStack: (stackId: string, updates: Partial<ActivityStack>) => void;
  deleteActivityStack: (stackId: string) => void;
  addActivitiesToStack: (stackId: string, activities: Activity[]) => void;
  removeActivityFromStack: (stackId: string, activityId: string) => void;
  unstackActivities: (stackId: string) => Activity[];
}

interface DataProviderProps {
  children: ReactNode;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

// Define the preferred category order
const CATEGORY_ORDER = [
  'Welcome',
  'Kodaly Songs',
  'Kodaly Action Songs',
  'Action/Games Songs',
  'Rhythm Sticks',
  'Scarf Songs',
  'General Game',
  'Core Songs',
  'Parachute Games',
  'Percussion Games',
  'Goodbye',
  'Teaching Units',
  'Kodaly Rhythms',
  'Kodaly Games',
  'IWB Games'
];

// Default nested standards structure for browsing
const DEFAULT_NESTED_STANDARDS = {
  "Communication and Language": {
    "Listening and Attention": [
      "Listens carefully to rhymes and songs",
      "Enjoys singing and making sounds",
      "Joins in with familiar songs and rhymes",
      "Understands and responds to simple questions or instructions",
      "Listens with increased attention to sounds",
      "Responds to what they hear with relevant actions",
      "Follows directions with two or more steps",
      "Understands simple concepts such as in, on, under"
    ],
    "Speaking": [
      "Uses talk to express ideas and feelings",
      "Begins to use longer sentences",
      "Retells events or experiences in sequence",
      "Uses new vocabulary in different contexts",
      "Talks about what they are doing or making"
    ]
  },
  "Personal, Social and Emotional Development": {
    "Self-Regulation": [
      "Shows confidence to try new activities",
      "Takes turns and shares with others",
      "Expresses own feelings and considers others'",
      "Shows resilience and perseverance"
    ],
    "Building Relationships": [
      "Plays cooperatively with other children",
      "Shows empathy and understanding",
      "Forms positive relationships with adults and peers"
    ]
  },
  "Physical Development": {
    "Gross Motor Skills": [
      "Moves energetically, e.g., running, jumping, dancing",
      "Uses large and small motor skills for coordinated movement",
      "Moves with control and coordination",
      "Shows strength, balance and coordination"
    ],
    "Fine Motor Skills": [
      "Uses tools and equipment with increasing control",
      "Shows developing hand-eye coordination",
      "Manipulates small objects with precision"
    ]
  },
  "Expressive Arts and Design": {
    "Creating with Materials": [
      "Creates collaboratively, sharing ideas and resources",
      "Explores the sounds of instruments",
      "Sings a range of well-known nursery rhymes and songs",
      "Performs songs, rhymes, poems and stories with others",
      "Responds imaginatively to music and dance",
      "Develops storylines in pretend play"
    ],
    "Being Imaginative": [
      "Uses imagination in role play",
      "Creates simple representations of events",
      "Expresses ideas through various media"
    ]
  },
  "Mathematics": {
    "Number": [
      "Counts reliably up to 10",
      "Recognizes numerals 1-10",
      "Compares quantities using language",
      "Solves simple addition and subtraction problems"
    ],
    "Shape, Space and Measures": [
      "Recognizes and names common 2D and 3D shapes",
      "Uses positional language",
      "Compares objects by size, weight, capacity"
    ]
  },
  "Understanding the World": {
    "People and Communities": [
      "Talks about past and present events in their own lives",
      "Knows about similarities and differences between themselves and others",
      "Recognizes that people have different beliefs and customs"
    ],
    "The Natural World": [
      "Shows care and concern for living things",
      "Talks about why things happen",
      "Develops understanding of growth and decay"
    ]
  }
};

// Default lesson titles based on categories
const generateDefaultLessonTitle = (lessonData: LessonData): string => {
  // Get the main categories in this lesson
  const categories = lessonData.categoryOrder;
  
  if (categories.length === 0) return "Untitled Lesson";
  
  // If it has Welcome and Goodbye, it's a standard lesson
  if (categories.includes('Welcome') && categories.includes('Goodbye')) {
    // Find the main content category (not Welcome or Goodbye)
    const mainCategories = categories.filter(cat => cat !== 'Welcome' && cat !== 'Goodbye');
    if (mainCategories.length > 0) {
      return `${mainCategories[0]} Lesson`;
    }
    return "Standard Lesson";
  }
  
  // If it has a specific focus
  if (categories.includes('Kodaly Songs')) return "Kodaly Lesson";
  if (categories.includes('Rhythm Sticks')) return "Rhythm Sticks Lesson";
  if (categories.includes('Percussion Games')) return "Percussion Lesson";
  if (categories.includes('Scarf Songs')) return "Movement with Scarves";
  if (categories.includes('Parachute Games')) return "Parachute Activities";
  if (categories.includes('Action/Games Songs')) return "Action Games Lesson";
  
  // Default to the first category
  return `${categories[0]} Lesson`;
};

// Define half-term periods
const DEFAULT_HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: [], stacks: [], isComplete: false },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: [], stacks: [], isComplete: false },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: [], stacks: [], isComplete: false },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', lessons: [], stacks: [], isComplete: false },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], stacks: [], isComplete: false },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], stacks: [], isComplete: false },
];

export function DataProvider({ children }: DataProviderProps) {
  const [currentSheetInfo, setCurrentSheetInfo] = useState<SheetInfo>({
    sheet: 'LKG',
    display: 'Lower Kindergarten Music',
    eyfs: 'LKG Statements'
  });
  
  const [lessonNumbers, setLessonNumbers] = useState<string[]>([]);
  const [teachingUnits, setTeachingUnits] = useState<string[]>([]);
  const [allLessonsData, setAllLessonsData] = useState<Record<string, LessonData>>({});
  const [lessonStandards, setLessonStandards] = useState<Record<string, string[]>>({});
  const [nestedStandards, setNestedStandards] = useState<Record<string, Record<string, string[]>>>(DEFAULT_NESTED_STANDARDS);
  const [loading, setLoading] = useState(true);
  const [userCreatedLessonPlans, setUserCreatedLessonPlans] = useState<LessonPlan[]>([]);
  // Flag to track if data was just cleared
  const [dataWasCleared, setDataWasCleared] = useState(false);
  // Centralized activities state
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  // Half-terms state - now year-keyed
  const [halfTermsByYear, setHalfTermsByYear] = useState<Record<string, HalfTerm[]>>({});
  const [halfTerms, setHalfTerms] = useState<HalfTerm[]>(DEFAULT_HALF_TERMS); // Keep for backward compatibility
  // Academic Year Management
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
  });
  const [academicYearData, setAcademicYearData] = useState<Record<string, AcademicYearData>>({});
  const [supabaseHalfTermsLoaded, setSupabaseHalfTermsLoaded] = useState(false);

  // ADD: Subject Management state variables
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategory[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false); // Separate loading state for subjects
  const [subjectsLoadAttempted, setSubjectsLoadAttempted] = useState(false); // Prevent multiple calls
  
  // Activity Stack Management state
  const [activityStacks, setActivityStacks] = useState<ActivityStack[]>([]);

  useEffect(() => {
    // Check if data was just cleared by looking for a URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cleared = urlParams.get('cleared');
    if (cleared === 'true') {
      console.log('🔍 Data cleared parameter detected, but allowing activities to load normally');
      // Don't set dataWasCleared to true for activities - they should always load
      // Remove the parameter from the URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    loadData();
    // Load EYFS statements
    loadStandards();
    // Load user-created lesson plans
    loadUserCreatedLessonPlans();
    // Load activities
    loadActivities();
    // Load units
    loadUnits();
    // Load half-terms
    loadHalfTerms();
    // ADD: Load subjects
    loadSubjects();
  }, [currentSheetInfo, currentAcademicYear]);

  // Load half-terms from Supabase when sheet or academic year changes
  useEffect(() => {
    if (currentSheetInfo.sheet && !supabaseHalfTermsLoaded) {
      loadHalfTermsFromSupabase();
    }
  }, [currentSheetInfo.sheet, currentAcademicYear, supabaseHalfTermsLoaded]);

  // Reset Supabase loading flag when academic year changes
  useEffect(() => {
    setSupabaseHalfTermsLoaded(false);
  }, [currentAcademicYear]);

  // Synchronize legacy halfTerms state with year-specific data when academic year changes
  useEffect(() => {
    if (halfTermsByYear[currentAcademicYear]) {
      console.log('🔄 DATACONTEXT - Syncing legacy halfTerms with year-specific data:', {
        currentAcademicYear,
        yearDataExists: !!halfTermsByYear[currentAcademicYear],
        yearDataLength: halfTermsByYear[currentAcademicYear]?.length || 0,
        yearData: halfTermsByYear[currentAcademicYear].map(ht => ({ 
          id: ht.id, 
          name: ht.name, 
          lessonsCount: ht.lessons?.length || 0,
          stacksCount: ht.stacks?.length || 0
        }))
      });
      setHalfTerms(halfTermsByYear[currentAcademicYear]);
    } else {
      console.log('⚠️ DATACONTEXT - No year-specific data found for:', {
        currentAcademicYear,
        availableYears: Object.keys(halfTermsByYear),
        halfTermsByYear
      });
      
      // CRITICAL FIX: If no year-specific data exists, initialize it with current halfTerms
      if (halfTerms.length > 0) {
        console.log('🔄 DATACONTEXT - Initializing year-specific data with current halfTerms');
        setHalfTermsByYear(prev => ({
          ...prev,
          [currentAcademicYear]: halfTerms
        }));
      }
    }
  }, [currentAcademicYear, halfTermsByYear, halfTerms]);

  // ADD: Debug function to help diagnose database issues
  const debugSubjectSetup = async () => {
    console.log('🔧 DEBUGGING SUBJECT SETUP...');
    
    // Check Supabase configuration
    const isConfigured = isSupabaseConfigured();
    console.log('📊 Supabase configured:', isConfigured);
    
    if (!isConfigured) {
      console.log('❌ Supabase is not configured. Check your environment variables.');
      return;
    }
    
    try {
      // Test basic connection with existing table first
      console.log('🔗 Testing Supabase connection with existing tables...');
      const { data: testData, error: testError } = await supabase
        .from('lessons') // Try an existing table first
        .select('count(*)', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ Basic connection test failed:', testError);
      } else {
        console.log('✅ Basic Supabase connection works!');
      }
      
      // Now test subjects table specifically
      console.log('🔗 Testing subjects table...');
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('count(*)', { count: 'exact', head: true });
      
      if (subjectError) {
        console.error('❌ Subjects table test failed:', subjectError);
        
        // Check if table exists
        if (subjectError.message.includes('relation "subjects" does not exist') || 
            subjectError.code === 'PGRST116') {
          console.error('💥 SUBJECTS TABLE DOES NOT EXIST!');
          console.log('📝 You need to create the subjects tables in Supabase.');
          console.log('🚀 Go to your Supabase Dashboard → SQL Editor and run this:');
          console.log(`
-- Create subjects table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create subject_categories table
CREATE TABLE subject_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert sample subjects
INSERT INTO subjects (name, description, color) VALUES 
  ('Music', 'Music education activities and lessons', '#3b82f6'),
  ('Drama', 'Drama and performance activities', '#ef4444'),
  ('EYFS', 'Early Years Foundation Stage activities', '#10b981');

-- Insert sample categories for Music
INSERT INTO subject_categories (subject_id, name, description, color, sort_order) 
SELECT id, 'Welcome Songs', 'Opening circle time songs', '#3b82f6', 0 FROM subjects WHERE name = 'Music'
UNION ALL
SELECT id, 'Action Songs', 'Movement and action-based songs', '#3b82f6', 1 FROM subjects WHERE name = 'Music'
UNION ALL
SELECT id, 'Rhythm Activities', 'Rhythm and beat exercises', '#3b82f6', 2 FROM subjects WHERE name = 'Music'
UNION ALL
SELECT id, 'Goodbye Songs', 'Closing circle time songs', '#3b82f6', 3 FROM subjects WHERE name = 'Music';
          `);
        }
      }
      
      console.log('✅ Subjects table exists and is accessible!');
      
      // Check existing data
      const { data: subjects, error: dataError } = await supabase
        .from('subjects')
        .select('*');
        
      if (dataError) {
        console.error('❌ Error fetching subjects:', dataError);
      }
      
      console.log('📊 Found subjects:', subjects?.length || 0);
      console.log('📋 Subjects data:', subjects);
      
    } catch (error) {
      console.error('💥 Debug failed:', error);
    }
  };

  // ADD: Subject Management functions
  const loadSubjects = async (): Promise<void> => {
    // Prevent multiple simultaneous calls
    if (subjectsLoading) {
      console.log('⏸️ Subjects already loading, skipping...');
      return;
    }

    try {
      console.log('🔄 Loading subjects...');
      setSubjectsLoading(true);
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase is not configured. Using mock data.');
        setSubjects([
          { id: 'mock-1', name: 'Music', description: 'Music education activities and lessons', color: '#3b82f6', is_active: true },
          { id: 'mock-2', name: 'Drama', description: 'Drama and performance activities', color: '#ef4444', is_active: true },
          { id: 'mock-3', name: 'EYFS', description: 'Early Years Foundation Stage activities', color: '#10b981', is_active: true }
        ]);
        return;
      }
      
      console.log('📡 Querying subjects from Supabase...');
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('❌ Failed to load subjects from Supabase:', error);
        
        // Check if it's a "table doesn't exist" error
        if (error.message.includes('relation "subjects" does not exist') || error.code === 'PGRST116') {
          console.error('💥 SUBJECTS TABLE MISSING!');
          setSubjects([
            { id: 'no-table-1', name: 'Music', description: 'Create database tables to enable full functionality', color: '#3b82f6', is_active: true },
            { id: 'no-table-2', name: 'Drama', description: 'Create database tables to enable full functionality', color: '#ef4444', is_active: true },
            { id: 'no-table-3', name: 'EYFS', description: 'Create database tables to enable full functionality', color: '#10b981', is_active: true }
          ]);
          return;
        }
        
        // Use mock data as fallback for any other error
        setSubjects([
          { id: 'fallback-1', name: 'Music', description: 'Music education activities and lessons', color: '#3b82f6', is_active: true },
          { id: 'fallback-2', name: 'Drama', description: 'Drama and performance activities', color: '#ef4444', is_active: true },
          { id: 'fallback-3', name: 'EYFS', description: 'Early Years Foundation Stage activities', color: '#10b981', is_active: true }
        ]);
        return;
      }
      
console.log('✅ Successfully loaded subjects:', data?.length || 0, 'subjects');
setSubjects(data || []);
setSubjectsLoading(false); // ADD THIS LINE
console.log('🏁 Set subjectsLoading to FALSE'); // ADD THIS DEBUG LINE      
    } catch (error) {
      console.error('💥 Exception while loading subjects:', error);
      
      // Use mock data as final fallback
      setSubjects([
        { id: 'error-fallback-1', name: 'Music', description: 'Music education activities (offline mode)', color: '#3b82f6', is_active: true },
        { id: 'error-fallback-2', name: 'Drama', description: 'Drama and performance activities (offline mode)', color: '#ef4444', is_active: true },
        { id: 'error-fallback-3', name: 'EYFS', description: 'Early Years Foundation Stage activities (offline mode)', color: '#10b981', is_active: true }
      ]);
    } finally {
      setSubjectsLoading(false);
      setSubjectsLoadAttempted(true); // Set this at the very end
    }
  };

  const loadSubjectCategories = async (subjectId: string): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('subject_categories')
          .select('*')
          .eq('subject_id', subjectId)
          .order('sort_order');
        
        if (error) {
          console.error('Failed to load subject categories from Supabase:', error);
          return;
        }
        
        setSubjectCategories(data || []);
      }
    } catch (error) {
      console.error('Failed to load subject categories:', error);
    }
  };

  const createSubject = async (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subjects')
        .insert([subject])
        .select()
        .single();

      if (error) {
        console.error('Failed to create subject:', error);
        throw error;
      }

      const newSubject = data as Subject;
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (error) {
      console.error('Failed to create subject:', error);
      throw error;
    }
  };

  const updateSubject = async (id: string, subject: Partial<Subject>): Promise<Subject> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subjects')
        .update(subject)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update subject:', error);
        throw error;
      }

      const updatedSubject = data as Subject;
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
      return updatedSubject;
    } catch (error) {
      console.error('Failed to update subject:', error);
      throw error;
    }
  };

  const deleteSubject = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Failed to delete subject:', error);
        throw error;
      }

      setSubjects(prev => prev.filter(s => s.id !== id));
      
      // Clear current subject if it was deleted
      if (currentSubject?.id === id) {
        setCurrentSubject(null);
        setSubjectCategories([]);
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
      throw error;
    }
  };

  const createSubjectCategory = async (category: Omit<SubjectCategory, 'id' | 'created_at' | 'updated_at'>): Promise<SubjectCategory> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subject_categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Failed to create subject category:', error);
        throw error;
      }

      const newCategory = data as SubjectCategory;
      setSubjectCategories(prev => [...prev, newCategory].sort((a, b) => a.sort_order - b.sort_order));
      return newCategory;
    } catch (error) {
      console.error('Failed to create subject category:', error);
      throw error;
    }
  };

  const updateSubjectCategory = async (id: string, category: Partial<SubjectCategory>): Promise<SubjectCategory> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subject_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update subject category:', error);
        throw error;
      }

      const updatedCategory = data as SubjectCategory;
      setSubjectCategories(prev => prev.map(c => c.id === id ? updatedCategory : c).sort((a, b) => a.sort_order - b.sort_order));
      return updatedCategory;
    } catch (error) {
      console.error('Failed to update subject category:', error);
      throw error;
    }
  };

  const deleteSubjectCategory = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase
        .from('subject_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete subject category:', error);
        throw error;
      }

      setSubjectCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete subject category:', error);
      throw error;
    }
  };

  const reorderSubjectCategories = async (subjectId: string, categoryIds: string[]): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      // Update sort_order for each category
      const updates = categoryIds.map((categoryId, index) => ({
        id: categoryId,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('subject_categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error('Failed to reorder subject category:', error);
          throw error;
        }
      }

      // Reload categories to reflect new order
      await loadSubjectCategories(subjectId);
    } catch (error) {
      console.error('Failed to reorder subject categories:', error);
      throw error;
    }
  };

  const toggleCategoryLock = async (id: string): Promise<void> => {
    try {
      const category = subjectCategories.find(c => c.id === id);
      if (!category) return;

      await updateSubjectCategory(id, { is_locked: !category.is_locked });
    } catch (error) {
      console.error('Failed to toggle category lock:', error);
      throw error;
    }
  };

  const toggleCategoryVisibility = async (id: string): Promise<void> => {
    try {
      const category = subjectCategories.find(c => c.id === id);
      if (!category) return;

      await updateSubjectCategory(id, { is_active: !category.is_active });
    } catch (error) {
      console.error('Failed to toggle category visibility:', error);
      throw error;
    }
  };

  // ADD: Retry function for subjects
  const retryLoadSubjects = async () => {
    console.log('🔄 Retrying subjects load...');
    setSubjectsLoadAttempted(false);
    setSubjectsLoading(false); // Reset loading state
    await loadSubjects();
  };

  const handleSetCurrentSubject = (subject: Subject | null) => {
    setCurrentSubject(subject);
    if (subject) {
      loadSubjectCategories(subject.id);
    } else {
      setSubjectCategories([]);
    }
  };

  // Load units for the current class
  const loadUnits = () => {
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setUnits([]);
        return;
      }
      
      // Load from localStorage
      const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
      if (savedUnits) {
        try {
          const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
            ...unit,
            createdAt: new Date(unit.createdAt),
            updatedAt: new Date(unit.updatedAt),
          }));
          setUnits(parsedUnits);
        } catch (error) {
          console.error('Error parsing saved units:', error);
          setUnits([]);
        }
      } else {
        // Initialize with an empty array
        setUnits([]);
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    }
  };

  // Update a unit
  const updateUnit = (unit: Unit) => {
    setUnits(prev => {
      const index = prev.findIndex(u => u.id === unit.id);
      if (index !== -1) {
        // Update existing unit
        const updatedUnits = [...prev];
        updatedUnits[index] = {
          ...unit,
          updatedAt: new Date()
        };
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
        return updatedUnits;
      } else {
        // Add new unit
        const newUnits = [...prev, {
          ...unit,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(newUnits));
        return newUnits;
      }
    });
  };

  // Delete a unit
  const deleteUnit = (unitId: string) => {
    setUnits(prev => {
      const updatedUnits = prev.filter(u => u.id !== unitId);
      localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
      return updatedUnits;
    });
  };

  // Load half-terms for the current class and academic year
  const loadHalfTerms = () => {
    console.log('🔍 loadHalfTerms called', { currentSheetInfo, currentAcademicYear, dataWasCleared });
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        console.log('🔍 Data was cleared, setting default half-terms');
        setHalfTerms(DEFAULT_HALF_TERMS);
        // Also update the year-specific state with defaults
        setHalfTermsByYear(prev => ({
          ...prev,
          [currentAcademicYear]: DEFAULT_HALF_TERMS
        }));
        return;
      }
      
      // Load from localStorage with academic year in the key
      const localStorageKey = `half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`;
      const savedHalfTerms = localStorage.getItem(localStorageKey);
      console.log('🔍 localStorage half-terms:', { 
        savedHalfTerms, 
        sheet: currentSheetInfo.sheet, 
        academicYear: currentAcademicYear,
        localStorageKey 
      });
      console.log('🔍 DEFAULT_HALF_TERMS:', DEFAULT_HALF_TERMS);
      if (savedHalfTerms) {
        try {
          const parsedHalfTerms = JSON.parse(savedHalfTerms);
          console.log('🔍 Parsed half-terms from localStorage:', parsedHalfTerms);
          
          // Ensure all half-terms have the stacks field
          const formattedHalfTerms = parsedHalfTerms.map((term: any) => ({
            ...term,
            stacks: term.stacks || [] // Ensure stacks field exists
          }));
          
          console.log('🔍 Setting half-terms state with data:', formattedHalfTerms.map(ht => ({ id: ht.id, name: ht.name, lessonsCount: ht.lessons?.length || 0, stacksCount: ht.stacks?.length || 0 })));
          setHalfTerms(formattedHalfTerms);
          // Also update the year-specific state
          setHalfTermsByYear(prev => ({
            ...prev,
            [currentAcademicYear]: formattedHalfTerms
          }));
        } catch (error) {
          console.error('Error parsing saved half-terms:', error);
          setHalfTerms(DEFAULT_HALF_TERMS);
          // Also update the year-specific state with defaults
          setHalfTermsByYear(prev => ({
            ...prev,
            [currentAcademicYear]: DEFAULT_HALF_TERMS
          }));
        }
      } else {
        // Initialize with default half-terms
        console.log('🔍 No saved half-terms for this academic year, initializing with defaults');
        setHalfTerms(DEFAULT_HALF_TERMS);
        // Also update the year-specific state with defaults
        setHalfTermsByYear(prev => ({
          ...prev,
          [currentAcademicYear]: DEFAULT_HALF_TERMS
        }));
        localStorage.setItem(localStorageKey, JSON.stringify(DEFAULT_HALF_TERMS));
      }
    } catch (error) {
      console.error('Failed to load half-terms:', error);
      setHalfTerms(DEFAULT_HALF_TERMS);
      // Also update the year-specific state with defaults
      setHalfTermsByYear(prev => ({
        ...prev,
        [currentAcademicYear]: DEFAULT_HALF_TERMS
      }));
    }
  };

  // Load half-terms from Supabase
  const loadHalfTermsFromSupabase = async () => {
    try {
      console.log('Loading half-terms from Supabase for sheet:', currentSheetInfo.sheet, 'academic year:', currentAcademicYear);
      const supabaseHalfTerms = await halfTermsApi.getBySheet(currentSheetInfo.sheet, currentAcademicYear);
      
      if (supabaseHalfTerms && supabaseHalfTerms.length > 0) {
        console.log('Loaded half-terms from Supabase:', supabaseHalfTerms);
        // Ensure all required fields are present
        const formattedHalfTerms = supabaseHalfTerms.map(term => ({
          id: term.id,
          name: term.name,
          months: (term as any).months || 'Unknown',
          lessons: term.lessons || [],
          stacks: term.stacks || [], // CRITICAL: Add missing stacks field
          isComplete: term.isComplete || false
        }));
        setHalfTerms(formattedHalfTerms);
        // Also update the year-specific state
        setHalfTermsByYear(prev => ({
          ...prev,
          [currentAcademicYear]: formattedHalfTerms
        }));
        
        // Also save to localStorage for offline access with academic year in key
        localStorage.setItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`, JSON.stringify(formattedHalfTerms));
      } else {
        // If no data in Supabase, initialize default half-terms
        console.log('No half-terms in Supabase, initializing default half-terms...');
        await halfTermsApi.initializeHalfTerms(currentSheetInfo.sheet, currentAcademicYear);
        
        // Then load from localStorage and sync to Supabase
        loadHalfTerms();
        await syncHalfTermsToSupabase();
      }
      
      setSupabaseHalfTermsLoaded(true);
    } catch (error) {
      console.warn('Failed to load half-terms from Supabase, falling back to localStorage:', error);
      loadHalfTerms();
      setSupabaseHalfTermsLoaded(true);
    }
  };

  // Sync half-terms to Supabase
  const syncHalfTermsToSupabase = async () => {
    try {
      console.log('Syncing half-terms to Supabase for sheet:', currentSheetInfo.sheet, 'academic year:', currentAcademicYear);
      
      for (const halfTerm of halfTerms) {
        await halfTermsApi.updateHalfTerm(
          currentSheetInfo.sheet,
          halfTerm.id,
          halfTerm.lessons,
          halfTerm.isComplete,
          currentAcademicYear,
          halfTerm.stacks // Add stacks parameter
        );
      }
      
      console.log('Successfully synced half-terms to Supabase');
    } catch (error) {
      console.error('Failed to sync half-terms to Supabase:', error);
    }
  };

  // Update a half-term (now year-specific)
  const updateHalfTerm = async (halfTermId: string, lessons: string[], isComplete: boolean, stacks?: string[]) => {
    console.log('🔄 DATACONTEXT - updateHalfTerm called:', { 
      halfTermId, 
      lessons, 
      isComplete, 
      stacks,
      stacksProvided: stacks !== undefined,
      currentAcademicYear 
    });
    
    // Sanitize incoming lessons: remove orphaned IDs and duplicates
    const sanitizedLessons = Array.from(new Set((lessons || []).filter(l => !!allLessonsData[l])));

    // Update year-specific data
    setHalfTermsByYear(prev => {
      const currentYearData = prev[currentAcademicYear] || createEmptyYearStructure();
      const existingTerm = currentYearData.find(term => term.id === halfTermId);
      
      console.log('🔍 DATACONTEXT - Found existing term:', {
        found: !!existingTerm,
        existingTermId: existingTerm?.id,
        existingStacks: existingTerm?.stacks
      });
      
      let updatedHalfTerms: HalfTerm[];
      if (existingTerm) {
        // Update existing term
        const updatedTerm = { 
          ...existingTerm, 
          lessons: sanitizedLessons, 
          isComplete, 
          stacks: stacks !== undefined ? stacks : existingTerm.stacks, 
          updatedAt: new Date() 
        };
        
        updatedHalfTerms = currentYearData.map(term => 
          term.id === halfTermId ? updatedTerm : term
        );
        
        console.log('✅ DATACONTEXT - Updated existing half-term:', {
          halfTermId, 
          year: currentAcademicYear,
          oldStacks: existingTerm.stacks,
          newStacks: updatedTerm.stacks,
          stacksWereUpdated: existingTerm.stacks !== updatedTerm.stacks
        });
      } else {
        // Create new term if it doesn't exist
        const halfTermNames: Record<string, string> = {
          'A1': 'Autumn 1',
          'A2': 'Autumn 2', 
          'SP1': 'Spring 1',
          'SP2': 'Spring 2',
          'SM1': 'Summer 1',
          'SM2': 'Summer 2'
        };
        
        const newTerm: HalfTerm = {
          id: halfTermId,
          name: halfTermNames[halfTermId] || halfTermId,
          months: halfTermId.startsWith('A') ? (halfTermId === 'A1' ? 'Sep-Oct' : 'Nov-Dec') :
                  halfTermId.startsWith('SP') ? (halfTermId === 'SP1' ? 'Jan-Feb' : 'Mar-Apr') :
                  (halfTermId === 'SM1' ? 'Apr-May' : 'Jun-Jul'),
          lessons: sanitizedLessons,
          isComplete,
          stacks: stacks || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        updatedHalfTerms = [...currentYearData, newTerm];
        console.log('✅ DATACONTEXT - Created new half-term:', {
          halfTermId, 
          year: currentAcademicYear,
          stacks: newTerm.stacks
        });
      }
      
      // Save to localStorage
      const storageKey = `half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedHalfTerms));
      
      console.log('💾 DATACONTEXT - Saved to localStorage:', {
        key: storageKey,
        halfTermsCount: updatedHalfTerms.length,
        updatedTerm: updatedHalfTerms.find(t => t.id === halfTermId)
      });
      
      return {
        ...prev,
        [currentAcademicYear]: updatedHalfTerms
      };
    });

    // Also update the legacy halfTerms state for backward compatibility
    setHalfTerms(prev => {
      const existingTerm = prev.find(term => term.id === halfTermId);
      
      if (existingTerm) {
        // Update existing term - CRITICAL: Must include stacks!
      const updatedHalfTerms = prev.map(term => 
          term.id === halfTermId ? { 
            ...term, 
            lessons, 
            isComplete,
            stacks: stacks !== undefined ? stacks : term.stacks, // ADDED: Include stacks!
            updatedAt: new Date()
          } : term
        );
        
        console.log('💾 DATACONTEXT - Legacy state updated:', {
          halfTermId,
          oldStacks: existingTerm.stacks,
          newStacks: stacks !== undefined ? stacks : existingTerm.stacks
        });
        
      localStorage.setItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`, JSON.stringify(updatedHalfTerms));
      return updatedHalfTerms;
      } else {
        // Create new term if it doesn't exist
        const halfTermNames: Record<string, string> = {
          'A1': 'Autumn 1',
          'A2': 'Autumn 2', 
          'SP1': 'Spring 1',
          'SP2': 'Spring 2',
          'SM1': 'Summer 1',
          'SM2': 'Summer 2'
        };
        
        const newTerm = {
          id: halfTermId,
          name: halfTermNames[halfTermId] || halfTermId,
          months: halfTermId.startsWith('A') ? (halfTermId === 'A1' ? 'Sep-Oct' : 'Nov-Dec') :
                  halfTermId.startsWith('SP') ? (halfTermId === 'SP1' ? 'Jan-Feb' : 'Mar-Apr') :
                  (halfTermId === 'SM1' ? 'Apr-May' : 'Jun-Jul'),
          lessons: sanitizedLessons,
          stacks: stacks || [], // ADDED: Include stacks in new term!
          isComplete,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedHalfTerms = [...prev, newTerm];
        console.log('✅ Created new half-term:', newTerm);
        localStorage.setItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`, JSON.stringify(updatedHalfTerms));
        return updatedHalfTerms;
      }
    });
    
    // Immediately sync to Supabase
    try {
      console.log(`🔄 Attempting to save half-term to Supabase:`, {
        sheet: currentSheetInfo.sheet,
        halfTermId,
        lessons,
        isComplete
      });
      
      // Get the current half-term to include stacks in the update
      const currentHalfTerm = halfTerms.find(t => t.id === halfTermId);
      const result = await halfTermsApi.updateHalfTerm(
        currentSheetInfo.sheet, 
        halfTermId, 
        sanitizedLessons, 
        isComplete, 
        currentAcademicYear,
        stacks || currentHalfTerm?.stacks // Include stacks parameter
      );
      console.log(`✅ Successfully saved half-term ${halfTermId} to Supabase:`, result);
    } catch (error: any) {
      console.error(`❌ Failed to save half-term ${halfTermId} to Supabase:`, error);
      console.error(`❌ Error details:`, {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      // Don't throw error - keep local changes even if Supabase fails
    }
  };

  // ADDED: Get lessons for a specific half-term (now year-specific)
  const getLessonsForHalfTerm = (halfTermId: string): string[] => {
    // Use the legacy halfTerms state for now to maintain compatibility
    // TODO: Migrate to use halfTermsByYear when the year-specific system is fully implemented
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    const lessons = (halfTerm ? halfTerm.lessons : []).filter(lessonId => !!allLessonsData[lessonId]);
    
  // DEBUG: Log lesson retrieval with more detail
  console.log(`🔍 getLessonsForHalfTerm(${halfTermId}):`, {
    halfTermFound: !!halfTerm,
    lessons: lessons,
    lessonsLength: lessons.length,
    halfTermData: halfTerm ? {
      id: halfTerm.id,
      name: halfTerm.name,
      lessons: halfTerm.lessons,
      lessonsLength: halfTerm.lessons?.length || 0,
      stacks: halfTerm.stacks,
      stacksLength: halfTerm.stacks?.length || 0
    } : null,
    allHalfTerms: halfTerms.map(ht => ({ 
      id: ht.id, 
      name: ht.name, 
      lessonsCount: ht.lessons?.length || 0,
      stacksCount: ht.stacks?.length || 0
    })),
    currentAcademicYear,
    halfTermsByYearKeys: Object.keys(halfTermsByYear),
    halfTermsByYearCurrent: halfTermsByYear[currentAcademicYear]?.map(ht => ({
      id: ht.id,
      name: ht.name,
      lessonsCount: ht.lessons?.length || 0
    })),
    allLessonsDataKeys: Object.keys(allLessonsData),
    allLessonsDataCount: Object.keys(allLessonsData).length,
    loading: loading
  });
    
    return lessons;
  };

  // Get term-specific lesson number (1-based index in the term)
  const getTermSpecificLessonNumber = (lessonNumber: string, halfTermId: string): number => {
    const lessons = getLessonsForHalfTerm(halfTermId);
    const index = lessons.indexOf(lessonNumber);
    return index >= 0 ? index + 1 : 0;
  };

  // Get display title for a lesson within a specific term
  const getLessonDisplayTitle = (lessonNumber: string, halfTermId: string): string => {
    const lessonData = allLessonsData[lessonNumber];
    const termSpecificNumber = getTermSpecificLessonNumber(lessonNumber, halfTermId);
    
    if (termSpecificNumber > 0 && lessonData) {
      return lessonData.title || `Lesson ${termSpecificNumber}`;
    }
    
    return lessonData?.title || `Lesson ${lessonNumber}`;
  };

  // Load all activities
  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Activities should always load regardless of data clearing
      // (Only lesson data gets cleared, not activities)
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const activities = await activitiesApi.getAll();
          if (activities && activities.length > 0) {
            // Ensure yearGroups is always an array for each activity
            const normalizedActivities = activities.map((activity: any) => ({
              ...activity,
              yearGroups: Array.isArray(activity.yearGroups) ? activity.yearGroups : 
                         (activity.level ? [activity.level] : [])
            }));
            setAllActivities(normalizedActivities);
            console.log('✅ Activities set in DataContext state:', normalizedActivities.length);
            return;
          }
        } catch (error) {
          console.warn('Failed to load activities from Supabase:', error);
        }
      }
      
      // Fallback to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        // Ensure yearGroups is always an array for each activity
        const normalizedActivities = activities.map((activity: Activity) => ({
          ...activity,
          yearGroups: Array.isArray(activity.yearGroups) ? activity.yearGroups : 
                     (activity.yearGroups ? [activity.yearGroups] : [])
        }));
        setAllActivities(normalizedActivities);
        return;
      }
      
      // If no saved activities, extract from lessons data
      const extractedActivities: Activity[] = [];
      Object.values(allLessonsData).forEach(lessonData => {
        Object.values(lessonData.grouped).forEach(categoryActivities => {
          extractedActivities.push(...categoryActivities);
        });
      });
      
      // Remove duplicates based on activity name and category
      const uniqueActivities = extractedActivities.filter((activity, index, self) => 
        index === self.findIndex(a => a.activity === activity.activity && a.category === activity.category)
      );
      
      setAllActivities(uniqueActivities);
      
      // Save to localStorage
      localStorage.setItem('library-activities', JSON.stringify(uniqueActivities));
      
      // Try to add each activity to the server
      if (isSupabaseConfigured()) {
        uniqueActivities.forEach(async (activity) => {
          try {
            await activitiesApi.create(activity);
          } catch (error) {
            console.warn('Failed to add activity to Supabase:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      setAllActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new activity
  const addActivity = async (activity: Activity): Promise<Activity> => {
    try {
      // Try to add to Supabase if connected
      let newActivity = activity;
      if (isSupabaseConfigured()) {
        try {
          newActivity = await activitiesApi.create({ ...activity, yearGroups: activity.yearGroups || [] });
        } catch (error) {
          console.warn('Failed to add activity to Supabase:', error);
          // Generate a local ID
          newActivity = {
            ...activity,
            yearGroups: activity.yearGroups || [],
            _id: `local-${Date.now()}`
          };
        }
      } else {
        // Generate a local ID
        newActivity = {
          ...activity,
          yearGroups: activity.yearGroups || [],
          _id: `local-${Date.now()}`
        };
      }
      
      // Update local state
      setAllActivities(prev => [...prev, newActivity]);
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        activities.push(newActivity);
        localStorage.setItem('library-activities', JSON.stringify(activities));
      } else {
        localStorage.setItem('library-activities', JSON.stringify([newActivity]));
      }
      
      return newActivity;
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  };

  // Update an existing activity
  const updateActivity = async (activity: Activity): Promise<Activity> => {
    try {
      // Try to update in Supabase if connected
      let updatedActivity = { ...activity, yearGroups: activity.yearGroups || [] };
      if (isSupabaseConfigured() && (activity._id)) {
        try {
          updatedActivity = await activitiesApi.update(activity._id, { ...updatedActivity, yearGroups: updatedActivity.yearGroups || [] });
        } catch (error) {
          console.warn('Failed to update activity in Supabase:', error);
        }
      }
      // Update local state
      setAllActivities(prev => prev.map(a => (a._id === activity._id) ? updatedActivity : a));
      
      // Propagate changes to any lessons/units that reference this activity
      setAllLessonsData(prevLessons => {
        const updatedLessons: Record<string, LessonData> = { ...prevLessons };
        const targetId = updatedActivity._id || updatedActivity.id;
        if (!targetId) return updatedLessons;

        Object.keys(updatedLessons).forEach(lessonNum => {
          const lesson = updatedLessons[lessonNum];
          if (!lesson?.grouped) return;
          let lessonChanged = false;
          const newGrouped: Record<string, Activity[]> = {};
          Object.entries(lesson.grouped).forEach(([category, activities]) => {
            const replaced = activities.map(act => {
              const actId = act._id || act.id;
              if (actId && actId === targetId) {
                lessonChanged = true;
                // Keep lesson-specific fields but replace content
                return { ...act, ...updatedActivity } as Activity;
              }
              return act;
            });
            newGrouped[category] = replaced;
          });
          if (lessonChanged) {
            updatedLessons[lessonNum] = { ...lesson, grouped: newGrouped };
          }
        });
        return updatedLessons;
      });

      // Persist the updated lessons dataset to localStorage immediately as a backup
      try {
        const dataToSave = {
          allLessonsData: { ...allLessonsData },
          lessonNumbers,
          teachingUnits,
          lessonStandards
        };
        // Merge latest setAllLessonsData changes after tick using timeout
        setTimeout(async () => {
          const snapshot = {
            allLessonsData: { ...allLessonsData },
            lessonNumbers,
            teachingUnits,
            lessonStandards
          };
          localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(snapshot));
          if (isSupabaseConfigured()) {
            try {
              await lessonsApi.updateSheet(currentSheetInfo.sheet, snapshot, currentAcademicYear);
            } catch (e) {
              console.warn('Failed to persist updated lessons after activity edit:', e);
            }
          }
        }, 0);
      } catch (persistError) {
        console.warn('Non-blocking: failed to persist lessons after activity update:', persistError);
      }
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const updatedActivities = activities.map((a: Activity) => (a._id === activity._id) ? updatedActivity : a);
        localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
      }
      
      return updatedActivity;
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  };

  // Delete an activity
  const deleteActivity = async (activityId: string): Promise<void> => {
    try {
      // Try to delete from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          await activitiesApi.delete(activityId);
        } catch (error) {
          console.warn('Failed to delete activity from Supabase:', error);
        }
      }
      
      // Update local state
      setAllActivities(prev => prev.filter(a => a._id !== activityId && a.id !== activityId));
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const updatedActivities = activities.filter((a: Activity) => a._id !== activityId && a.id !== activityId);
        localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  };

  const loadUserCreatedLessonPlans = () => {
    try {
      // If data was cleared, don't load any plans
      if (dataWasCleared) {
        setUserCreatedLessonPlans([]);
        return;
      }
      
      // First try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        supabase
          .from(TABLES.LESSON_PLANS)
          .select('*')
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load lesson plans from Supabase:', error);
              loadUserCreatedLessonPlansFromLocalStorage();
            } else if (data) {
              // Convert dates and snake_case to camelCase
              const plans = data.map(plan => ({
                id: plan.id,
                date: new Date(plan.date),
                week: plan.week,
                className: plan.class_name,
                activities: plan.activities || [],
                duration: plan.duration || 0,
                notes: plan.notes || '',
                status: plan.status || 'planned',
                unitId: plan.unit_id,
                unitName: plan.unit_name,
                lessonNumber: plan.lesson_number,
                title: plan.title,
                term: plan.term,
                time: plan.time,
                createdAt: new Date(plan.created_at),
                updatedAt: new Date(plan.updated_at)
              }));
              setUserCreatedLessonPlans(plans);
            }
          });
      } else {
        loadUserCreatedLessonPlansFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load user-created lesson plans:', error);
      loadUserCreatedLessonPlansFromLocalStorage();
    }
  };

  const loadUserCreatedLessonPlansFromLocalStorage = () => {
    try {
      // If data was cleared, don't load any plans
      if (dataWasCleared) {
        setUserCreatedLessonPlans([]);
        return;
      }
      
      const savedPlans = localStorage.getItem('user-created-lesson-plans');
      if (savedPlans) {
        const plans = JSON.parse(savedPlans).map((plan: any) => ({
          ...plan,
          date: new Date(plan.date),
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
        }));
        setUserCreatedLessonPlans(plans);
      }
    } catch (error) {
      console.error('Failed to load user-created lesson plans from localStorage:', error);
      setUserCreatedLessonPlans([]);
    }
  };

  const saveUserCreatedLessonPlans = async (plans: LessonPlan[]) => {
    try {
      // Save to localStorage first (this is guaranteed to work)
      localStorage.setItem('user-created-lesson-plans', JSON.stringify(plans));
      
      // Then try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          // Refresh session first to ensure valid auth
          const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
          
          if (sessionError) {
            console.warn('Session refresh failed:', sessionError);
            return; // Skip Supabase save if auth fails
          }
          
          if (!session) {
            console.warn('No valid session after refresh');
            return; // Skip Supabase save if no session
          }
          
          // Convert plans to the format expected by Supabase
          const supabasePlans = plans.map(plan => ({
            id: plan.id,
            date: plan.date.toISOString(),
            week: plan.week,
            class_name: plan.className,
            activities: plan.activities,
            duration: plan.duration,
            notes: plan.notes,
            status: plan.status,
            unit_id: plan.unitId,
            unit_name: plan.unitName,
            lesson_number: plan.lessonNumber,
            title: plan.title,
            term: plan.term,
            time: plan.time
          }));
          
          // Use upsert to handle both inserts and updates
          const { error } = await supabase
            .from(TABLES.LESSON_PLANS)
            .upsert(supabasePlans, { onConflict: 'id' });
          
          if (error) {
            console.warn('Failed to save lesson plans to Supabase:', error);
          } else {
            console.log('Successfully saved lesson plans to Supabase');
          }
        } catch (supabaseError) {
          console.warn('Supabase save failed:', supabaseError);
        }
      }
    } catch (error) {
      console.error('Failed to save user-created lesson plans:', error);
    }
  };

  // Add or update a user-created lesson plan
  const addOrUpdateUserLessonPlan = async (plan: LessonPlan) => {
    setUserCreatedLessonPlans(prev => {
      // Check if the plan already exists
      const existingPlanIndex = prev.findIndex(p => p.id === plan.id);
      
      let updatedPlans: LessonPlan[];
      if (existingPlanIndex >= 0) {
        // Update existing plan
        updatedPlans = [...prev];
        updatedPlans[existingPlanIndex] = {
          ...plan,
          updatedAt: new Date()
        };
      } else {
        // Add new plan
        updatedPlans = [...prev, {
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }
      
      // Save to localStorage and Supabase
      saveUserCreatedLessonPlans(updatedPlans);
      
      // Add to allLessonsData so it appears in Lesson Library (but Unit Viewer will filter by half-term assignment)
      if (plan.lessonNumber) {
        updateAllLessonsDataWithUserPlan(plan);
      }
      
      return updatedPlans;
    });
  };
const updateLessonData = async (lessonNumber: string, updatedData: any) => {
    // Update local state
    setAllLessonsData(prev => ({
      ...prev,
      [lessonNumber]: updatedData
    }));

    // Save to Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        const dataToSave = {
          allLessonsData: { ...allLessonsData, [lessonNumber]: updatedData },
          lessonNumbers,
          teachingUnits,
          lessonStandards
        };
        await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear);
        console.log(`✅ Lesson ${lessonNumber} saved to Supabase`);
      } catch (error) {
        console.warn(`Failed to save lesson ${lessonNumber} to Supabase:`, error);
      }
    }
  };
  // FIXED: Delete a user-created lesson plan with automatic reindexing
  const deleteUserLessonPlan = async (planId: string) => {
    try {
      // Find the lesson being deleted to get its lesson number
      const lessonToDelete = userCreatedLessonPlans.find(p => p.id === planId);
      
      if (!lessonToDelete || !lessonToDelete.lessonNumber) {
        // If no lesson number, just delete normally
        setUserCreatedLessonPlans(prev => {
          const updatedPlans = prev.filter(p => p.id !== planId);
          localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
          return updatedPlans;
        });
        return;
      }
      
      const deletedLessonNumber = parseInt(lessonToDelete.lessonNumber);
      
      setUserCreatedLessonPlans(prev => {
        // Remove the deleted lesson
        let updatedPlans = prev.filter(p => p.id !== planId);
        
        // Filter lessons for the same class and sort by lesson number
        const classLessons = updatedPlans
          .filter(plan => plan.className === lessonToDelete.className && plan.lessonNumber)
          .sort((a, b) => parseInt(a.lessonNumber!) - parseInt(b.lessonNumber!));
        
        // Create a mapping of old lesson numbers to new lesson numbers
        const lessonNumberMapping: Record<string, string> = {};
        
        // Reindex lessons that come after the deleted lesson
        classLessons.forEach((lesson, index) => {
          const oldNumber = parseInt(lesson.lessonNumber!);
          const newNumber = (index + 1).toString(); // Sequential numbering starting from 1
          
          lessonNumberMapping[lesson.lessonNumber!] = newNumber;
          
          // Update the lesson number
          lesson.lessonNumber = newNumber;
          lesson.updatedAt = new Date();
        });
        
        // Update allLessonsData with new lesson numbers
        setAllLessonsData(prevLessonsData => {
          const updatedLessonsData = { ...prevLessonsData };
          
          // Remove the deleted lesson from allLessonsData
          delete updatedLessonsData[deletedLessonNumber.toString()];
          
          // Update lesson numbers in allLessonsData
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedLessonsData[oldNumber] && oldNumber !== newNumber) {
              // Move lesson data to new number
              updatedLessonsData[newNumber] = updatedLessonsData[oldNumber];
              delete updatedLessonsData[oldNumber];
              
              // Update activity lesson numbers within the lesson data
              if (updatedLessonsData[newNumber].grouped) {
                Object.values(updatedLessonsData[newNumber].grouped).forEach(activities => {
                  activities.forEach(activity => {
                    activity.lessonNumber = newNumber;
                  });
                });
              }
            }
          });
          
          return updatedLessonsData;
        });
        
        // Update lesson numbers list
        setLessonNumbers(prevNumbers => {
          const updatedNumbers = prevNumbers
            .filter(num => num !== deletedLessonNumber.toString())
            .map(num => lessonNumberMapping[num] || num)
            .sort((a, b) => parseInt(a) - parseInt(b));
          
          return updatedNumbers;
        });
        
        // Update EYFS statements with new lesson numbers
        setLessonStandards(prevStatements => {
          const updatedStatements = { ...prevStatements };
          
          // Remove deleted lesson
          delete updatedStatements[deletedLessonNumber.toString()];
          
          // Update lesson numbers in EYFS statements
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedStatements[oldNumber] && oldNumber !== newNumber) {
              updatedStatements[newNumber] = updatedStatements[oldNumber];
              delete updatedStatements[oldNumber];
            }
          });
          
          return updatedStatements;
        });
        
        // Update half-terms with new lesson numbers
        setHalfTerms(prevHalfTerms => {
          const updatedHalfTerms = prevHalfTerms.map(term => {
            const updatedLessons = term.lessons
              .filter(lessonNum => lessonNum !== deletedLessonNumber.toString()) // Remove deleted lesson
              .map(lessonNum => lessonNumberMapping[lessonNum] || lessonNum); // Update with new numbers
            
            return {
              ...term,
              lessons: updatedLessons
            };
          });
          
          localStorage.setItem(`half-terms-${lessonToDelete.className}-${currentAcademicYear}`, JSON.stringify(updatedHalfTerms));
          return updatedHalfTerms;
        });
        
        // Update units with new lesson numbers
        const savedUnits = localStorage.getItem(`units-${lessonToDelete.className}`);
        if (savedUnits) {
          try {
            const units = JSON.parse(savedUnits);
            const updatedUnits = units.map((unit: any) => {
              const updatedLessonNumbers = unit.lessonNumbers
                .filter((num: string) => num !== deletedLessonNumber.toString()) // Remove deleted lesson
                .map((num: string) => lessonNumberMapping[num] || num); // Update with new numbers
              
              return {
                ...unit,
                lessonNumbers: updatedLessonNumbers,
                updatedAt: new Date()
              };
            });
            
            localStorage.setItem(`units-${lessonToDelete.className}`, JSON.stringify(updatedUnits));
            setUnits(updatedUnits);
          } catch (error) {
            console.error('Failed to update units after lesson deletion:', error);
          }
        }
        
        // Save updated lesson plans to localStorage
        localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
        
        // Save updated lesson data to localStorage
        const dataToSave = {
          allLessonsData: allLessonsData,
          lessonNumbers: lessonNumbers,
          teachingUnits,
          lessonStandards
        };
        
        localStorage.setItem(`lesson-data-${lessonToDelete.className}`, JSON.stringify(dataToSave));
        
        return updatedPlans;
      });
      
      // Try to delete from Supabase if connected
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.LESSON_PLANS)
          .delete()
          .eq('id', planId);
        
        if (error) {
          console.warn('Failed to delete lesson plan from Supabase:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to delete and reindex lesson plan:', error);
    }
  };

  // Delete a lesson
  const deleteLesson = (lessonNumber: string) => {
    // Remove the lesson from allLessonsData
    setAllLessonsData(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    // Remove the lesson from lessonNumbers
    setLessonNumbers(prev => prev.filter(num => num !== lessonNumber));

    // Remove the lesson from lessonStandards
    setLessonStandards(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    // Save the updated data to localStorage
    const dataToSave = {
      allLessonsData: { ...allLessonsData },
      lessonNumbers: lessonNumbers.filter(num => num !== lessonNumber),
      teachingUnits,
      lessonStandards: { ...lessonStandards }
    };

    // Delete the lesson from allLessonsData
    delete dataToSave.allLessonsData[lessonNumber];
    // Delete the lesson from lessonStandards
    delete dataToSave.lessonStandards[lessonNumber];

    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));

    // Try to update the Supabase data
    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear)
        .catch(error => console.warn(`Failed to update Supabase after deleting lesson ${lessonNumber}:`, error));
    }

    // Also remove this lesson from any user-created lesson plans
    setUserCreatedLessonPlans(prev => {
      const updatedPlans = prev.filter(plan => plan.lessonNumber !== lessonNumber);
      saveUserCreatedLessonPlans(updatedPlans);
      return updatedPlans;
    });

    // Also update any units that contain this lesson
    try {
      const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
      if (savedUnits) {
        const units = JSON.parse(savedUnits);
        let unitsUpdated = false;

        const updatedUnits = units.map((unit: any) => {
          if (unit.lessonNumbers.includes(lessonNumber)) {
            unitsUpdated = true;
            return {
              ...unit,
              lessonNumbers: unit.lessonNumbers.filter((num: string) => num !== lessonNumber),
              updatedAt: new Date()
            };
          }
          return unit;
        });

        if (unitsUpdated) {
          localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
          setUnits(updatedUnits);
        }
      }
    } catch (error) {
      console.error('Failed to update units after deleting lesson:', error);
    }

    // Also update any half-terms that contain this lesson
    try {
      const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`);
      if (savedHalfTerms) {
        const halfTerms = JSON.parse(savedHalfTerms);
        let halfTermsUpdated = false;

        const updatedHalfTerms = halfTerms.map((term: any) => {
          if (term.lessons.includes(lessonNumber)) {
            halfTermsUpdated = true;
            return {
              ...term,
              lessons: term.lessons.filter((num: string) => num !== lessonNumber)
            };
          }
          return term;
        });

        if (halfTermsUpdated) {
          localStorage.setItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`, JSON.stringify(updatedHalfTerms));
          setHalfTerms(updatedHalfTerms);
        }
      }
    } catch (error) {
      console.error('Failed to update half-terms after deleting lesson:', error);
    }
  };

  // Update allLessonsData with a user-created lesson plan
  const updateAllLessonsDataWithUserPlan = (plan: LessonPlan) => {
    if (!plan.lessonNumber) return;
    
    // Group activities by category
    const grouped: Record<string, Activity[]> = {};
    const categoriesInLesson = new Set<string>();
    let totalTime = 0;
    
    plan.activities.forEach(activity => {
      if (!grouped[activity.category]) {
        grouped[activity.category] = [];
      }
      grouped[activity.category].push({
        ...activity,
        lessonNumber: plan.lessonNumber || ''
      });
      categoriesInLesson.add(activity.category);
      totalTime += activity.time || 0;
    });
    
    // Sort categories according to the predefined order
    const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));
    
    // Create or update the lesson data
    const lessonData: LessonData = {
      grouped,
      categoryOrder,
      totalTime,
      title: plan.title,
      lessonStandards: [],
      academicYear: currentAcademicYear
    };
    
    setAllLessonsData(prev => {
      const updated = { ...prev };
      updated[plan.lessonNumber!] = lessonData;
      return updated;
    });
    
    // Update lesson numbers if needed
    setLessonNumbers(prev => {
      if (!prev.includes(plan.lessonNumber!)) {
        const updated = [...prev, plan.lessonNumber!];
        // Sort numerically
        return updated.sort((a, b) => parseInt(a) - parseInt(b));
      }
      return prev;
    });
    
    // CRITICAL FIX: Auto-assign lesson to a half-term if not already assigned
    const isAlreadyAssigned = halfTerms.some(halfTerm => halfTerm.lessons.includes(plan.lessonNumber!));
    
    if (!isAlreadyAssigned && plan.lessonNumber) {
      // Determine which half-term to assign to based on the lesson plan's term or default to first available
      let targetHalfTermId = 'A1'; // Default to Autumn 1
      
      // If the plan has a term specified, try to map it to a half-term
      if (plan.term) {
        const termMapping: Record<string, string> = {
          'Autumn': 'A1',
          'Spring': 'SP1', 
          'Summer': 'SM1'
        };
        targetHalfTermId = termMapping[plan.term] || 'A1';
      }
      
      // Find the first half-term that has space (less than 10 lessons) or use the target
      const availableHalfTerm = halfTerms.find(term => 
        term.id === targetHalfTermId || term.lessons.length < 10
      );
      
      if (availableHalfTerm) {
        const currentLessons = availableHalfTerm.lessons;
        const updatedLessons = [...currentLessons, plan.lessonNumber];
        
        console.log(`Auto-assigning lesson ${plan.lessonNumber} to half-term ${availableHalfTerm.id}`);
        
        // Update the half-term with the new lesson assignment
        setHalfTerms(prev => {
          const updated = prev.map(term => 
            term.id === availableHalfTerm.id 
              ? { ...term, lessons: updatedLessons }
              : term
          );
          
          // Save to localStorage
          localStorage.setItem(`half-terms-${currentSheetInfo.sheet}-${currentAcademicYear}`, JSON.stringify(updated));
          
          // Sync to Supabase
          if (isSupabaseConfigured()) {
            halfTermsApi.updateHalfTerm(
              currentSheetInfo.sheet, 
              availableHalfTerm.id, 
              updatedLessons, 
              availableHalfTerm.isComplete,
              undefined, // academicYear
              availableHalfTerm.stacks // Include stacks
            )
              .then(() => console.log(`Successfully synced lesson assignment to Supabase`))
              .catch(error => console.warn(`Failed to sync lesson assignment to Supabase:`, error));
          }
          
          return updated;
        });
      }
    }
    
    // Save the updated data to localStorage
    const dataToSave = {
      allLessonsData: {
        ...allLessonsData,
        [plan.lessonNumber!]: lessonData
      },
      lessonNumbers: lessonNumbers.includes(plan.lessonNumber!) 
        ? lessonNumbers 
        : [...lessonNumbers, plan.lessonNumber!].sort((a, b) => parseInt(a) - parseInt(b)),
      teachingUnits,
      lessonStandards
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    
    // Try to update Supabase if connected
    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear)
        .catch(error => console.warn(`Failed to update Supabase with user plan for lesson ${plan.lessonNumber}:`, error));
    }
  };

  const loadStandards = async () => {
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setNestedStandards(DEFAULT_NESTED_STANDARDS);
        return;
      }
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const response = await eyfsApi.getBySheet(currentSheetInfo.sheet);
          if (response && response.allStatements) {
            setNestedStandards(response.allStatements);
            return;
          }
        } catch (serverError) {
          console.warn('Failed to load EYFS statements from Supabase:', serverError);
        }
      }
      
      // Fallback to localStorage
      const savedStandards = localStorage.getItem(`eyfs-statements-flat-${currentSheetInfo.sheet}`);
      if (savedStandards) {
        try {
          const parsedStandards = JSON.parse(savedStandards);
          // Data is already stored as a flat array
          setNestedStandards(parsedStandards.length > 0 ? parsedStandards : DEFAULT_NESTED_STANDARDS);
        } catch (error) {
          console.error('Error parsing saved EYFS standards:', error);
          setNestedStandards(DEFAULT_NESTED_STANDARDS);
        }
      } else {
        // Use default standards if none saved
        setNestedStandards(DEFAULT_NESTED_STANDARDS);
      }
    } catch (error) {
      console.error('Error loading EYFS statements:', error);
      setNestedStandards(DEFAULT_NESTED_STANDARDS);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // If data was cleared, set empty state
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setLessonStandards({});
        setLoading(false);
        return;
      }
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const lessonData = await lessonsApi.getBySheet(currentSheetInfo.sheet, currentAcademicYear);
          if (lessonData && Object.keys(lessonData).length > 0) {
            console.log('🔍 DEBUG: Loaded lesson data from Supabase:', {
              sheet: currentSheetInfo.sheet,
              academicYear: currentAcademicYear,
              lessonDataKeys: Object.keys(lessonData),
              allLessonsDataKeys: Object.keys(lessonData.allLessonsData || {}),
              sampleLesson: lessonData.allLessonsData ? Object.values(lessonData.allLessonsData)[0] : null
            });
            
            // Filter lessons by academic year
            const filteredLessonsData: Record<string, LessonData> = {};
            const filteredLessonNumbers: string[] = [];
            
            if (lessonData.allLessonsData) {
              Object.entries(lessonData.allLessonsData).forEach(([lessonNum, lesson]) => {
                // Type assertion for lesson data
                const typedLesson = lesson as LessonData;
                // If lesson has no academic year set, assume it belongs to current year
                const lessonAcademicYear = typedLesson.academicYear || currentAcademicYear;
                
                if (lessonAcademicYear === currentAcademicYear) {
                  filteredLessonsData[lessonNum] = typedLesson;
                  filteredLessonNumbers.push(lessonNum);
                }
              });
            }
            
            console.log(`🔍 Filtered lessons for academic year ${currentAcademicYear}:`, {
              totalLessons: Object.keys(lessonData.allLessonsData || {}).length,
              filteredLessons: Object.keys(filteredLessonsData).length,
              filteredLessonNumbers
            });
            
            // FIX: Clean up any corrupted lesson titles (UUIDs)
            Object.keys(filteredLessonsData).forEach(lessonNum => {
              const lesson = filteredLessonsData[lessonNum];
              if (lesson && lesson.title) {
                // Check if title is a UUID (corrupted data)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson.title);
                if (isUUID) {
                  console.log('🔧 FIXING: Corrupted lesson title detected:', { lessonNum, corruptedTitle: lesson.title });
                  // Regenerate the title based on lesson content
                  lesson.title = generateDefaultLessonTitle(lesson);
                  console.log('🔧 FIXED: Generated new title:', { lessonNum, newTitle: lesson.title });
                }
              }
            });
            
            setAllLessonsData(filteredLessonsData);
            setLessonNumbers(filteredLessonNumbers.sort((a, b) => parseInt(a) - parseInt(b)));
            setTeachingUnits(lessonData.teachingUnits || []);
            setLessonStandards(lessonData.lessonStandards || {});
            console.log(`Loaded ${currentSheetInfo.sheet} data for academic year ${currentAcademicYear} from Supabase`);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`Supabase data fetch failed for ${currentSheetInfo.sheet}, trying localStorage:`, error);
        }
      }
      
      // Try to load from localStorage as fallback
      const savedData = localStorage.getItem(`lesson-data-${currentSheetInfo.sheet}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Filter lessons by academic year in localStorage data too
        const filteredLessonsData: Record<string, LessonData> = {};
        const filteredLessonNumbers: string[] = [];
        
        if (parsedData.allLessonsData) {
          Object.entries(parsedData.allLessonsData).forEach(([lessonNum, lesson]) => {
            // Type assertion for lesson data
            const typedLesson = lesson as LessonData;
            // If lesson has no academic year set, assume it belongs to current year
            const lessonAcademicYear = typedLesson.academicYear || currentAcademicYear;
            
            if (lessonAcademicYear === currentAcademicYear) {
              filteredLessonsData[lessonNum] = typedLesson;
              filteredLessonNumbers.push(lessonNum);
            }
          });
        }
        
        // FIX: Clean up any corrupted lesson titles (UUIDs) in localStorage data too
        Object.keys(filteredLessonsData).forEach(lessonNum => {
          const lesson = filteredLessonsData[lessonNum];
          if (lesson && lesson.title) {
            // Check if title is a UUID (corrupted data)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson.title);
            if (isUUID) {
              console.log('🔧 FIXING: Corrupted lesson title in localStorage:', { lessonNum, corruptedTitle: lesson.title });
              // Regenerate the title based on lesson content
              lesson.title = generateDefaultLessonTitle(lesson);
              console.log('🔧 FIXED: Generated new title from localStorage:', { lessonNum, newTitle: lesson.title });
            }
          }
        });
        
        setAllLessonsData(filteredLessonsData);
        setLessonNumbers(filteredLessonNumbers.sort((a, b) => parseInt(a) - parseInt(b)));
        setTeachingUnits(parsedData.teachingUnits || []);
        setLessonStandards(parsedData.lessonStandards || {});
        console.log(`Loaded ${currentSheetInfo.sheet} data for academic year ${currentAcademicYear} from localStorage`);
        
        // Try to save to Supabase for future use, but don't wait for it
        if (isSupabaseConfigured()) {
          const cleanedData = { ...parsedData, allLessonsData: filteredLessonsData };
          lessonsApi.updateSheet(currentSheetInfo.sheet, cleanedData, currentAcademicYear)
            .then(() => console.log(`Migrated cleaned ${currentSheetInfo.sheet} data to Supabase`))
            .catch(serverError => console.warn(`Failed to migrate ${currentSheetInfo.sheet} data to Supabase:`, serverError));
        }
      } else {
        // If no saved data and data was not just cleared, load sample data
        // Otherwise, set empty state
        if (dataWasCleared) {
          console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
          setAllLessonsData({});
          setLessonNumbers([]);
          setTeachingUnits([]);
          setLessonStandards({});
          setDataWasCleared(false); // Reset the flag
        } else {
          // Load sample data only if data wasn't cleared
          await loadSampleData();
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // If data was cleared, set empty state instead of loading sample data
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setLessonStandards({});
        setDataWasCleared(false); // Reset the flag
      } else {
        // Load sample data only if data wasn't cleared
        await loadSampleData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      console.log(`Loading sample data for ${currentSheetInfo.sheet}`);
      
      // Set empty data instead of sample data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setLessonStandards({});
      
      console.log(`Set empty data for ${currentSheetInfo.sheet}`);
    } catch (error) {
      console.error(`Sample data loading failed for ${currentSheetInfo.sheet}:`, error);
      
      // Set empty data instead of minimal fallback data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setLessonStandards({});
    }
  };

  const sortCategoriesByOrder = (categories: string[]): string[] => {
    // Sort categories according to the predefined order
    return categories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      
      // If both categories are in the predefined order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one category is in the predefined order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither category is in the predefined order, sort alphabetically
      return a.localeCompare(b);
    });
  };

  const processSheetData = async (sheetData: string[][]) => {
    try {
      if (!sheetData || sheetData.length === 0) {
        console.warn(`No sheet data provided for ${currentSheetInfo.sheet}`);
        return;
      }
      
      console.log(`Processing ${currentSheetInfo.sheet} sheet data, rows:`, sheetData.length);
      
      const headers = sheetData[0];
      console.log('Headers:', headers);
      
      const activities: Activity[] = [];
      const lessonNumbersSet = new Set<string>();
      const categoriesSet = new Set<string>();
      let currentLessonNumber = '';

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length < 3) continue; // Skip empty or incomplete rows

        // Safely extract data with fallbacks
        const lessonNumber = (row[0] || '').toString().trim();
        const category = (row[1] || '').toString().trim();
        const activityName = (row[2] || '').toString().trim();
        const description = (row[3] || '').toString().trim();
        const level = (row[4] || '').toString().trim();
        const timeStr = (row[5] || '0').toString().trim();
        const video = (row[6] || '').toString().trim();
        const music = (row[7] || '').toString().trim();
        const backing = (row[8] || '').toString().trim();
        const resource = (row[9] || '').toString().trim();
        const unitName = (row[10] || '').toString().trim();

        // Skip rows without category or activity name
        if (!category || !activityName) continue;

        // Handle lesson number logic - if empty, use the last seen lesson number
        if (lessonNumber) {
          currentLessonNumber = lessonNumber;
          lessonNumbersSet.add(lessonNumber);
        }

        categoriesSet.add(category);

        // Parse time safely
        let time = 0;
        try {
          const parsedTime = parseInt(timeStr);
          if (!isNaN(parsedTime) && parsedTime >= 0) {
            time = parsedTime;
          }
        } catch (e) {
          console.warn('Invalid time value:', timeStr);
        }

        const activity: Activity = {
          id: `${currentSheetInfo.sheet}-${activityName}-${category}-${Date.now()}`,
          activity: activityName,
          description: description.replace(/"/g, ''),
          time,
          videoLink: video,
          musicLink: music,
          backingLink: backing,
          resourceLink: resource,
          link: '',
          vocalsLink: '',
          imageLink: '',
          teachingUnit: category,
          category,
          level,
          yearGroups: Array.isArray(level) ? level : (level ? [level] : []), // Initialize yearGroups from level for backward compatibility
          unitName,
          lessonNumber: currentLessonNumber || '1', // Default to lesson 1 if no lesson number
          eyfsStandards: []
        };

        activities.push(activity);
        
        // Try to add to Supabase if connected
        if (isSupabaseConfigured()) {
          try {
            // Remove id as Supabase will generate its own id
            const { id, _uniqueId, ...activityForSupabase } = activity;
            
            // Convert camelCase to snake_case for database
            const dbActivity = {
              activity: activityForSupabase.activity,
              description: activityForSupabase.description,
              activity_text: activityForSupabase.activityText,
              time: activityForSupabase.time,
              video_link: activityForSupabase.videoLink,
              music_link: activityForSupabase.musicLink,
              backing_link: activityForSupabase.backingLink,
              resource_link: activityForSupabase.resourceLink,
              link: activityForSupabase.link,
              vocals_link: activityForSupabase.vocalsLink,
              image_link: activityForSupabase.imageLink,
              teaching_unit: activityForSupabase.teachingUnit,
              category: activityForSupabase.category,
              level: activityForSupabase.level,
              unit_name: activityForSupabase.unitName,
              lesson_number: activityForSupabase.lessonNumber,
              eyfs_standards: activityForSupabase.eyfsStandards
            };
            
            supabase
              .from(TABLES.ACTIVITIES)
              .upsert([dbActivity], { 
                onConflict: 'activity,category,lesson_number',
                ignoreDuplicates: false
              })
              .then(({ error }) => {
                if (error) {
                  console.warn('Failed to add activity to Supabase:', error);
                }
              });
          } catch (error) {
            console.warn('Failed to add activity to Supabase:', error);
          }
        }
      }

      console.log(`Processed ${currentSheetInfo.sheet} activities:`, activities.length);
      console.log(`${currentSheetInfo.sheet} lesson numbers found:`, Array.from(lessonNumbersSet));
      console.log(`${currentSheetInfo.sheet} categories found:`, Array.from(categoriesSet));

      // Set lesson numbers and teaching units
      const sortedLessonNumbers = Array.from(lessonNumbersSet)
        .filter(num => num && !isNaN(parseInt(num)))
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      setLessonNumbers(sortedLessonNumbers);
      setTeachingUnits(Array.from(categoriesSet).sort());

      // Group activities by lesson
      const lessonsData: Record<string, LessonData> = {};
      
      sortedLessonNumbers.forEach(lessonNum => {
        const lessonActivities = activities.filter(activity => activity.lessonNumber === lessonNum);

        const grouped: Record<string, Activity[]> = {};
        const categoriesInLesson = new Set<string>();
        let totalTime = 0;

        lessonActivities.forEach(activity => {
          if (!grouped[activity.category]) {
            grouped[activity.category] = [];
          }
          grouped[activity.category].push(activity);
          categoriesInLesson.add(activity.category);
          totalTime += activity.time;
        });

        // Sort categories according to the predefined order
        const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));

        // Generate a title for the lesson based on its content
        const title = generateDefaultLessonTitle({
          grouped,
          categoryOrder,
          totalTime,
          lessonStandards: []
        });

        lessonsData[lessonNum] = {
          grouped,
          categoryOrder,
          totalTime,
          lessonStandards: [],
          title // Add the generated title
        };
      });

      console.log(`${currentSheetInfo.sheet} lessons data structure:`, Object.keys(lessonsData));
      console.log(`Sample ${currentSheetInfo.sheet} lesson category order:`, lessonsData[sortedLessonNumbers[0]]?.categoryOrder);
      setAllLessonsData(lessonsData);

      // Set lesson standards for each lesson
      const lessonStandardsMap: Record<string, string[]> = {};
      sortedLessonNumbers.forEach(lessonNum => {
        lessonStandardsMap[lessonNum] = [];
      });
      setLessonStandards(lessonStandardsMap);

      // Save data to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), lessonStandardsMap);
      
      // Then try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          await saveDataToSupabase(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), lessonStandardsMap);
        } catch (error) {
          console.warn(`Failed to save ${currentSheetInfo.sheet} data to Supabase, but data is saved locally:`, error);
        }
      }

      // Update activities state with the new activities
      setAllActivities(prev => {
        // Combine existing activities with new ones, removing duplicates
        const existingMap = new Map(prev.map(a => [`${a.activity}-${a.category}-${a.lessonNumber}`, a]));
        
        activities.forEach(activity => {
          const key = `${activity.activity}-${activity.category}-${activity.lessonNumber}`;
          existingMap.set(key, activity);
        });
        
        const combinedActivities = Array.from(existingMap.values());
        
        // Save to localStorage
        localStorage.setItem('library-activities', JSON.stringify(combinedActivities));
        
        return combinedActivities;
      });

    } catch (error) {
      console.error(`Error processing ${currentSheetInfo.sheet} sheet data:`, error);
      // Set empty data instead of minimal fallback data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setLessonStandards({});
      
      // Save empty data to localStorage
      saveDataToLocalStorage({}, [], [], {});
    }
  };

  const saveDataToSupabase = async (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    lessonStandardsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      lessonStandards: lessonStandardsData
    };
    
    try {
      await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear);
      console.log(`Saved ${currentSheetInfo.sheet} data to Supabase`);
      return true;
    } catch (error) {
      console.warn(`Failed to save ${currentSheetInfo.sheet} data to Supabase:`, error);
      // Don't throw the error, just return false to indicate failure
      return false;
    }
  };

  const saveDataToLocalStorage = (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    lessonStandardsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      lessonStandards: lessonStandardsData
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    console.log(`Saved ${currentSheetInfo.sheet} data to localStorage (backup)`);
    return true;
  };

  const uploadExcelFile = async (file: File) => {
    try {
      setLoading(true);
      
      // Read the Excel file
      const data = await readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }
      
      console.log('Excel data loaded:', data.slice(0, 5)); // Log first 5 rows
      
      // Process the data
      await processSheetData(data);
    } catch (error) {
      console.error('Excel upload failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as string[][]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const refreshData = async () => {
    await loadData();
    await loadStandards();
    loadUserCreatedLessonPlans();
    loadActivities();
    loadUnits();
    loadHalfTerms();
    
    // ADD: Reset subjects states and reload
    setSubjectsLoadAttempted(false);
    setSubjectsLoading(false);
    await loadSubjects();
  };

  // Add EYFS statement to a lesson
  const addStandardToLesson = async (lessonNumber: string, standard: string) => {
    setLessonStandards(prev => {
      const updatedStandards = { ...prev };
      if (!updatedStandards[lessonNumber]) {
        updatedStandards[lessonNumber] = [];
      }
      if (!updatedStandards[lessonNumber].includes(standard)) {
        updatedStandards[lessonNumber] = [...updatedStandards[lessonNumber], standard];
      }
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        saveDataToSupabase(
          allLessonsData, 
          lessonNumbers, 
          teachingUnits, 
          updatedStatements
        ).catch(error => console.warn('Failed to save EYFS statements to Supabase:', error));
      }
      
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        const currentStatements = updatedLessonsData[lessonNumber].lessonStandards || [];
        if (!currentStatements.includes(eyfsStatement)) {
          updatedLessonsData[lessonNumber] = {
            ...updatedLessonsData[lessonNumber],
            lessonStandards: [...currentStatements, eyfsStatement]
          };
        }
      }
      return updatedLessonsData;
    });
  };

  // Remove EYFS statement from a lesson
  const removeStandardFromLesson = async (lessonNumber: string, standard: string) => {
    setLessonStandards(prev => {
      const updatedStandards = { ...prev };
      if (updatedStandards[lessonNumber]) {
        updatedStandards[lessonNumber] = updatedStandards[lessonNumber].filter(
          st => st !== standard
        );
      }
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        saveDataToSupabase(
          allLessonsData, 
          lessonNumbers, 
          teachingUnits, 
          updatedStatements
        ).catch(error => console.warn('Failed to save EYFS statements to Supabase:', error));
      }
      
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber] && updatedLessonsData[lessonNumber].lessonStandards) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          lessonStandards: updatedLessonsData[lessonNumber].lessonStandards!.filter(
            statement => statement !== eyfsStatement
          )
        };
      }
      return updatedLessonsData;
    });
  };

  // Add custom objective to a lesson (store at lesson level like EYFS statements)
  const addCustomObjectiveToLesson = async (lessonNumber: string, objectiveId: string) => {
    try {
      console.log('🔄 Adding custom objective to lesson:', { lessonNumber, objectiveId });
      
      // Add to lesson-level custom objectives (similar to EYFS statements)
      setAllLessonsData(prev => {
        const updatedLessonsData = { ...prev };
        if (updatedLessonsData[lessonNumber]) {
          const currentCustomObjectives = updatedLessonsData[lessonNumber].customObjectives || [];
          if (!currentCustomObjectives.includes(objectiveId)) {
            updatedLessonsData[lessonNumber] = {
              ...updatedLessonsData[lessonNumber],
              customObjectives: [...currentCustomObjectives, objectiveId],
              curriculumType: 'CUSTOM'
            };
          }
        }
        return updatedLessonsData;
      });
      
      // Save to localStorage first (this is guaranteed to work)
      const dataToSave = {
        allLessonsData: {
          ...allLessonsData,
          [lessonNumber]: {
            ...allLessonsData[lessonNumber],
            customObjectives: [...(allLessonsData[lessonNumber]?.customObjectives || []), objectiveId],
            curriculumType: 'CUSTOM'
          }
        },
        lessonNumbers,
        teachingUnits,
        lessonStandards
      };
      localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear);
          console.log('✅ Custom objective saved to Supabase');
        } catch (error) {
          console.error('❌ Failed to save custom objective to Supabase:', error);
          // Show error to user
          throw new Error('Failed to save to database. Changes saved locally only.');
        }
      }
      
      console.log('✅ Successfully added custom objective to lesson');
    } catch (error) {
      console.error('❌ Failed to add custom objective to lesson:', error);
      // Re-throw so calling code knows it failed
      throw error;
    }
  };

  // Remove custom objective from a lesson (store at lesson level like EYFS statements)
  const removeCustomObjectiveFromLesson = async (lessonNumber: string, objectiveId: string) => {
    try {
      console.log('🔄 Removing custom objective from lesson:', { lessonNumber, objectiveId });
      
      // Remove from lesson-level custom objectives (similar to EYFS statements)
      setAllLessonsData(prev => {
        const updatedLessonsData = { ...prev };
        if (updatedLessonsData[lessonNumber] && updatedLessonsData[lessonNumber].customObjectives) {
          const updatedObjectives = updatedLessonsData[lessonNumber].customObjectives.filter(
            id => id !== objectiveId
          );
          updatedLessonsData[lessonNumber] = {
            ...updatedLessonsData[lessonNumber],
            customObjectives: updatedObjectives,
            curriculumType: updatedObjectives.length > 0 ? 'CUSTOM' : 'EYFS'
          };
        }
        return updatedLessonsData;
      });
      
      // Save to localStorage first (this is guaranteed to work)
      const lessonData = allLessonsData[lessonNumber];
      if (lessonData && lessonData.customObjectives) {
        const updatedObjectives = lessonData.customObjectives.filter(id => id !== objectiveId);
        const dataToSave = {
          allLessonsData: {
            ...allLessonsData,
            [lessonNumber]: {
              ...lessonData,
              customObjectives: updatedObjectives,
              curriculumType: updatedObjectives.length > 0 ? 'CUSTOM' : 'EYFS'
            }
          },
          lessonNumbers,
          teachingUnits,
          lessonStandards
        };
        localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
      }
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const dataToSave = {
            allLessonsData,
            lessonNumbers,
            teachingUnits,
            lessonStandards
          };
          await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave, currentAcademicYear);
          console.log('✅ Custom objective removed from Supabase');
        } catch (error) {
          console.error('❌ Failed to save custom objective removal to Supabase:', error);
          // Show error to user
          throw new Error('Failed to save to database. Changes saved locally only.');
        }
      }
      
      console.log('✅ Successfully removed custom objective from lesson');
    } catch (error) {
      console.error('❌ Failed to remove custom objective from lesson:', error);
      // Re-throw so calling code knows it failed
      throw error;
    }
  };

  // Update all EYFS statements
  const updateNestedStandards = async (standards: Record<string, Record<string, string[]>>) => {
    setNestedStandards(standards);
    
    // Save to localStorage first
    localStorage.setItem(`nested-standards-${currentSheetInfo.sheet}`, JSON.stringify(standards));
    
    // Try to save to Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        // Convert nested structure to flat array for backward compatibility
        const flatStandards: string[] = [];
        Object.entries(standards).forEach(([area, subAreas]) => {
          Object.entries(subAreas).forEach(([subArea, standardList]) => {
            standardList.forEach(standard => {
              flatStandards.push(`${area}: ${subArea}: ${standard}`);
            });
          });
        });
        
        await eyfsApi.updateSheet(currentSheetInfo.sheet, { allStatements: flatStandards });
        console.log('Saved standards to Supabase');
      } catch (error) {
        console.warn('Failed to save standards to Supabase:', error);
      }
    }
  };

  // Add a new standard
  const addStandard = async (area: string, subArea: string, standard: string) => {
    const updatedStandards = { ...nestedStandards };
    if (!updatedStandards[area]) {
      updatedStandards[area] = {};
    }
    if (!updatedStandards[area][subArea]) {
      updatedStandards[area][subArea] = [];
    }
    if (!updatedStandards[area][subArea].includes(standard)) {
      updatedStandards[area][subArea].push(standard);
    }
    await updateNestedStandards(updatedStandards);
  };

  // Update an existing standard
  const updateStandard = async (area: string, subArea: string, oldStandard: string, newStandard: string) => {
    const updatedStandards = { ...nestedStandards };
    if (updatedStandards[area] && updatedStandards[area][subArea]) {
      const index = updatedStandards[area][subArea].indexOf(oldStandard);
      if (index !== -1) {
        updatedStandards[area][subArea][index] = newStandard;
      }
    }
    await updateNestedStandards(updatedStandards);
  };

  // Delete a standard
  const deleteStandard = async (area: string, subArea: string, standard: string) => {
    const updatedStandards = { ...nestedStandards };
    if (updatedStandards[area] && updatedStandards[area][subArea]) {
      updatedStandards[area][subArea] = updatedStandards[area][subArea].filter(s => s !== standard);
    }
    await updateNestedStandards(updatedStandards);
  };

  // Add a new sub-area
  const addSubArea = async (area: string, subArea: string) => {
    const updatedStandards = { ...nestedStandards };
    if (!updatedStandards[area]) {
      updatedStandards[area] = {};
    }
    if (!updatedStandards[area][subArea]) {
      updatedStandards[area][subArea] = [];
    }
    await updateNestedStandards(updatedStandards);
  };

  // Delete a sub-area
  const deleteSubArea = async (area: string, subArea: string) => {
    const updatedStandards = { ...nestedStandards };
    if (updatedStandards[area] && updatedStandards[area][subArea]) {
      delete updatedStandards[area][subArea];
    }
    await updateNestedStandards(updatedStandards);
  };

  // Add a new area
  const addArea = async (area: string) => {
    const updatedStandards = { ...nestedStandards };
    if (!updatedStandards[area]) {
      updatedStandards[area] = {};
    }
    await updateNestedStandards(updatedStandards);
  };

  // Delete an area
  const deleteArea = async (area: string) => {
    const updatedStandards = { ...nestedStandards };
    if (updatedStandards[area]) {
      delete updatedStandards[area];
    }
    await updateNestedStandards(updatedStandards);
  };

  // Reset standards to defaults
  const resetStandardsToDefaults = async () => {
    await updateNestedStandards(DEFAULT_NESTED_STANDARDS);
  };

  // Update lesson title
  const updateLessonTitle = async (lessonNumber: string, title: string) => {
    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          title
        };
      }
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        updatedLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        lessonStandards
      );
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        saveDataToSupabase(
          updatedLessonsData, 
          lessonNumbers, 
          teachingUnits, 
          lessonStandards
        ).catch(error => console.warn('Failed to save lesson title to Supabase:', error));
      }
      
      return updatedLessonsData;
    });
  };

  // Update lesson notes
  const updateLessonNotes = async (lessonNumber: string, notes: string) => {
    try {
      // Update the lesson plan if it exists in userCreatedLessonPlans
      const existingPlan = userCreatedLessonPlans.find(plan => plan.lessonNumber === lessonNumber);
      if (existingPlan) {
        const updatedPlan = {
          ...existingPlan,
          notes,
          updatedAt: new Date()
        };
        
        setUserCreatedLessonPlans(prev => {
          const updatedPlans = prev.map(plan => 
            plan.lessonNumber === lessonNumber ? updatedPlan : plan
          );
          
          // Save to localStorage
          localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
          
          // Try to save to Supabase if connected
          if (isSupabaseConfigured()) {
            saveUserCreatedLessonPlans(updatedPlans);
          }
          
          return updatedPlans;
        });
      }
      
      // Try to update in Supabase using the API if connected
      if (isSupabaseConfigured()) {
        try {
          await lessonsApi.updateLessonNotes(currentSheetInfo.sheet, lessonNumber, notes);
        } catch (error) {
          console.warn('Failed to update lesson notes in Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to update lesson notes:', error);
    }
  };

  // Academic Year Management Functions
  
  // Create empty year structure
  const createEmptyYearStructure = (): HalfTerm[] => [
    { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], isComplete: false, createdAt: new Date(), updatedAt: new Date() }
  ];

  // Get current year's half-term data (memoized to prevent render-time state updates)
  const getCurrentYearHalfTerms = useMemo((): HalfTerm[] => {
    if (!halfTermsByYear[currentAcademicYear]) {
      // Return empty structure without setting state during render
      return createEmptyYearStructure();
    }
    return halfTermsByYear[currentAcademicYear];
  }, [halfTermsByYear, currentAcademicYear]);

  // Initialize year data if it doesn't exist (useEffect to avoid render-time state updates)
  useEffect(() => {
    if (!halfTermsByYear[currentAcademicYear]) {
      const emptyStructure = createEmptyYearStructure();
      setHalfTermsByYear(prev => ({
        ...prev,
        [currentAcademicYear]: emptyStructure
      }));
    }
  }, [currentAcademicYear, halfTermsByYear]);

  // Get available academic years
  const getAvailableYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    
    // Generate years from 2020 to current year + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(`${year}-${year + 1}`);
    }
    
    return years.sort((a, b) => b.localeCompare(a)); // Most recent first
  };

  // Get academic year data
  const getAcademicYearData = (year: string): AcademicYearData | null => {
    const key = `${year}-${currentSheetInfo.sheet}`;
    return academicYearData[key] || null;
  };

  // Copy term data from one year to another
  const copyTermToYear = async (sourceYear: string, sourceTerm: string, targetYear: string, targetTerm: string): Promise<void> => {
    try {
      console.log('🔄 Copying term:', { sourceYear, sourceTerm, targetYear, targetTerm });
      
      const sourceKey = `${sourceYear}-${currentSheetInfo.sheet}`;
      const targetKey = `${targetYear}-${currentSheetInfo.sheet}`;
      
      // Get source data
      const sourceData = academicYearData[sourceKey];
      if (!sourceData) {
        throw new Error(`Source year ${sourceYear} data not found`);
      }
      
      // Find source half-term
      const sourceHalfTerm = sourceData.halfTerms.find(ht => ht.id === sourceTerm);
      if (!sourceHalfTerm) {
        throw new Error(`Source term ${sourceTerm} not found`);
      }
      
      // Get or create target data
      let targetData = academicYearData[targetKey];
      if (!targetData) {
        targetData = {
          year: targetYear,
          lessons: {},
          halfTerms: [...DEFAULT_HALF_TERMS],
          units: [],
          lessonStandards: {}
        };
      }
      
      // Find target half-term
      let targetHalfTerm = targetData.halfTerms.find(ht => ht.id === targetTerm);
      if (!targetHalfTerm) {
        throw new Error(`Target term ${targetTerm} not found`);
      }
      
      // Copy lessons from source to target
      const lessonsToCopy: Record<string, LessonData> = {};
      sourceHalfTerm.lessons.forEach(lessonNumber => {
        if (sourceData.lessons[lessonNumber]) {
          lessonsToCopy[lessonNumber] = sourceData.lessons[lessonNumber];
        }
      });
      
      // Update target data
      targetData.lessons = { ...targetData.lessons, ...lessonsToCopy };
      targetData.halfTerms = targetData.halfTerms.map(ht => 
        ht.id === targetTerm 
          ? { ...ht, lessons: sourceHalfTerm.lessons, isComplete: sourceHalfTerm.isComplete }
          : ht
      );
      
      // Save target data
      setAcademicYearData(prev => ({
        ...prev,
        [targetKey]: targetData
      }));
      
      // Save to localStorage
      localStorage.setItem(`academic-year-${targetKey}`, JSON.stringify(targetData));
      
      // If this is the current year, update current state
      if (targetYear === currentAcademicYear) {
        setAllLessonsData(prev => ({ ...prev, ...lessonsToCopy }));
        setHalfTerms(targetData.halfTerms);
      }
      
      console.log('✅ Term copied successfully');
    } catch (error) {
      console.error('❌ Failed to copy term:', error);
      throw error;
    }
  };

  // Activity Stack Management Functions
  const createActivityStack = (name: string, activities: Activity[], description?: string): ActivityStack => {
    const totalTime = activities.reduce((sum, activity) => sum + (activity.time || 0), 0);
    const primaryCategory = activities.length > 0 ? activities[0].category : undefined;
    
    const newStack: ActivityStack = {
      id: crypto.randomUUID(),
      name,
      activities: [...activities],
      createdAt: new Date(),
      updatedAt: new Date(),
      category: primaryCategory,
      totalTime,
      description
    };
    
    setActivityStacks(prev => [...prev, newStack]);
    
    // Save to Supabase and localStorage
    activityStacksApi.create(newStack).then(success => {
      if (success) {
        console.log('✅ Activity stack saved to Supabase');
      }
    });
    
    const savedStacks = [...activityStacks, newStack];
    localStorage.setItem('activity-stacks', JSON.stringify(savedStacks));
    
    return newStack;
  };

  const updateActivityStack = (stackId: string, updates: Partial<ActivityStack>): void => {
    setActivityStacks(prev => {
      const updated = prev.map(stack => 
        stack.id === stackId 
          ? { ...stack, ...updates, updatedAt: new Date() }
          : stack
      );
      
      // Save to Supabase and localStorage
      activityStacksApi.update(stackId, { ...updates, updatedAt: new Date() });
      localStorage.setItem('activity-stacks', JSON.stringify(updated));
      
      return updated;
    });
  };

  const deleteActivityStack = (stackId: string): void => {
    setActivityStacks(prev => {
      const filtered = prev.filter(stack => stack.id !== stackId);
      
      // Delete from Supabase and localStorage
      activityStacksApi.delete(stackId);
      localStorage.setItem('activity-stacks', JSON.stringify(filtered));
      
      return filtered;
    });
  };

  const addActivitiesToStack = (stackId: string, activities: Activity[]): void => {
    setActivityStacks(prev => {
      const updated = prev.map(stack => {
        if (stack.id === stackId) {
          const newActivities = [...stack.activities, ...activities];
          const newTotalTime = newActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);
          
          const updatedStack = {
            ...stack,
            activities: newActivities,
            totalTime: newTotalTime,
            updatedAt: new Date()
          };
          
          // Update in Supabase
          activityStacksApi.update(stackId, {
            activities: newActivities,
            totalTime: newTotalTime
          });
          
          return updatedStack;
        }
        return stack;
      });
      
      // Save to localStorage
      localStorage.setItem('activity-stacks', JSON.stringify(updated));
      
      return updated;
    });
  };

  const removeActivityFromStack = (stackId: string, activityId: string): void => {
    setActivityStacks(prev => {
      const updated = prev.map(stack => {
        if (stack.id === stackId) {
          const newActivities = stack.activities.filter(activity => 
            activity._id !== activityId && activity.id !== activityId
          );
          const newTotalTime = newActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);
          
          const updatedStack = {
            ...stack,
            activities: newActivities,
            totalTime: newTotalTime,
            updatedAt: new Date()
          };
          
          // Update in Supabase
          activityStacksApi.update(stackId, {
            activities: newActivities,
            totalTime: newTotalTime
          });
          
          return updatedStack;
        }
        return stack;
      });
      
      // Save to localStorage
      localStorage.setItem('activity-stacks', JSON.stringify(updated));
      
      return updated;
    });
  };

  const unstackActivities = (stackId: string): Activity[] => {
    const stack = activityStacks.find(s => s.id === stackId);
    if (!stack) return [];
    
    // Remove the stack
    deleteActivityStack(stackId);
    
    // Return the activities that were in the stack
    return stack.activities;
  };

  // Load stacks from localStorage on component mount
  useEffect(() => {
    const loadActivityStacks = async () => {
      try {
        // Try Supabase first
        const supabaseStacks = await activityStacksApi.getAll();
        
        if (supabaseStacks.length > 0) {
          console.log('✅ Loaded activity stacks from Supabase:', supabaseStacks.length);
          setActivityStacks(supabaseStacks);
          // Sync to localStorage as backup
          localStorage.setItem('activity-stacks', JSON.stringify(supabaseStacks));
        } else {
          // Fallback to localStorage
          const savedStacks = localStorage.getItem('activity-stacks');
          if (savedStacks) {
            const parsedStacks = JSON.parse(savedStacks).map((stack: any) => ({
              ...stack,
              createdAt: new Date(stack.createdAt),
              updatedAt: new Date(stack.updatedAt)
            }));
            setActivityStacks(parsedStacks);
            console.log('✅ Loaded activity stacks from localStorage:', parsedStacks.length);
            
            // Sync localStorage stacks to Supabase
            for (const stack of parsedStacks) {
              await activityStacksApi.create(stack);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load activity stacks:', error);
        // Fallback to localStorage
        try {
          const savedStacks = localStorage.getItem('activity-stacks');
          if (savedStacks) {
            const parsedStacks = JSON.parse(savedStacks).map((stack: any) => ({
              ...stack,
              createdAt: new Date(stack.createdAt),
              updatedAt: new Date(stack.updatedAt)
            }));
            setActivityStacks(parsedStacks);
          }
        } catch (localError) {
          console.error('Failed to load activity stacks from localStorage:', localError);
        }
      }
    };
    
    loadActivityStacks();
  }, []);

  const contextValue: DataContextType = {
    currentSheetInfo,
    setCurrentSheetInfo,
    lessonNumbers,
    teachingUnits,
    allLessonsData,
    lessonStandards,
    nestedStandards,
    loading,
    refreshData,
    uploadExcelFile,
    addStandardToLesson,
    removeStandardFromLesson,
    addCustomObjectiveToLesson,
    removeCustomObjectiveFromLesson,
    updateNestedStandards,
    addStandard,
    updateStandard,
    deleteStandard,
    addSubArea,
    deleteSubArea,
    addArea,
    deleteArea,
    resetStandardsToDefaults,
    updateLessonTitle,
    updateLessonNotes,
    userCreatedLessonPlans,
    addOrUpdateUserLessonPlan,
    updateLessonData,
    deleteUserLessonPlan,
    deleteLesson,
    allActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    units,
    updateUnit,
    deleteUnit,
    // Academic Year Management
    currentAcademicYear,
    setCurrentAcademicYear,
    getAvailableYears,
    getAcademicYearData,
    copyTermToYear,
    // halfTerms provided directly - debug log removed (was firing on every render)
    halfTerms,
    updateHalfTerm,
    getLessonsForHalfTerm,
    getTermSpecificLessonNumber,
    getLessonDisplayTitle,
    syncHalfTermsToSupabase,
    loadHalfTermsFromSupabase,
    
    // ADD: Subject Management context values
    subjects,
    subjectCategories,
    currentSubject,
    subjectsLoading,
    setCurrentSubject: handleSetCurrentSubject,
    loadSubjects,
    loadSubjectCategories,
    retryLoadSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    createSubjectCategory,
    updateSubjectCategory,
    deleteSubjectCategory,
    reorderSubjectCategories,
    toggleCategoryLock,
    toggleCategoryVisibility,
    debugSubjectSetup,
    
    // Activity Stack Management
    activityStacks,
    createActivityStack,
    updateActivityStack,
    deleteActivityStack,
    addActivitiesToStack,
    removeActivityFromStack,
    unstackActivities
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}