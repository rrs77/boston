import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

console.log('🔥 NEW SettingsContextNew loaded at:', new Date().toISOString());

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

interface Category {
  name: string;
  color: string;
  position: number;
  yearGroups: {
    LKG: boolean;
    UKG: boolean;
    Reception: boolean;
  };
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
}

const FIXED_CATEGORIES: Category[] = [
  { name: 'Welcome', color: '#10b981', position: 0, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Kodaly Songs', color: '#3b82f6', position: 1, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Vocal Warm-Ups', color: '#ff6b6b', position: 2, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Action/Games Songs', color: '#f59e0b', position: 3, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Drama Games', color: '#e11d48', position: 4, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Rhythm Sticks', color: '#ef4444', position: 5, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'General Game', color: '#06b6d4', position: 6, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Core Songs', color: '#84cc16', position: 7, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Physical Activities', color: '#0ea5e9', position: 8, yearGroups: { LKG: true, UKG: true, Reception: true } },
  { name: 'Goodbye', color: '#64748b', position: 9, yearGroups: { LKG: true, UKG: true, Reception: true } }
];

const SettingsContextNew = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContextNew);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProviderNew');
  }
  return context;
};

export const SettingsProviderNew: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(FIXED_CATEGORIES);
  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('🎯 NEW SettingsProviderNew useEffect running...');
    
    const savedViewMode = localStorage.getItem('defaultViewMode') as 'grid' | 'list' | 'compact';
    if (savedViewMode) {
      setDefaultViewMode(savedViewMode);
    }
    
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
    
    // Load any saved categories from localStorage
    try {
      const savedCategories = localStorage.getItem('saved-categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > FIXED_CATEGORIES.length) {
          console.log('📦 Loading saved categories from localStorage:', parsed.length);
          setCategories(parsed);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved categories:', error);
    }
    
    console.log('✅ NEW SettingsContext loaded with', categories.length, 'categories');
  }, []);
  
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
          .insert([{ 
            name: 'Music', 
            description: 'Music education activities', 
            color: '#3b82f6',
            is_active: true 
          }])
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
        .insert([{
          subject_id: subjects.id,
          name: name,
          color: color,
          sort_order: categories.length,
          is_locked: false,
          is_active: true
        }])
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
        yearGroups: { LKG: true, UKG: true, Reception: true }
      };
      
      // Update state
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // Save to localStorage
      localStorage.setItem('saved-categories', JSON.stringify(updatedCategories));
      
      console.log('🎉 NEW: Category added permanently and saved!');
      alert(`✅ NEW VERSION: Category "${name}" saved permanently!`);
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('❌ NEW: Failed to add category:', error);
      alert(`❌ NEW VERSION: Failed to save category: ${errorMessage}`);
    }
  };

  const getThemeForClass = (className: string): Theme => {
    return {
      primary: '#6b7280',
      secondary: '#9ca3af',
      accent: '#d1d5db'
    };
  };

  const getThemeForSubject = (subjectId: string): Theme => {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#1d4ed8'
    };
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryByName = (categoryName: string): Category | null => {
    return categories.find(cat => cat.name === categoryName) || null;
  };

  const getSubjectCategories = () => {
    return categories.map((cat, index) => ({
      id: `fixed-${index}`,
      name: cat.name,
      color: cat.color,
      description: '',
      is_locked: false,
      is_active: true,
      sort_order: cat.position
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
    setIsAdmin: handleSetIsAdmin
  };

  return (
    <SettingsContextNew.Provider value={contextValue}>
      {children}
    </SettingsContextNew.Provider>
  );
};

export default SettingsProviderNew;