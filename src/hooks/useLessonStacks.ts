import { useState, useEffect } from 'react';
import { lessonStacksApi } from '../config/lessonStacksApi';

export interface StackedLesson {
  id: string;
  name: string;
  description?: string;
  color: string;
  lessons: string[];
  totalTime: number;
  totalActivities: number;
  customObjectives?: string[]; // Curriculum objectives for the stack
  curriculumType?: 'EYFS' | 'CUSTOM'; // Type of curriculum
  created_at: string;
}

export function useLessonStacks() {
  const [stacks, setStacks] = useState<StackedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Load stacks from Supabase on mount
  useEffect(() => {
    const loadStacks = async () => {
      try {
        const data = await lessonStacksApi.getAll();
        setStacks(data);
      } catch (error) {
        console.error('Failed to load lesson stacks:', error);
        // Fallback to localStorage if Supabase fails
        try {
          const savedStacks = localStorage.getItem('lesson-stacks');
          if (savedStacks) {
            const parsedStacks = JSON.parse(savedStacks);
            setStacks(Array.isArray(parsedStacks) ? parsedStacks : []);
          }
        } catch (localError) {
          console.error('Failed to load from localStorage fallback:', localError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStacks();
  }, []);

  const createStack = async (stackData: Omit<StackedLesson, 'id' | 'created_at'>) => {
    try {
      const newStack = await lessonStacksApi.create(stackData);
      setStacks(prev => [...prev, newStack]);
      return newStack;
    } catch (error) {
      console.error('Failed to create stack:', error);
      // Fallback to localStorage
      const newStack: StackedLesson = {
        ...stackData,
        id: `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };
      setStacks(prev => [...prev, newStack]);
      localStorage.setItem('lesson-stacks', JSON.stringify([...stacks, newStack]));
      return newStack;
    }
  };

  const updateStack = async (id: string, updates: Partial<Omit<StackedLesson, 'id' | 'created_at'>>) => {
    try {
      const updatedStack = await lessonStacksApi.update(id, updates);
      setStacks(prev => 
        prev.map(stack => 
          stack.id === id ? updatedStack : stack
        )
      );
      return updatedStack;
    } catch (error) {
      console.error('Failed to update stack:', error);
      // Fallback to localStorage
      setStacks(prev => 
        prev.map(stack => 
          stack.id === id 
            ? { ...stack, ...updates }
            : stack
        )
      );
      localStorage.setItem('lesson-stacks', JSON.stringify(stacks.map(stack => 
        stack.id === id ? { ...stack, ...updates } : stack
      )));
    }
  };

  const deleteStack = async (id: string) => {
    try {
      await lessonStacksApi.delete(id);
      setStacks(prev => prev.filter(stack => stack.id !== id));
    } catch (error) {
      console.error('Failed to delete stack:', error);
      // Fallback to localStorage
      const updatedStacks = stacks.filter(stack => stack.id !== id);
      setStacks(updatedStacks);
      localStorage.setItem('lesson-stacks', JSON.stringify(updatedStacks));
    }
  };

  const getStackById = (id: string): StackedLesson | undefined => {
    return stacks.find(stack => stack.id === id);
  };

  const getStacksByLesson = (lessonNumber: string): StackedLesson[] => {
    return stacks.filter(stack => stack.lessons.includes(lessonNumber));
  };

  const isLessonInAnyStack = (lessonNumber: string): boolean => {
    return stacks.some(stack => stack.lessons.includes(lessonNumber));
  };

  const getAvailableLessons = (allLessonNumbers: string[], excludeStackId?: string): string[] => {
    return allLessonNumbers.filter(lessonNum => {
      return !stacks.some(stack => 
        stack.id !== excludeStackId && stack.lessons.includes(lessonNum)
      );
    });
  };

  const reorderStacks = (fromIndex: number, toIndex: number) => {
    setStacks(prev => {
      const newStacks = [...prev];
      const [movedStack] = newStacks.splice(fromIndex, 1);
      newStacks.splice(toIndex, 0, movedStack);
      return newStacks;
    });
  };

  const duplicateStack = (id: string, newName: string, newColor?: string) => {
    const originalStack = getStackById(id);
    if (!originalStack) return null;

    const duplicatedStack = {
      ...originalStack,
      name: newName,
      color: newColor || originalStack.color,
      lessons: [...originalStack.lessons],
      id: `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    setStacks(prev => [...prev, duplicatedStack]);
    return duplicatedStack;
  };

  const exportStacks = () => {
    const dataStr = JSON.stringify(stacks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-stacks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importStacks = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedStacks = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedStacks)) {
            // Validate the imported data structure
            const validStacks = importedStacks.filter(stack => 
              stack.id && 
              stack.name && 
              stack.lessons && 
              Array.isArray(stack.lessons)
            );
            
            if (validStacks.length > 0) {
              setStacks(validStacks);
              resolve(true);
            } else {
              reject(new Error('No valid stacks found in the imported file'));
            }
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const clearAllStacks = () => {
    setStacks([]);
  };

  return {
    stacks,
    loading,
    createStack,
    updateStack,
    deleteStack,
    getStackById,
    getStacksByLesson,
    isLessonInAnyStack,
    getAvailableLessons,
    reorderStacks,
    duplicateStack,
    exportStacks,
    importStacks,
    clearAllStacks
  };
}
