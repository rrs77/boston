import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { yearGroupsApi, customCategoriesApi, categoryGroupsApi } from '../config/api';

// Production logging control
const isDevelopment = import.meta.env.DEV;
const shouldLog = (level: 'debug' | 'info' | 'warn' | 'error') => {
  if (!isDevelopment && level === 'debug') return false;
  return true;
};

if (shouldLog('info')) {
console.log('🔥 NEW SettingsContextNew loaded at:', new Date().toISOString());
}

// Safari detection for enhanced sync handling
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome');
};

console.log('🔍 Browser detection:', {
  isSafari: isSafari(),
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
});

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Category {
  name: string;
  color: string;
  position: number;
  group?: string; // Optional single group name (for backward compatibility)
  groups?: string[]; // Optional multiple group names
  yearGroups: {
    LKG?: boolean;
    UKG?: boolean;
    Reception?: boolean;
    [key: string]: boolean | undefined; // Allow dynamic year group IDs
  };
}

interface UserSettings {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customTheme: boolean;
}

interface YearGroup {
  id: string;
  name: string;
  color?: string;
}

// Simple group management - just an array of group names
interface CategoryGroups {
  groups: string[];
}

interface SettingsContextType {
  getThemeForClass: (className: string) => Theme;
  getThemeForSubject: (subjectId: string) => Theme;
  categories: Category[];
  getCategoryColor: (categoryName: string) => string;
  getCategoryByName: (categoryName: string) => Category | null;
  addCategoryPermanently: (name: string, color: string) => Promise<void>;
  getSubjectCategories: () => any[];
  getCategoryColorById: (categoryId: string) => string;
  getCategoryNameById: (categoryId: string) => string;
  defaultViewMode: 'grid' | 'list' | 'compact';
  setDefaultViewMode: (mode: 'grid' | 'list' | 'compact') => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
  settings: UserSettings;
  customYearGroups: YearGroup[];
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateCategories: (newCategories: Category[]) => void;
  updateYearGroups: (newYearGroups: YearGroup[]) => void;
  deleteYearGroup: (yearGroupId: string) => Promise<void>;
  forceSyncYearGroups: () => Promise<YearGroup[] | null>;
  cleanupDuplicates: () => Promise<void>;
  forceSyncToSupabase: () => Promise<boolean>;
  forceRefreshFromSupabase: () => Promise<boolean>;
  forceSyncCurrentYearGroups: () => Promise<boolean>;
  forceSafariSync: () => Promise<boolean>;
  mapActivityLevelToYearGroup: (level: string) => string;
  mapYearGroupToActivityLevel: (yearGroupName: string) => string;
  resetToDefaults: () => void;
  resetCategoriesToDefaults: () => void;
  resetYearGroupsToDefaults: () => void;
  // Simple Category Groups
  categoryGroups: CategoryGroups;
  addCategoryGroup: (groupName: string) => void;
  removeCategoryGroup: (groupName: string) => void;
  updateCategoryGroup: (oldName: string, newName: string) => void;
  // User change management
  startUserChange: () => void;
  endUserChange: () => void;
}

const FIXED_CATEGORIES: Category[] = [
  {
    name: 'Welcome',
    color: '#10b981',
    position: 0,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Songs',
    color: '#3b82f6',
    position: 1,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Action Songs',
    color: '#f97316',
    position: 2,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Action/Games Songs',
    color: '#f59e0b',
    position: 3,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Rhythm Sticks',
    color: '#d97706',
    position: 4,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Scarf Songs',
    color: '#10b981',
    position: 5,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'General Game',
    color: '#06b6d4',
    position: 6,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Core Songs',
    color: '#84cc16',
    position: 7,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Parachute Games',
    color: '#ef4444',
    position: 8,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Percussion Games',
    color: '#06b6d4',
    position: 9,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Teaching Units',
    color: '#6366f1',
    position: 10,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Goodbye',
    color: '#14b8a6',
    position: 11,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Rhythms',
    color: '#8b5cf6',
    position: 12,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Games',
    color: '#ec4899',
    position: 13,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'IWB Games',
    color: '#f59e0b',
    position: 14,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
];

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  schoolName: 'Curriculum Designer',
  schoolLogo: '/cd-logo.svg',
  primaryColor: '#3B82F6',
  secondaryColor: '#2563EB',
  accentColor: '#60A5FA',
  customTheme: false
};

// Default year groups
const DEFAULT_YEAR_GROUPS: YearGroup[] = [
  { id: 'EYFS', name: 'EYFS', color: '#14B8A6' },
  { id: 'LKG', name: 'Lower Kindergarten', color: '#14B8A6' },
  { id: 'UKG', name: 'Upper Kindergarten', color: '#14B8A6' },
  { id: 'Reception', name: 'Reception', color: '#14B8A6' },
  { id: 'Year1', name: 'Year 1', color: '#14B8A6' },
  { id: 'Year2', name: 'Year 2', color: '#14B8A6' }
];

// Default category groups
const DEFAULT_CATEGORY_GROUPS: CategoryGroups = {
  groups: []
};

const SettingsContextNew = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContextNew);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProviderNew');
  }
  return context;
};

export const SettingsProviderNew: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>(FIXED_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [customYearGroups, setCustomYearGroups] = useState<YearGroup[]>(DEFAULT_YEAR_GROUPS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [defaultViewMode, setDefaultViewMode] = useState<
    'grid' | 'list' | 'compact'
  >('grid');
  const [isAdmin, setIsAdmin] = useState(false);

  // Global save queue and locking mechanisms to prevent race conditions
  const isSavingToSupabase = useRef(false);
  const loadingFromSupabase = useRef(false);
  const dataLoadedFromSupabase = useRef(false);
  const saveQueue = useRef<{ type: string; data: any }[]>([]);
  const saveQueueTimeout = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyLoading = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Centralized save queue processor to prevent race conditions
  const processSaveQueue = async () => {
    if (isSavingToSupabase.current || saveQueue.current.length === 0) return;
    
    isSavingToSupabase.current = true;
    if (shouldLog('debug')) {
      console.log('🔄 Processing save queue with', saveQueue.current.length, 'items');
    }
    
    const items = [...saveQueue.current];
    saveQueue.current = [];
    
    try {
      for (const item of items) {
        if (shouldLog('debug')) {
          console.log('🔄 Processing save queue item:', item.type);
        }
        
        switch (item.type) {
          case 'yearGroups':
            // Deduplicate year groups by name to prevent constraint violations
            const uniqueYearGroups = item.data.reduce((acc: any[], yearGroup: any) => {
              const existing = acc.find(yg => yg.name === yearGroup.name);
              if (!existing) {
                acc.push(yearGroup);
              }
              return acc;
            }, []);
            await yearGroupsApi.upsert(uniqueYearGroups);
            console.log('✅ Year groups saved from queue');
            break;
          case 'categories':
            // Deduplicate categories by name to prevent constraint violations
            const uniqueCategories = item.data.reduce((acc: any[], category: any) => {
              const existing = acc.find(c => c.name === category.name);
              if (!existing) {
                acc.push(category);
              }
              return acc;
            }, []);
            await customCategoriesApi.upsert(uniqueCategories);
            console.log('✅ Categories saved from queue');
            break;
          case 'categoryGroups':
            // Deduplicate category groups by name to prevent constraint violations
            const uniqueCategoryGroups = item.data.reduce((acc: any[], group: any) => {
              const existing = acc.find(g => g.name === group.name);
              if (!existing) {
                acc.push(group);
              }
              return acc;
            }, []);
            await categoryGroupsApi.upsert(uniqueCategoryGroups);
            console.log('✅ Category groups saved from queue');
            break;
          default:
            console.warn('⚠️ Unknown save queue item type:', item.type);
        }
      }
      
      console.log('✅ Save queue processing completed');
    } catch (error) {
      console.error('❌ Error processing save queue:', error);
      // Re-queue failed items
      saveQueue.current.unshift(...items);
    } finally {
      isSavingToSupabase.current = false;
      
      // Process any new items that were queued during processing
      if (saveQueue.current.length > 0) {
        setTimeout(() => processSaveQueue(), 100);
      }
    }
  };

  // Queue save function with improved batching
  const queueSave = (type: string, data: any) => {
    if (!isSupabaseConfigured()) return;
    
    // Remove any existing items of the same type to prevent duplicates
    saveQueue.current = saveQueue.current.filter(item => item.type !== type);
    
    // Add new item
    saveQueue.current.push({ type, data });
    
    if (shouldLog('debug')) {
      console.log('📝 Queued save:', type, 'Queue length:', saveQueue.current.length);
    }
    
    // Clear existing timeout and set new one for debouncing
    if (saveQueueTimeout.current) {
      clearTimeout(saveQueueTimeout.current);
    }
    
    // Increase debounce time for better batching
    saveQueueTimeout.current = setTimeout(() => {
      processSaveQueue();
    }, 1000); // 1 second debounce for better batching
  };
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroups>(DEFAULT_CATEGORY_GROUPS);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [isUserMakingChanges, setIsUserMakingChanges] = useState<boolean>(false);
  const [realTimePaused, setRealTimePaused] = useState<boolean>(false);

  useEffect(() => {
    console.log('🎯 NEW SettingsProviderNew useEffect running...');

    const savedViewMode = localStorage.getItem('defaultViewMode') as
      | 'grid'
      | 'list'
      | 'compact';
    if (savedViewMode) {
      setDefaultViewMode(savedViewMode);
    }

    // Load category groups
    const savedCategoryGroups = localStorage.getItem('category-groups');
    if (savedCategoryGroups) {
      try {
        const parsedGroups = JSON.parse(savedCategoryGroups);
        setCategoryGroups(parsedGroups);
      } catch (error) {
        console.warn('Failed to parse category groups:', error);
      }
    } else {
      // Check for old nested categories config and migrate
      const oldNestedConfig = localStorage.getItem('nested-categories-config');
      if (oldNestedConfig) {
        try {
          const oldConfig = JSON.parse(oldNestedConfig);
          if (oldConfig.groups && Array.isArray(oldConfig.groups)) {
            const migratedGroups = oldConfig.groups.map((group: any) => group.name).filter(Boolean);
            if (migratedGroups.length > 0) {
              const migratedCategoryGroups = { groups: migratedGroups };
              setCategoryGroups(migratedCategoryGroups);
              localStorage.setItem('category-groups', JSON.stringify(migratedCategoryGroups));
              console.log('🔄 Migrated old nested categories config to new simple groups:', migratedGroups);
            }
          }
          // Remove old config
          localStorage.removeItem('nested-categories-config');
        } catch (error) {
          console.warn('Failed to migrate old nested categories config:', error);
        }
      }
    }

    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);

    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('lesson-viewer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      
      const savedYearGroups = localStorage.getItem('custom-year-groups');
      if (savedYearGroups) {
        const parsed = JSON.parse(savedYearGroups);
        // Apply deduplication immediately when loading from localStorage
        const deduplicated = parsed.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        setCustomYearGroups(deduplicated);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // Load any saved categories from localStorage
    try {
      const savedCategories = localStorage.getItem('saved-categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > FIXED_CATEGORIES.length) {
          console.log(
            '📦 Loading saved categories from localStorage:',
            parsed.length
          );
          setCategories(parsed);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved categories:', error);
    }

    // Load data from Supabase if configured
    const loadFromSupabase = async () => {
      if (isSupabaseConfigured()) {
        loadingFromSupabase.current = true;
        try {
          console.log('🔄 Attempting to load year groups from Supabase...');
          
          // Enhanced Safari-specific retry logic
          const browserIsSafari = isSafari();
          const maxRetries = browserIsSafari ? 5 : 3; // More retries for Safari
          const baseDelay = browserIsSafari ? 2000 : 1000; // Longer delays for Safari
          
          let supabaseYearGroups;
          let retryCount = 0;
          
          console.log(`🌐 Browser-specific sync settings: Safari=${browserIsSafari}, maxRetries=${maxRetries}, baseDelay=${baseDelay}ms`);
          
          while (retryCount < maxRetries) {
            try {
              console.log(`🔄 Fetching year groups from Supabase (attempt ${retryCount + 1}/${maxRetries})...`);
              supabaseYearGroups = await yearGroupsApi.getAll();
              console.log(`✅ Successfully fetched ${supabaseYearGroups?.length || 0} year groups from Supabase`);
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              console.warn(`⚠️ Supabase year groups fetch attempt ${retryCount} failed:`, error);
              if (retryCount < maxRetries) {
                const delay = baseDelay * retryCount; // Exponential backoff
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                console.error(`❌ All ${maxRetries} attempts failed for year groups fetch`);
                throw error; // Final attempt failed
              }
            }
          }
          
          console.log('📦 Raw year groups from Supabase:', supabaseYearGroups);
          
          if (supabaseYearGroups && supabaseYearGroups.length > 0) {
            const formattedYearGroups = supabaseYearGroups.map(group => ({
              id: group.id,
              name: group.name,
              color: group.color
            }));
            
            // Apply deduplication by name
            const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
              arr.findIndex(g => g.name === group.name) === index
            );
            
            // Use Supabase data directly - no need to merge with localStorage
            // Supabase is the source of truth
            setCustomYearGroups(deduplicated);
            console.log('📦 Loaded year groups from Supabase:', deduplicated.length, '(deduplicated from', formattedYearGroups.length, ')');
            
            // Update localStorage to match Supabase data (use deduplicated data)
            localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
          } else {
            // No year groups in Supabase yet, load from localStorage and sync to Supabase
            console.log('📦 No year groups in Supabase, loading from localStorage...');
            const localStorageYearGroups = localStorage.getItem('custom-year-groups');
            if (localStorageYearGroups) {
              try {
                const localGroups = JSON.parse(localStorageYearGroups);
                // Filter out unwanted entries like "test" and apply deduplication
                const filteredGroups = localGroups.filter((group: any) => 
                  group.name && 
                  !group.name.toLowerCase().includes('test') &&
                  group.name.trim() !== ''
                );
                
                // Apply deduplication by name
                const deduplicatedGroups = filteredGroups.filter((group: any, index: number, arr: any[]) => 
                  arr.findIndex(g => g.name === group.name) === index
                );
                
                if (deduplicatedGroups.length > 0) {
                  setCustomYearGroups(deduplicatedGroups);
                  console.log('📦 Loaded year groups from localStorage:', deduplicatedGroups.length, '(deduplicated from', filteredGroups.length, ', filtered from', localGroups.length, ')');
                  
                  // Sync to Supabase (use deduplicated groups)
                  yearGroupsApi.upsert(deduplicatedGroups)
                    .then(() => console.log('✅ Synced filtered year groups to Supabase'))
                    .catch(error => console.warn('Failed to sync year groups to Supabase:', error));
                } else {
                  // localStorage data is empty or invalid, use defaults
                  console.log('📦 localStorage data is empty/invalid, using defaults');
                  setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                  yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                    .then(() => console.log('✅ Synced default year groups to Supabase'))
                    .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
                }
              } catch (error) {
                console.warn('Failed to parse localStorage year groups:', error);
                console.log('📦 Using default year groups due to localStorage parse error');
                setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                  .then(() => console.log('✅ Synced default year groups to Supabase'))
                  .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
              }
            } else {
              // No data anywhere, use defaults and sync to Supabase
              console.log('📦 No data anywhere, using defaults');
              setCustomYearGroups(DEFAULT_YEAR_GROUPS);
              yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                .then(() => console.log('✅ Synced default year groups to Supabase'))
                .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
            }
          }

          // Load category groups from Supabase
          console.log('🔄 Attempting to load category groups from Supabase...');
          const supabaseCategoryGroups = await categoryGroupsApi.getAll();
          console.log('📦 Raw category groups from Supabase:', supabaseCategoryGroups);
          
          if (supabaseCategoryGroups && supabaseCategoryGroups.length > 0) {
            const groupNames = supabaseCategoryGroups.map(group => group.name);
            setCategoryGroups({ groups: groupNames });
            console.log('📦 Loaded category groups from Supabase:', groupNames);
            
            // Update localStorage to match Supabase data
            localStorage.setItem('category-groups', JSON.stringify({ groups: groupNames }));
          } else {
            // No category groups in Supabase, check localStorage and sync to Supabase
            console.log('📦 No category groups in Supabase, checking localStorage...');
            const localStorageCategoryGroups = localStorage.getItem('category-groups');
            if (localStorageCategoryGroups) {
              try {
                const localGroups = JSON.parse(localStorageCategoryGroups);
                if (localGroups.groups && Array.isArray(localGroups.groups) && localGroups.groups.length > 0) {
                  setCategoryGroups(localGroups);
                  console.log('📦 Loaded category groups from localStorage:', localGroups.groups);
                  
                  // Sync to Supabase
                  try {
                    await categoryGroupsApi.upsert(localGroups.groups);
                    console.log('✅ Synced category groups from localStorage to Supabase');
                  } catch (error) {
                    console.warn('Failed to sync category groups to Supabase:', error);
                  }
                } else {
                  // Use defaults and sync to Supabase
                  setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
                  console.log('📦 Using default category groups');
                  try {
                    await categoryGroupsApi.upsert(DEFAULT_CATEGORY_GROUPS.groups);
                    console.log('✅ Synced default category groups to Supabase');
                  } catch (error) {
                    console.warn('Failed to sync default category groups to Supabase:', error);
                  }
                }
              } catch (error) {
                console.warn('Failed to parse localStorage category groups:', error);
                setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              }
            } else {
              // No data anywhere, use defaults and sync to Supabase
              setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              console.log('📦 No category groups anywhere, using defaults');
              try {
                await categoryGroupsApi.upsert(DEFAULT_CATEGORY_GROUPS.groups);
                console.log('✅ Synced default category groups to Supabase');
              } catch (error) {
                console.warn('Failed to sync default category groups to Supabase:', error);
              }
            }
          }

          // Load custom categories from Supabase
          console.log('🔄 Attempting to load categories from Supabase...');
          const supabaseCategories = await customCategoriesApi.getAll();
          console.log('📦 Raw categories from Supabase:', supabaseCategories);
          
          if (supabaseCategories && supabaseCategories.length > 0) {
            // Set loading flag to prevent save during load
            isCurrentlyLoading.current = true;
            
            const formattedCategories = supabaseCategories.map(cat => {
              // Clean old default yearGroups assignments
              let yearGroups = cat.yearGroups || {};
              
              // If category has old default assignments (all legacy keys = true), clear them
              if (yearGroups && typeof yearGroups === 'object') {
                const hasOldDefaults = 
                  yearGroups.LKG === true && 
                  yearGroups.UKG === true && 
                  yearGroups.Reception === true &&
                  Object.keys(yearGroups).length === 3;
                
                if (hasOldDefaults) {
                  console.log(`🧹 Cleaning old default yearGroups for category "${cat.name}"`);
                  yearGroups = {}; // Clear old defaults
                }
              }
              
              return {
                name: cat.name,
                color: cat.color,
                position: cat.position || 0,
                group: cat.group, // Single group (backward compatibility)
                groups: cat.groups || (cat.group ? [cat.group] : []), // Multiple groups
                yearGroups: yearGroups
              };
            });
            
            // Merge with fixed categories, but use Supabase data for any FIXED_CATEGORIES that exist in Supabase
            const mergedCategories = [...FIXED_CATEGORIES];
            
            // Update FIXED_CATEGORIES with any group assignments from Supabase
            formattedCategories.forEach(supabaseCat => {
              const fixedIndex = mergedCategories.findIndex(fixed => fixed.name === supabaseCat.name);
              if (fixedIndex >= 0) {
                // This is a FIXED_CATEGORY with group assignments from Supabase
                // Use Supabase yearGroups if they exist and are not empty, otherwise keep empty
                const yearGroups = (supabaseCat.yearGroups && Object.keys(supabaseCat.yearGroups).length > 0) 
                  ? supabaseCat.yearGroups 
                  : {}; // Ensure empty if no assignments
                
                mergedCategories[fixedIndex] = {
                  ...mergedCategories[fixedIndex],
                  group: supabaseCat.group,
                  groups: supabaseCat.groups,
                  yearGroups: yearGroups
                };
              } else {
                // This is a custom category, add it
                mergedCategories.push(supabaseCat);
              }
            });
            
            setCategories(mergedCategories);
            console.log('📦 Loaded categories from Supabase:', formattedCategories.length, 'custom categories');
            console.log('📦 Category groups mapping:', formattedCategories.map(cat => ({ name: cat.name, groups: cat.groups })));
            
            // Check if any categories were cleaned (had old defaults)
            const cleanedCount = formattedCategories.filter(cat => {
              const original = supabaseCategories.find(s => s.name === cat.name);
              if (!original || !original.yearGroups) return false;
              const hasOldDefaults = 
                original.yearGroups.LKG === true && 
                original.yearGroups.UKG === true && 
                original.yearGroups.Reception === true &&
                Object.keys(original.yearGroups).length === 3;
              return hasOldDefaults && (!cat.yearGroups || Object.keys(cat.yearGroups).length === 0);
            }).length;
            
            // If categories were cleaned, save the cleaned state back to Supabase
            if (cleanedCount > 0) {
              console.log(`💾 ${cleanedCount} categories were cleaned of old defaults - saving cleaned state to Supabase`);
              // Save cleaned categories back to Supabase to update the database
              const categoriesToSave = mergedCategories.filter(cat => {
                const isCustom = !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name);
                const hasGroupAssignments = (cat.groups && cat.groups.length > 0) || cat.group;
                const hasYearGroupAssignments = cat.yearGroups && Object.keys(cat.yearGroups).length > 0 && 
                  Object.values(cat.yearGroups).some(v => v === true);
                return isCustom || hasGroupAssignments || hasYearGroupAssignments;
              });
              
              if (categoriesToSave.length > 0) {
                const categoriesForSupabase = categoriesToSave.map(cat => ({
                  name: cat.name,
                  color: cat.color,
                  position: cat.position,
                  group: cat.group,
                  groups: cat.groups || [],
                  yearGroups: cat.yearGroups || {}
                }));
                
                // Save directly to Supabase (not through queue) to update cleaned state
                try {
                  await customCategoriesApi.upsert(categoriesForSupabase);
                  console.log('✅ Cleaned categories saved to Supabase');
                } catch (error) {
                  console.error('❌ Failed to save cleaned categories:', error);
                }
              }
            }
            
            // Update localStorage to match Supabase data
            localStorage.setItem('saved-categories', JSON.stringify(mergedCategories));
            
            // Clear loading flag after a short delay to allow state to settle
            setTimeout(() => {
              isCurrentlyLoading.current = false;
            }, 1000);
          } else {
            // No categories in Supabase, check localStorage and sync to Supabase
            console.log('📦 No categories in Supabase, checking localStorage...');
            const localStorageCategories = localStorage.getItem('saved-categories');
            if (localStorageCategories) {
              try {
                const localCategories = JSON.parse(localStorageCategories);
                // Filter out fixed categories to get only custom ones
                const customCategories = localCategories.filter((cat: any) => 
                  !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name)
                );
                
                if (customCategories.length > 0) {
                  // Sync custom categories to Supabase
                  const categoriesForSupabase = customCategories.map((cat: any) => ({
                    name: cat.name,
                    color: cat.color,
                    position: cat.position || 0,
                    group: cat.group, // Single group (backward compatibility)
                    groups: cat.groups || (cat.group ? [cat.group] : []), // Multiple groups
                    yearGroups: cat.yearGroups || {}
                  }));
                  
                  try {
                    await customCategoriesApi.upsert(categoriesForSupabase);
                    console.log('✅ Synced custom categories to Supabase:', categoriesForSupabase.length);
                  } catch (error) {
                    console.warn('Failed to sync categories to Supabase:', error);
                  }
                }
                
                // Use the full categories from localStorage
                setCategories(localCategories);
                console.log('📦 Using categories from localStorage:', localCategories.length);
              } catch (error) {
                console.warn('Failed to parse localStorage categories:', error);
                setCategories(FIXED_CATEGORIES);
                console.log('📦 Using fixed categories due to parse error');
              }
            } else {
              setCategories(FIXED_CATEGORIES);
              console.log('📦 No categories anywhere, using fixed categories');
            }
          }
        } catch (error) {
          console.error('❌ Failed to load data from Supabase:', error);
          console.error('❌ Error details for Safari debugging:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            userAgent: navigator.userAgent
          });
          
          // Enhanced fallback for Safari compatibility
          console.log('📦 Supabase failed, falling back to localStorage with Safari-safe approach...');
          
          // Try multiple localStorage keys in case of browser differences
          const possibleKeys = ['custom-year-groups', 'year-groups', 'customYearGroups'];
          let localStorageYearGroups = null;
          
          for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
              localStorageYearGroups = data;
              console.log(`📦 Found year groups in localStorage key: ${key}`);
              break;
            }
          }
          
          if (localStorageYearGroups) {
            try {
              const localGroups = JSON.parse(localStorageYearGroups);
              console.log('📦 Raw localStorage year groups:', localGroups);
              
              // Filter out unwanted entries and apply deduplication
              const filteredGroups = localGroups.filter((group: any) => 
                group && 
                group.name && 
                !group.name.toLowerCase().includes('test') &&
                group.name.trim() !== ''
              );
              
              const deduplicatedGroups = filteredGroups.filter((group: any, index: number, arr: any[]) => 
                arr.findIndex(g => g.name === group.name) === index
              );
              
              if (deduplicatedGroups.length > 0) {
                setCustomYearGroups(deduplicatedGroups);
                console.log('📦 Fallback: Loaded year groups from localStorage:', deduplicatedGroups.length, 'groups');
                console.log('📦 Fallback: Year group names:', deduplicatedGroups.map(g => g.name));
              } else {
                setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                console.log('📦 Fallback: No valid groups in localStorage, using defaults');
              }
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage fallback:', parseError);
              setCustomYearGroups(DEFAULT_YEAR_GROUPS);
              console.log('📦 Fallback: Using default year groups due to parse error');
            }
          } else {
            setCustomYearGroups(DEFAULT_YEAR_GROUPS);
            console.log('📦 Fallback: No localStorage data found, using default year groups');
          }
          
          // Fallback for categories
          const localStorageCategories = localStorage.getItem('saved-categories');
          if (localStorageCategories) {
            try {
              const localCategories = JSON.parse(localStorageCategories);
              setCategories(localCategories);
              console.log('📦 Fallback: Loaded categories from localStorage:', localCategories.length);
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage categories fallback:', parseError);
              setCategories(FIXED_CATEGORIES);
              console.log('📦 Fallback: Using fixed categories due to parse error');
            }
          } else {
            setCategories(FIXED_CATEGORIES);
            console.log('📦 Fallback: Using fixed categories (no localStorage data)');
          }
          
          // Fallback for category groups
          const localStorageCategoryGroups = localStorage.getItem('category-groups');
          if (localStorageCategoryGroups) {
            try {
              const localCategoryGroups = JSON.parse(localStorageCategoryGroups);
              setCategoryGroups(localCategoryGroups);
              console.log('📦 Fallback: Loaded category groups from localStorage:', localCategoryGroups);
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage category groups fallback:', parseError);
              setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              console.log('📦 Fallback: Using default category groups due to parse error');
            }
          } else {
            setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
            console.log('📦 Fallback: Using default category groups (no localStorage data)');
          }
        }
      }
    };

    loadFromSupabase().then(() => {
      // Set initial load to false and mark data as loaded from Supabase
      console.log('✅ loadFromSupabase completed, setting isInitialLoad to false');
      setIsInitialLoad(false);
      dataLoadedFromSupabase.current = true;
      loadingFromSupabase.current = false;
      
      // Safari-specific verification and sync
      if (isSafari()) {
        console.log('🍎 Safari detected - performing additional verification...');
        setTimeout(async () => {
          try {
            console.log('🔍 Safari: Verifying data consistency...');
            const verificationYearGroups = await yearGroupsApi.getAll();
            const verificationCategories = await customCategoriesApi.getAll();
            
            console.log('🔍 Safari verification results:', {
              yearGroups: verificationYearGroups?.length || 0,
              categories: verificationCategories?.length || 0,
              currentYearGroups: customYearGroups.length,
              currentCategories: categories.length
            });
            
            // If there's a mismatch, force a refresh
            if (verificationYearGroups && verificationYearGroups.length !== customYearGroups.length) {
              console.log('⚠️ Safari: Data mismatch detected, forcing refresh...');
              await forceRefreshFromSupabase();
            }
          } catch (error) {
            console.warn('⚠️ Safari verification failed:', error);
          }
        }, 2000); // Wait 2 seconds after initial load
      }
    }).catch((error) => {
      console.error('❌ loadFromSupabase failed:', error);
      // Even if loading fails, we need to allow saving
      console.log('⚠️ Setting isInitialLoad to false despite load failure');
      setIsInitialLoad(false);
      dataLoadedFromSupabase.current = true; // Allow saves even if load failed
      loadingFromSupabase.current = false;
    });

    // Fallback timeout to ensure isInitialLoad is set to false
    setTimeout(() => {
      if (isInitialLoad) {
        console.log('⏰ Timeout fallback: Setting isInitialLoad to false');
        setIsInitialLoad(false);
        dataLoadedFromSupabase.current = true; // Allow saves even after timeout
        loadingFromSupabase.current = false;
      }
    }, 5000); // 5 second timeout

    // DISABLED: Force sync any local changes to Supabase after loading
    // This function was causing race conditions and overwriting data from Supabase
    const syncLocalChangesToSupabase = async () => {
      console.log('🚫 syncLocalChangesToSupabase DISABLED - was causing race conditions');
      console.log('🚫 Data should already be current from initial load');
      return; // Exit immediately
    };

    // Note: syncLocalChangesToSupabase is disabled to prevent race conditions

    // Set up real-time subscriptions for year groups and categories
    let yearGroupsChannel: any = null;
    let categoriesChannel: any = null;
    let categoryGroupsChannel: any = null;
    let syncInterval: NodeJS.Timeout | null = null;
    
    if (isSupabaseConfigured()) {
      console.log('🔄 Setting up real-time subscriptions for year groups and categories...');
      
      // Enhanced sync function with timestamp tracking
      const syncYearGroups = async (source: string = 'unknown') => {
        try {
          console.log(`🔄 Syncing year groups from ${source}...`);
          const newYearGroups = await yearGroupsApi.getAll();
          const formattedYearGroups = newYearGroups.map(group => ({
            id: group.id,
            name: group.name,
            color: group.color
          }));
          
          // Apply deduplication
          const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
            arr.findIndex(g => g.name === group.name) === index
          );
          
          console.log(`📡 Updated year groups from ${source}:`, deduplicated);
          setCustomYearGroups(deduplicated);
          setLastSyncTimestamp(Date.now());
          
          // Update localStorage to match
          localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
          return deduplicated;
        } catch (error) {
          console.error(`❌ Failed to sync year groups from ${source}:`, error);
          return null;
        }
      };
      
      // Real-time subscriptions removed to prevent race conditions
      // Using visibility change detection and queue-based saves instead
      console.log('✅ Real-time subscriptions disabled - using queue-based sync instead');
    }

    console.log(
      '✅ NEW SettingsContext loaded with',
      categories.length,
      'categories'
    );

    // Cleanup function
    return () => {
      if (yearGroupsChannel) {
        console.log('🧹 Cleaning up year groups real-time subscription...');
        supabase.removeChannel(yearGroupsChannel);
      }
      if (categoriesChannel) {
        console.log('🧹 Cleaning up categories real-time subscription...');
        supabase.removeChannel(categoriesChannel);
      }
      if (categoryGroupsChannel) {
        console.log('🧹 Cleaning up category groups real-time subscription...');
        supabase.removeChannel(categoryGroupsChannel);
      }
      if (syncInterval) {
        console.log('🧹 Cleaning up sync intervals...');
        clearInterval(syncInterval);
      }
    };
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);
  
  // Save year groups using queue-based system to prevent race conditions
  useEffect(() => {
    console.log('🔄 Year groups useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'customYearGroups length:', customYearGroups.length);
    
    // Don't save if data hasn't loaded from Supabase yet
    if (!dataLoadedFromSupabase.current) {
      console.log('⏭️ Skipping year groups save - data not loaded from Supabase yet');
      return;
    }
    
    // Don't save while loading from Supabase
    if (loadingFromSupabase.current) {
      console.log('⏭️ Skipping year groups save - currently loading from Supabase');
      return;
    }
    
    // Save to localStorage immediately
      localStorage.setItem('custom-year-groups', JSON.stringify(customYearGroups));
    console.log('💾 Year groups saved to localStorage');
    
    // Queue Supabase save
    queueSave('yearGroups', customYearGroups);
  }, [customYearGroups]);

  // Save categories using queue-based system to prevent race conditions
  useEffect(() => {
    console.log('🔄 Categories useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'isCurrentlyLoading:', isCurrentlyLoading.current, 'categories length:', categories.length);
    
    // Don't save if data hasn't loaded from Supabase yet
    if (!dataLoadedFromSupabase.current) {
      console.log('⏭️ Skipping categories save - data not loaded from Supabase yet');
      return;
    }
    
    // Don't save while loading from Supabase
    if (loadingFromSupabase.current) {
      console.log('⏭️ Skipping categories save - currently loading from Supabase');
      return;
    }
    
    // Don't save while currently loading (prevents race conditions during initial load)
    if (isCurrentlyLoading.current) {
      console.log('⏭️ Skipping categories save - currently loading categories');
      return;
    }
    
    // Save to localStorage immediately
    localStorage.setItem('saved-categories', JSON.stringify(categories));
    console.log('💾 Categories saved to localStorage');
    
    // Filter categories for Supabase save
    // Save ALL categories that have:
    // 1. Custom categories (not in FIXED_CATEGORIES)
    // 2. Categories with group assignments
    // 3. Categories with yearGroups assignments (to preserve user's year group assignments)
    const categoriesToSave = categories.filter(cat => {
      const isCustom = !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name);
      const hasGroupAssignments = (cat.groups && cat.groups.length > 0) || cat.group;
      const hasYearGroupAssignments = cat.yearGroups && Object.keys(cat.yearGroups).length > 0 && 
        Object.values(cat.yearGroups).some(v => v === true);
      
      const shouldSave = isCustom || hasGroupAssignments || hasYearGroupAssignments;
      
      // Debug logging for first few categories
      if (categories.indexOf(cat) < 5) {
        console.log(`🔍 Category "${cat.name}":`, {
          isCustom,
          hasGroupAssignments,
          hasYearGroupAssignments,
          yearGroups: cat.yearGroups,
          shouldSave
        });
      }
      
      return shouldSave;
    });
    
    console.log('💾 Categories save filter results:', {
      totalCategories: categories.length,
      categoriesToSave: categoriesToSave.length,
      categoriesWithYearGroups: categoriesToSave.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0).length,
      categoriesExcluded: categories.length - categoriesToSave.length,
      sampleYearGroups: categoriesToSave.slice(0, 5).map(c => ({ 
        name: c.name, 
        yearGroups: c.yearGroups,
        hasYearGroups: !!(c.yearGroups && Object.keys(c.yearGroups).length > 0)
      }))
    });
    
    if (categoriesToSave.length > 0) {
      const categoriesForSupabase = categoriesToSave.map(cat => ({
        name: cat.name,
        color: cat.color,
        position: cat.position,
        group: cat.group,
        groups: cat.groups || [],
        yearGroups: cat.yearGroups || {} // Preserve yearGroups assignments
      }));
      
      console.log('💾 Queueing categories save to Supabase:', {
        count: categoriesForSupabase.length,
        sample: categoriesForSupabase.slice(0, 3).map(c => ({ name: c.name, yearGroups: c.yearGroups }))
      });
      
      // Queue Supabase save
      queueSave('categories', categoriesForSupabase);
    } else {
      console.warn('⚠️ No categories to save - all categories were filtered out!');
    }
  }, [categories]);

  // Save category groups using queue-based system to prevent race conditions
  useEffect(() => {
    console.log('🔄 Category groups useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'categoryGroups length:', categoryGroups.groups.length);
    
    // Don't save if data hasn't loaded from Supabase yet
    if (!dataLoadedFromSupabase.current) {
      console.log('⏭️ Skipping category groups save - data not loaded from Supabase yet');
      return;
    }
    
    // Don't save while loading from Supabase
    if (loadingFromSupabase.current) {
      console.log('⏭️ Skipping category groups save - currently loading from Supabase');
      return;
    }
    
    // Don't save empty arrays to prevent infinite loop
    if (!categoryGroups.groups || categoryGroups.groups.length === 0) {
      console.log('🚨 Skipping save of empty category groups to prevent infinite loop');
      return;
    }
    
    // Save to localStorage immediately
    localStorage.setItem('category-groups', JSON.stringify(categoryGroups));
    console.log('💾 Category groups saved to localStorage');
    
    // Queue Supabase save
    queueSave('categoryGroups', categoryGroups.groups);
  }, [categoryGroups]);

  // Visibility change handler for cross-browser sync (debounced)
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    let lastVisibilityChange = 0;
    
    const handleVisibilityChange = async () => {
      const now = Date.now();
      
      // Debounce visibility changes - only process if it's been at least 5 seconds since last change
      if (now - lastVisibilityChange < 5000) {
        console.log('👁️ Skipping visibility change - too recent');
        return;
      }
      
      if (document.visibilityState === 'visible' && 
          !loadingFromSupabase.current && 
          !isSavingToSupabase.current &&
          dataLoadedFromSupabase.current) {
        
        lastVisibilityChange = now;
        console.log('👁️ Page became visible - checking for data sync...');
        
        // Clear any pending visibility timeout
        clearTimeout(visibilityTimeout);
        
        // Debounce the actual reload operation
        visibilityTimeout = setTimeout(async () => {
          // Wait for any pending saves to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Only reload if we're not currently saving
          if (!isSavingToSupabase.current) {
            console.log('🔄 Reloading data from Supabase due to visibility change...');
            loadingFromSupabase.current = true;
            
            try {
              // Reload year groups
              const yearGroups = await yearGroupsApi.getAll();
              if (yearGroups && yearGroups.length > 0) {
                const formatted = yearGroups.map(group => ({
                  id: group.id,
                  name: group.name,
                  color: group.color
                }));
                setCustomYearGroups(formatted);
                console.log('✅ Year groups reloaded from visibility change');
              }
              
              // Reload categories
              const categories = await customCategoriesApi.getAll();
              if (categories && categories.length > 0) {
                // Merge with existing categories
                setCategories(prev => {
                  const merged = [...prev];
                  categories.forEach(supabaseCat => {
                    const existingIndex = merged.findIndex(cat => cat.name === supabaseCat.name);
                    if (existingIndex >= 0) {
                      // Update existing category with Supabase data
                      merged[existingIndex] = {
                        ...merged[existingIndex],
                        group: supabaseCat.group,
                        groups: supabaseCat.groups || []
                      };
                    }
                  });
                  return merged;
                });
                console.log('✅ Categories reloaded from visibility change');
              }
    } catch (error) {
              console.warn('⚠️ Error reloading data from visibility change:', error);
            } finally {
              loadingFromSupabase.current = false;
            }
          }
        }, 2000); // 2 second delay to allow for rapid tab switches
      }
    };

    const handleFocus = () => {
      // Focus events are less frequent, so no debouncing needed
      handleVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const updateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    // Supabase save is now handled automatically in the useEffect hook
  };

  // Functions to manage user change state
  const startUserChange = () => {
    setIsUserMakingChanges(true);
    setRealTimePaused(true);
    console.log('🔄 User started making changes - pausing real-time sync');
  };

  const endUserChange = () => {
    setTimeout(() => {
      setIsUserMakingChanges(false);
      setRealTimePaused(false);
      console.log('✅ User finished making changes - resuming real-time sync');
    }, 5000); // 5-second buffer after user finishes
  };
  
  const updateYearGroups = (newYearGroups: YearGroup[]) => {
    console.log('🔄 updateYearGroups called with:', newYearGroups);
    setCustomYearGroups(newYearGroups);
    // Supabase save is now handled automatically in the useEffect hook
  };

  // Manual sync function to force refresh from Supabase
  const forceSyncYearGroups = async () => {
    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Manual sync: Fetching year groups from Supabase...');
        const supabaseYearGroups = await yearGroupsApi.getAll();
        const formattedYearGroups = supabaseYearGroups.map(group => ({
          id: group.id,
          name: group.name,
          color: group.color
        }));
        
        const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        
        console.log('🔄 Manual sync: Updating year groups from Supabase:', deduplicated);
        setCustomYearGroups(deduplicated);
        localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
        
        return deduplicated;
      } catch (error) {
        console.error('❌ Manual sync failed:', error);
        return null;
      }
    }
    return null;
  };

  const deleteYearGroup = async (yearGroupId: string) => {
    try {
      console.log('🗑️ Deleting year group:', yearGroupId);
      
      // Remove from local state
      setCustomYearGroups(prev => prev.filter(group => group.id !== yearGroupId));
      
      // Delete from Supabase if configured
      if (isSupabaseConfigured()) {
        // Since we use names as IDs in frontend but UUIDs in database,
        // we need to find the UUID by name
        const { data: existingGroups } = await supabase
          .from(TABLES.YEAR_GROUPS)
          .select('id, name')
          .eq('name', yearGroupId);
        
        if (existingGroups && existingGroups.length > 0) {
          for (const group of existingGroups) {
            await supabase
              .from(TABLES.YEAR_GROUPS)
              .delete()
              .eq('id', group.id);
          }
          console.log('✅ Deleted year group from Supabase');
        }
      }
      
      // Update localStorage
      localStorage.setItem('custom-year-groups', JSON.stringify(
        customYearGroups.filter(group => group.id !== yearGroupId)
      ));
      
    } catch (error) {
      console.error('❌ Failed to delete year group:', error);
      throw error;
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('lesson-viewer-settings');
  };
  
  const resetCategoriesToDefaults = () => {
    setCategories(FIXED_CATEGORIES);
    localStorage.removeItem('saved-categories');
  };
  
  const resetYearGroupsToDefaults = () => {
    setCustomYearGroups(DEFAULT_YEAR_GROUPS);
    localStorage.removeItem('custom-year-groups');
  };

  const saveCategoryToSupabase = async (name: string, color: string) => {
    console.log('💾 NEW: Starting Supabase save for:', name);

    try {
      // Find or create Music subject
      let { data: subjects, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', 'Music')
        .single();

      if (subjectError || !subjects) {
        console.log('📝 NEW: Creating Music subject...');
        const { data: newSubject, error: createError } = await supabase
          .from('subjects')
          .insert([
            {
              name: 'Music',
              description: 'Music education activities',
              color: '#3b82f6',
              is_active: true,
            },
          ])
          .select('id')
          .single();

        if (createError) {
          console.error('❌ NEW: Subject creation failed:', createError);
          throw createError;
        }
        subjects = newSubject;
      }

      console.log('🎯 NEW: Using subject ID:', subjects.id);

      // Save the category
      const { data, error } = await supabase
        .from('subject_categories')
        .insert([
          {
            subject_id: subjects.id,
            name: name,
            color: color,
            sort_order: categories.length,
            is_locked: false,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ NEW: Category save failed:', error);
        throw error;
      }

      console.log('✅ NEW: Category saved to Supabase successfully!');
      return data;
    } catch (error) {
      console.error('❌ NEW: Supabase save error:', error);
      throw error;
    }
  };

  const addCategoryPermanently = async (name: string, color: string) => {
    console.log('🚀 NEW: Adding category permanently:', name);

    try {
      // Save to Supabase first
      await saveCategoryToSupabase(name, color);

      // Create new category object
      const newCategory: Category = {
        name,
        color,
        position: categories.length,
        yearGroups: {}, // Empty - must be explicitly assigned in settings
      };

      // Update state
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Save to localStorage
      localStorage.setItem(
        'saved-categories',
        JSON.stringify(updatedCategories)
      );

      console.log('🎉 NEW: Category added permanently and saved!');
      alert(`✅ NEW VERSION: Category "${name}" saved permanently!`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('❌ NEW: Failed to add category:', error);
      alert(`❌ NEW VERSION: Failed to save category: ${errorMessage}`);
    }
  };

  const getThemeForClass = (className: string): Theme => {
    // If custom theme is enabled, use user's custom colors
    if (settings.customTheme) {
      return {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        accent: settings.accentColor,
      };
    }

    // Map class names to year group names
    const classToYearGroupMap: Record<string, string> = {
      'LKG': 'Lower Kindergarten Music',
      'UKG': 'Upper Kindergarten Music',
      'Reception': 'Reception Music'
    };

    // Find the custom year group by ID or mapped name
    const yearGroup = customYearGroups.find(group => 
      group.id === className || 
      group.name === className ||
      group.name === classToYearGroupMap[className]
    );
    
    if (yearGroup && yearGroup.color) {
      // If the year group has a custom color, use it
      return {
        primary: yearGroup.color,
        secondary: adjustColor(yearGroup.color, -20),
        accent: adjustColor(yearGroup.color, 20),
      };
    }

    // Default teal theme
    return {
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#2DD4BF',
    };
  };

  // Manual sync function to force save to Supabase
  const forceSyncToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot sync');
      return false;
    }

    try {
      console.log('🔄 Force syncing settings to Supabase...');
      
      // Sync year groups
      const yearGroupsSuccess = await yearGroupsApi.upsert(customYearGroups)
        .then(() => {
          console.log('✅ Year groups synced to Supabase');
          return true;
        })
        .catch(error => {
          console.error('❌ Failed to sync year groups:', error);
          return false;
        });

      // Sync categories
      const customCategories = categories.filter(cat => 
        !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name)
      );
      
      let categoriesSuccess = true;
      if (customCategories.length > 0) {
        const categoriesForSupabase = customCategories.map(cat => ({
          name: cat.name,
          color: cat.color,
          position: cat.position,
          group: cat.group,                    // Single group (backward compatibility)
          groups: cat.groups || [],           // Multiple groups
          yearGroups: cat.yearGroups          // Correct field name
        }));
        
        categoriesSuccess = await customCategoriesApi.upsert(categoriesForSupabase)
          .then(() => {
            console.log('✅ Categories synced to Supabase');
            return true;
          })
          .catch(error => {
            console.error('❌ Failed to sync categories:', error);
            return false;
          });
      }

      const allSuccess = yearGroupsSuccess && categoriesSuccess;
      if (allSuccess) {
        console.log('✅ All settings synced to Supabase successfully');
      } else {
        console.warn('⚠️ Some settings failed to sync to Supabase');
      }
      
      return allSuccess;
    } catch (error) {
      console.error('❌ Failed to force sync to Supabase:', error);
      return false;
    }
  };

  // Manual refresh function to load data from Supabase
  const forceRefreshFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot refresh');
      return false;
    }

    // Prevent multiple simultaneous refresh operations
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, skipping...');
      return false;
    }

    setIsRefreshing(true);

    try {
      const browserIsSafari = isSafari();
      console.log(`🔄 Force refreshing settings from Supabase... (Browser: ${browserIsSafari ? 'Safari' : 'Other'})`);
      
      // Enhanced Safari-specific refresh with retry logic
      const maxRetries = browserIsSafari ? 3 : 1;
      const baseDelay = browserIsSafari ? 1500 : 500;
      
      let supabaseYearGroups;
      let retryCount = 0;
      
      // Refresh year groups with Safari-specific retry logic
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Fetching year groups from Supabase (refresh attempt ${retryCount + 1}/${maxRetries})...`);
          supabaseYearGroups = await yearGroupsApi.getAll();
          console.log(`✅ Successfully refreshed ${supabaseYearGroups?.length || 0} year groups from Supabase`);
          break;
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Year groups refresh attempt ${retryCount} failed:`, error);
          if (retryCount < maxRetries) {
            const delay = baseDelay * retryCount;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`❌ All ${maxRetries} year groups refresh attempts failed`);
            throw error;
          }
        }
      }
      if (supabaseYearGroups && supabaseYearGroups.length > 0) {
        const formattedYearGroups = supabaseYearGroups.map(group => ({
          id: group.id,
          name: group.name,
          color: group.color
        }));
        
        const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        
        setCustomYearGroups(deduplicated);
        localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
        console.log('✅ Year groups refreshed from Supabase:', deduplicated.length);
      }

      // Refresh categories
      const supabaseCategories = await customCategoriesApi.getAll();
      if (supabaseCategories && supabaseCategories.length > 0) {
        const formattedCategories = supabaseCategories.map((cat: any) => {
          // Clean old default yearGroups assignments
          let yearGroups = cat.yearGroups || {};
          
          // If category has old default assignments (all legacy keys = true), clear them
          if (yearGroups && typeof yearGroups === 'object') {
            const hasOldDefaults = 
              yearGroups.LKG === true && 
              yearGroups.UKG === true && 
              yearGroups.Reception === true &&
              Object.keys(yearGroups).length === 3;
            
            if (hasOldDefaults) {
              console.log(`🧹 Cleaning old default yearGroups for category "${cat.name}"`);
              yearGroups = {}; // Clear old defaults
            }
          }
          
          return {
            name: cat.name,
            color: cat.color,
            position: cat.position || 0,
            group: cat.group, // Single group (backward compatibility)
            groups: cat.groups || (cat.group ? [cat.group] : []), // Multiple groups
            yearGroups: yearGroups // Cleaned yearGroups
          };
        });
        
        // Merge with fixed categories, but use Supabase data for any FIXED_CATEGORIES that exist in Supabase
        const mergedCategories = [...FIXED_CATEGORIES];
        
        // Update FIXED_CATEGORIES with any group assignments from Supabase
        formattedCategories.forEach(supabaseCat => {
          const fixedIndex = mergedCategories.findIndex(fixed => fixed.name === supabaseCat.name);
          if (fixedIndex >= 0) {
            // This is a FIXED_CATEGORY with group assignments from Supabase
            // Use Supabase yearGroups if they exist and are not empty, otherwise keep empty
            const yearGroups = (supabaseCat.yearGroups && Object.keys(supabaseCat.yearGroups).length > 0) 
              ? supabaseCat.yearGroups 
              : {}; // Ensure empty if no assignments
            
            mergedCategories[fixedIndex] = {
              ...mergedCategories[fixedIndex],
              group: supabaseCat.group,
              groups: supabaseCat.groups,
              yearGroups: yearGroups
            };
          } else {
            // This is a custom category, add it
            mergedCategories.push(supabaseCat);
          }
        });
        
        setCategories(mergedCategories);
        localStorage.setItem('saved-categories', JSON.stringify(mergedCategories));
        console.log('✅ Categories refreshed from Supabase:', formattedCategories.length);
      }

      // Refresh category groups
      const supabaseCategoryGroups = await categoryGroupsApi.getAll();
      if (supabaseCategoryGroups && supabaseCategoryGroups.length > 0) {
        const groupNames = supabaseCategoryGroups.map(group => group.name);
        setCategoryGroups({ groups: groupNames });
        localStorage.setItem('category-groups', JSON.stringify({ groups: groupNames }));
        console.log('✅ Category groups refreshed from Supabase:', groupNames);
      }
      
      console.log('✅ All settings refreshed from Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh from Supabase:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // New function to force sync current year groups to Supabase (for Safari issues)
  const forceSyncCurrentYearGroups = async () => {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured - cannot sync');
      return false;
    }

    try {
      console.log('🔄 Force syncing current year groups to Supabase...');
      console.log('📦 Current year groups to sync:', customYearGroups);
      
      if (customYearGroups && customYearGroups.length > 0) {
        await yearGroupsApi.upsert(customYearGroups);
        console.log('✅ Successfully synced current year groups to Supabase');
        return true;
      } else {
        console.log('⚠️ No year groups to sync');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to sync current year groups to Supabase:', error);
      return false;
    }
  };

  // Safari-specific sync function with enhanced retry logic
  const forceSafariSync = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot sync');
      return false;
    }

    const browserIsSafari = isSafari();
    if (!browserIsSafari) {
      console.log('ℹ️ Not Safari browser, using standard sync...');
      return await forceRefreshFromSupabase();
    }

    console.log('🍎 Safari-specific sync initiated...');
    
    try {
      // Step 1: Clear any cached data
      console.log('🧹 Clearing Safari cache...');
      if (typeof Storage !== 'undefined') {
        try {
          localStorage.removeItem('year-groups-cache');
          localStorage.removeItem('categories-cache');
          console.log('✅ Safari cache cleared');
        } catch (e) {
          console.warn('⚠️ Could not clear Safari cache:', e);
        }
      }

      // Step 2: Force refresh with multiple attempts
      console.log('🔄 Safari: Force refreshing with enhanced retry logic...');
      let refreshSuccess = false;
      const maxRefreshAttempts = 3;
      
      for (let attempt = 1; attempt <= maxRefreshAttempts; attempt++) {
        try {
          console.log(`🍎 Safari sync attempt ${attempt}/${maxRefreshAttempts}...`);
          refreshSuccess = await forceRefreshFromSupabase();
          if (refreshSuccess) {
            console.log(`✅ Safari sync attempt ${attempt} succeeded`);
            break;
          }
        } catch (error) {
          console.warn(`⚠️ Safari sync attempt ${attempt} failed:`, error);
          if (attempt < maxRefreshAttempts) {
            const delay = 2000 * attempt; // Increasing delay
            console.log(`⏳ Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Step 3: Verify the sync worked
      if (refreshSuccess) {
        console.log('🔍 Safari: Verifying sync results...');
        try {
          const verificationYearGroups = await yearGroupsApi.getAll();
          const verificationCategories = await customCategoriesApi.getAll();
          
          console.log('🔍 Safari sync verification:', {
            yearGroups: verificationYearGroups?.length || 0,
            categories: verificationCategories?.length || 0,
            localYearGroups: customYearGroups.length,
            localCategories: categories.length
          });
          
          return true;
        } catch (error) {
          console.warn('⚠️ Safari sync verification failed:', error);
          return false;
        }
      } else {
        console.error('❌ All Safari sync attempts failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Safari sync failed:', error);
      return false;
    }
  };

  // Helper function to clean up duplicates in the database
  const cleanupDuplicates = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      console.log('🧹 Cleaning up duplicate year groups in database...');
      const allGroups = await yearGroupsApi.getAll();
      
      // Group by name and keep only the first occurrence
      const uniqueGroups = allGroups.reduce((acc: any[], group: any) => {
        const existing = acc.find(g => g.name === group.name);
        if (!existing) {
          acc.push(group);
        }
        return acc;
      }, []);
      
      if (uniqueGroups.length !== allGroups.length) {
        console.log(`🧹 Found ${allGroups.length - uniqueGroups.length} duplicates, cleaning up...`);
        
        // Delete all existing year groups
        await supabase.from(TABLES.YEAR_GROUPS).delete().neq('id', '');
        
        // Re-insert only unique groups
        if (uniqueGroups.length > 0) {
          await yearGroupsApi.upsert(uniqueGroups);
        }
        
        console.log('✅ Database cleanup completed');
      } else {
        console.log('✅ No duplicates found in database');
      }
    } catch (error) {
      console.error('❌ Failed to cleanup duplicates:', error);
    }
  };

  // Helper function to map old activity level names to new year group names
  const mapActivityLevelToYearGroup = (level: string): string => {
    // Create a mapping from old names to new names
    const levelMapping: Record<string, string> = {
      'LKG': 'Lower Kindergarten Music',
      'UKG': 'Upper Kindergarten Music',
      'Reception': 'Reception Music',
      'EYFS U': 'Upper Kindergarten Music', // Handle this legacy case too
      'EYFS L': 'Lower Kindergarten Music',  // Handle this legacy case too
      'Lower Kindergarten': 'Lower Kindergarten Music', // Handle transition period
      'Upper Kindergarten': 'Upper Kindergarten Music' // Handle transition period
    };
    
    // If it's already a full name, return as is
    if (customYearGroups.some(group => group.name === level)) {
      return level;
    }
    
    // If it's a short name, map to full name
    if (levelMapping[level]) {
      return levelMapping[level];
    }
    
    // If no mapping found, return original
    return level;
  };

  // Helper function to map year group names back to activity level names
  const mapYearGroupToActivityLevel = (yearGroupName: string): string => {
    // Create reverse mapping from new names to old names for backward compatibility
    const reverseMapping: Record<string, string> = {
      'Lower Kindergarten Music': 'LKG',
      'Upper Kindergarten Music': 'UKG',
      'Reception Music': 'Reception'
    };
    
    return reverseMapping[yearGroupName] || yearGroupName;
  };

  // Helper function to adjust a color's brightness
  const adjustColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Adjust RGB values
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getThemeForSubject = (subjectId: string): Theme => {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#1d4ed8',
    };
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryByName = (categoryName: string): Category | null => {
    return categories.find((cat) => cat.name === categoryName) || null;
  };

  const getSubjectCategories = () => {
    return categories.map((cat, index) => ({
      id: `fixed-${index}`,
      name: cat.name,
      color: cat.color,
      description: '',
      is_locked: false,
      is_active: true,
      sort_order: cat.position,
    }));
  };

  const getCategoryColorById = (categoryId: string): string => {
    return '#6b7280';
  };

  const getCategoryNameById = (categoryId: string): string => {
    return 'Unknown Category';
  };

  const handleSetDefaultViewMode = (mode: 'grid' | 'list' | 'compact') => {
    setDefaultViewMode(mode);
    localStorage.setItem('defaultViewMode', mode);
  };

  const handleSetIsAdmin = (admin: boolean) => {
    setIsAdmin(admin);
    localStorage.setItem('isAdmin', admin.toString());
  };

  // DUPLICATE useEffect REMOVED - This was causing the infinite loop!
  // The category groups save logic is handled in the useEffect above (line 932)

  const addCategoryGroup = async (groupName: string) => {
    if (!categoryGroups.groups.includes(groupName)) {
      const updatedGroups = {
        ...categoryGroups,
        groups: [...categoryGroups.groups, groupName]
      };
      setCategoryGroups(updatedGroups);
      localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
      
      // Also save to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await categoryGroupsApi.upsert(updatedGroups.groups);
          console.log('✅ Category group added and saved to Supabase:', groupName);
        } catch (error) {
          console.error('❌ Failed to save category group to Supabase:', error);
        }
      }
    }
  };

  const removeCategoryGroup = async (groupName: string) => {
    const updatedGroups = {
      ...categoryGroups,
      groups: categoryGroups.groups.filter(g => g !== groupName)
    };
    setCategoryGroups(updatedGroups);
    localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
    
    // Also save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await categoryGroupsApi.upsert(updatedGroups.groups);
        console.log('✅ Category group removed and saved to Supabase:', groupName);
      } catch (error) {
        console.error('❌ Failed to save category group removal to Supabase:', error);
      }
    }
    
    // Remove group from all categories that have it (both single group and multiple groups)
    const updatedCategories = categories.map(cat => {
      // Handle single group field (backward compatibility)
      if (cat.group === groupName) {
        return { ...cat, group: undefined };
      }
      
      // Handle multiple groups field (new functionality)
      if (cat.groups && cat.groups.includes(groupName)) {
        const newGroups = cat.groups.filter(g => g !== groupName);
        return { 
          ...cat, 
          groups: newGroups.length > 0 ? newGroups : undefined 
        };
      }
      
      return cat;
    });
    updateCategories(updatedCategories);
  };

  const updateCategoryGroup = async (oldName: string, newName: string) => {
    const updatedGroups = {
      ...categoryGroups,
      groups: categoryGroups.groups.map(g => g === oldName ? newName : g)
    };
    setCategoryGroups(updatedGroups);
    localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
    
    // Also save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await categoryGroupsApi.upsert(updatedGroups.groups);
        console.log('✅ Category group updated and saved to Supabase:', oldName, '->', newName);
      } catch (error) {
        console.error('❌ Failed to save category group update to Supabase:', error);
      }
    }
    
    // Update group name in all categories that have it (both single group and multiple groups)
    const updatedCategories = categories.map(cat => {
      // Handle single group field (backward compatibility)
      if (cat.group === oldName) {
        return { ...cat, group: newName };
      }
      
      // Handle multiple groups field (new functionality)
      if (cat.groups && cat.groups.includes(oldName)) {
        return { 
          ...cat, 
          groups: cat.groups.map(g => g === oldName ? newName : g)
        };
      }
      
      return cat;
    });
    updateCategories(updatedCategories);
  };

  const contextValue: SettingsContextType = {
    getThemeForClass,
    getThemeForSubject,
    categories,
    getCategoryColor,
    getCategoryByName,
    addCategoryPermanently,
    getSubjectCategories,
    getCategoryColorById,
    getCategoryNameById,
    defaultViewMode,
    setDefaultViewMode: handleSetDefaultViewMode,
    isAdmin,
    setIsAdmin: handleSetIsAdmin,
    settings,
    customYearGroups,
    updateSettings,
    updateCategories,
    updateYearGroups,
    deleteYearGroup,
    forceSyncYearGroups,
    cleanupDuplicates,
    forceSyncToSupabase,
    forceRefreshFromSupabase,
    forceSyncCurrentYearGroups,
    forceSafariSync,
    mapActivityLevelToYearGroup,
    mapYearGroupToActivityLevel,
    resetToDefaults,
    resetCategoriesToDefaults,
    resetYearGroupsToDefaults,
    // Simple Category Groups
    categoryGroups,
    addCategoryGroup,
    removeCategoryGroup,
    updateCategoryGroup,
    // User change management
    startUserChange,
    endUserChange
  };

  return (
    <SettingsContextNew.Provider value={contextValue}>
      {children}
    </SettingsContextNew.Provider>
  );
};

export default SettingsProviderNew;
