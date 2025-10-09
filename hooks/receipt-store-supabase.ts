import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Receipt, Category, Budget, BudgetAlert } from '@/types/receipt';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { supabase } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-store';

const RECEIPTS_KEY = 'receipts';
const CATEGORIES_KEY = 'categories';

export const [ReceiptProvider, useReceipts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Load receipts - from Supabase if authenticated, AsyncStorage if not
  const receiptsQuery = useQuery({
    queryKey: ['receipts', user?.id],
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      if (user) {
        console.log('Loading receipts from Supabase for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading receipts from Supabase:', JSON.stringify({
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            }, null, 2));
            
            // Check for common connection issues
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) {
              throw new Error('Network connection failed. Please check your internet connection and try again.');
            }
            
            // Check for authentication issues
            if (error.code === '401' || error.message.includes('JWT') || error.message.includes('unauthorized')) {
              throw new Error('Authentication failed. Please sign in again.');
            }
            
            // Check for table/database issues
            if (error.code === '42P01' || error.message.includes('does not exist')) {
              throw new Error('Database table not found. Please contact support.');
            }
            
            throw new Error(`Failed to load receipts: ${error.message}`);
          }

          console.log('Loaded receipts from Supabase:', data?.length || 0, 'receipts');
          if (data && data.length > 0) {
            console.log('Sample receipt image URLs:', data.slice(0, 3).map((r: any) => ({ 
              id: r.id, 
              image_url: r.image_url,
              image_url_valid: !!(r.image_url && r.image_url.trim() !== '' && (r.image_url.startsWith('http') || r.image_url.startsWith('data:') || r.image_url.startsWith('file:')))
            })));
          }

          // Transform Supabase data to match local Receipt type
          return data.map((receipt: any) => ({
            id: receipt.id,
            merchant: receipt.merchant || '',
            total: receipt.total || 0,
            tax: receipt.tax || 0,
            subtotal: receipt.subtotal || (receipt.total || 0) - (receipt.tax || 0),
            category: receipt.category || '',
            receiptDate: receipt.receipt_date || new Date().toISOString(),
            dateScanned: receipt.created_at || new Date().toISOString(),
            items: receipt.items || [],
            imageUri: receipt.image_url || '',
            notes: receipt.notes || '',
            paymentMethod: receipt.payment_method || '',
            userId: receipt.user_id,
            createdAt: receipt.created_at,
            updatedAt: receipt.updated_at,
          }));
        } catch (networkError: any) {
          console.error('Network error loading receipts:', {
            name: networkError.name,
            message: networkError.message,
            stack: networkError.stack?.substring(0, 200)
          });
          
          // Handle network errors that don't come from Supabase
          if (networkError.message && networkError.message.includes('Network connection failed')) {
            throw networkError;
          }
          
          if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
            throw new Error('Unable to connect to the database. Please check your internet connection.');
          }
          
          // Fall back to AsyncStorage if Supabase fails
          console.log('Falling back to AsyncStorage due to network error');
          const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch (e) {
              console.error('Failed to parse AsyncStorage fallback:', e);
            }
          }
          return [];
        }
      } else {
        console.log('Loading receipts from AsyncStorage');
        const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
        if (!stored) {
          console.log('No stored receipts found in AsyncStorage');
          return [];
        }
        
        try {
          console.log('Raw stored data (first 100 chars):', stored.substring(0, 100));
          const receipts = JSON.parse(stored);
          console.log('Loaded receipts from AsyncStorage:', receipts.length, 'receipts');
          if (receipts.length > 0) {
            console.log('Sample receipt image URIs:', receipts.slice(0, 3).map((r: any) => ({ id: r.id, imageUri: r.imageUri })));
          }
          return receipts;
        } catch (parseError) {
          console.error('JSON parse error in receipts:', parseError);
          console.error('Corrupted data:', stored);
          // Clear corrupted data and return empty array
          await AsyncStorage.removeItem(RECEIPTS_KEY);
          console.log('Cleared corrupted receipts data');
          return [];
        }
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  // Load categories - from Supabase if authenticated, AsyncStorage if not
  const categoriesQuery = useQuery({
    queryKey: ['categories', user?.id],
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      if (user) {
        console.log('Loading categories from Supabase for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error loading categories from Supabase:', JSON.stringify({
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            }, null, 2));
            
            // Check for common connection issues
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) {
              throw new Error('Network connection failed. Please check your internet connection and try again.');
            }
            
            // Check for authentication issues
            if (error.code === '401' || error.message.includes('JWT') || error.message.includes('unauthorized')) {
              throw new Error('Authentication failed. Please sign in again.');
            }
            
            // Check for table/database issues
            if (error.code === '42P01' || error.message.includes('does not exist')) {
              throw new Error('Database table not found. Please contact support.');
            }
            
            throw new Error(`Failed to load categories: ${error.message}`);
          }

          if (data.length === 0) {
            // Initialize with default categories for new user
            console.log('No categories found, initializing with defaults');
            try {
              const defaultCategoriesWithUserId = DEFAULT_CATEGORIES.map(cat => ({
                name: cat.name,
                color: cat.color,
                icon: cat.icon,
                user_id: user.id,
              }));

              const { data: insertedData, error: insertError } = await supabase
                .from('categories')
                .insert(defaultCategoriesWithUserId)
                .select();

              if (insertError) {
                console.error('Error inserting default categories:', insertError);
                // Return default categories even if insert fails
                return DEFAULT_CATEGORIES;
              }

              console.log('Default categories inserted successfully');
              return insertedData || DEFAULT_CATEGORIES;
            } catch (error) {
              console.error('Failed to initialize default categories:', error);
              return DEFAULT_CATEGORIES;
            }
          }

          return data;
        } catch (networkError: any) {
          console.error('Network error loading categories:', {
            name: networkError.name,
            message: networkError.message,
            stack: networkError.stack?.substring(0, 200)
          });
          
          // Handle network errors that don't come from Supabase
          if (networkError.message && networkError.message.includes('Network connection failed')) {
            throw networkError;
          }
          
          if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
            throw new Error('Unable to connect to the database. Please check your internet connection.');
          }
          
          // Fall back to AsyncStorage or default categories if Supabase fails
          console.log('Falling back to AsyncStorage/defaults due to network error');
          const stored = await AsyncStorage.getItem(CATEGORIES_KEY);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch (e) {
              console.error('Failed to parse AsyncStorage fallback:', e);
            }
          }
          return DEFAULT_CATEGORIES;
        }
      } else {
        console.log('Loading categories from AsyncStorage');
        const stored = await AsyncStorage.getItem(CATEGORIES_KEY);
        if (stored) {
          try {
            console.log('Raw stored categories data (first 100 chars):', stored.substring(0, 100));
            return JSON.parse(stored);
          } catch (parseError) {
            console.error('JSON parse error in categories:', parseError);
            console.error('Corrupted categories data:', stored);
            // Clear corrupted data and reinitialize
            await AsyncStorage.removeItem(CATEGORIES_KEY);
            console.log('Cleared corrupted categories data');
          }
        }
        // Initialize with default categories
        console.log('Initializing with default categories');
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
    },
    enabled: true,
  });

  // Save receipt mutation
  const saveReceiptMutation = useMutation({
    mutationFn: async (receipt: Receipt) => {
      console.log('saveReceiptMutation called with:', receipt);
      console.log('User authenticated:', !!user, user?.id);
      
      // Validate receipt data
      if (!receipt.merchant) {
        console.error('Missing merchant name');
        throw new Error('Merchant name is required');
      }
      if (receipt.total === undefined || receipt.total === null) {
        console.error('Missing total amount');
        throw new Error('Total amount is required');
      }
      if (!receipt.category) {
        console.error('Missing category');
        throw new Error('Category is required');
      }
      if (!receipt.receiptDate) {
        console.error('Missing receipt date');
        throw new Error('Receipt date is required');
      }
      
      if (user) {
        console.log('Saving receipt to Supabase for user:', user.id);
        console.log('Receipt data to save:', {
          id: receipt.id,
          user_id: user.id,
          merchant: receipt.merchant,
          total: receipt.total,
          tax: receipt.tax || 0,
          category: receipt.category,
          receipt_date: receipt.receiptDate,
          items: receipt.items || [],
          image_url: receipt.imageUri || null,
        });
        
        try {
          const { data, error } = await supabase
            .from('receipts')
            .insert({
              user_id: user.id,
              merchant: receipt.merchant,
              total: receipt.total,
              tax: receipt.tax || 0,
              subtotal: receipt.subtotal || (receipt.total - (receipt.tax || 0)),
              category: receipt.category,
              receipt_date: receipt.receiptDate,
              items: receipt.items || [],
              image_url: receipt.imageUri && receipt.imageUri.trim() !== '' && (receipt.imageUri.startsWith('http') || receipt.imageUri.startsWith('data:') || receipt.imageUri.startsWith('file:')) ? receipt.imageUri.trim() : null,
              notes: receipt.notes || null,
              payment_method: receipt.paymentMethod || null,
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            
            // Provide more specific error messages
            if (error.code === '23505') {
              throw new Error('A receipt with this ID already exists');
            } else if (error.code === '23503') {
              throw new Error('Invalid user or category reference');
            } else if (error.code === '42501') {
              throw new Error('Permission denied. Please check your authentication');
            } else if (error.message.includes('duplicate key')) {
              throw new Error('A receipt with this ID already exists');
            } else if (error.message.includes('violates foreign key')) {
              throw new Error('Invalid category or user reference');
            } else {
              throw new Error(`Database error: ${error.message}`);
            }
          }

          console.log('Receipt saved successfully to Supabase:', data);
          return data;
        } catch (supabaseError: any) {
          console.error('Supabase operation error:', supabaseError);
          
          // Re-throw our custom errors
          if (supabaseError.message && supabaseError.message.includes('Database error:')) {
            throw supabaseError;
          }
          
          // Handle network/connection errors
          if (supabaseError.message && supabaseError.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
          }
          
          throw new Error(`Failed to save receipt: ${supabaseError.message || 'Unknown database error'}`);
        }
      } else {
        console.log('Saving receipt to AsyncStorage');
        try {
          const receipts = receiptsQuery.data || [];
          const updated = [...receipts, receipt];
          const jsonString = JSON.stringify(updated);
          console.log('Saving JSON string length:', jsonString.length);
          await AsyncStorage.setItem(RECEIPTS_KEY, jsonString);
          console.log('Receipt saved successfully to AsyncStorage');
          return updated;
        } catch (storageError: any) {
          console.error('AsyncStorage error:', storageError);
          throw new Error(`Storage error: ${storageError.message || 'Unable to save receipt locally'}`);
        }
      }
    },
    onSuccess: () => {
      console.log('saveReceiptMutation onSuccess, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    },
    onError: (error) => {
      console.error('saveReceiptMutation error:', error);
    },
  });

  // Update receipt mutation
  const updateReceiptMutation = useMutation({
    mutationFn: async (receipt: Receipt) => {
      if (user) {
        console.log('Updating receipt in Supabase');
        const { data, error } = await supabase
          .from('receipts')
          .update({
            merchant: receipt.merchant,
            total: receipt.total,
            tax: receipt.tax,
            category: receipt.category,
            receipt_date: receipt.receiptDate,
            items: receipt.items,
            image_url: receipt.imageUri && receipt.imageUri.trim() !== '' && (receipt.imageUri.startsWith('http') || receipt.imageUri.startsWith('data:') || receipt.imageUri.startsWith('file:')) ? receipt.imageUri : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', receipt.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating receipt in Supabase:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Failed to update receipt: ${error.message}`);
        }

        return data;
      } else {
        console.log('Updating receipt in AsyncStorage');
        try {
          const receipts = receiptsQuery.data || [];
          const updated = receipts.map((r: Receipt) => r.id === receipt.id ? receipt : r);
          const jsonString = JSON.stringify(updated);
          console.log('Updating JSON string length:', jsonString.length);
          await AsyncStorage.setItem(RECEIPTS_KEY, jsonString);
          return updated;
        } catch (storageError: any) {
          console.error('AsyncStorage update error:', storageError);
          throw new Error(`Storage update error: ${storageError.message || 'Unable to update receipt locally'}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    },
  });

  // Delete receipt mutation
  const deleteReceiptMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      if (user) {
        console.log('Deleting receipt from Supabase');
        const { error } = await supabase
          .from('receipts')
          .delete()
          .eq('id', receiptId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting receipt from Supabase:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Failed to delete receipt: ${error.message}`);
        }

        return receiptId;
      } else {
        console.log('Deleting receipt from AsyncStorage');
        try {
          const receipts = receiptsQuery.data || [];
          const updated = receipts.filter((r: Receipt) => r.id !== receiptId);
          const jsonString = JSON.stringify(updated);
          console.log('Deleting - JSON string length:', jsonString.length);
          await AsyncStorage.setItem(RECEIPTS_KEY, jsonString);
          return updated;
        } catch (storageError: any) {
          console.error('AsyncStorage delete error:', storageError);
          throw new Error(`Storage delete error: ${storageError.message || 'Unable to delete receipt locally'}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      if (user) {
        console.log('Adding category to Supabase');
        const { data, error } = await supabase
          .from('categories')
          .insert({
            ...category,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding category to Supabase:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Failed to add category: ${error.message}`);
        }

        return data;
      } else {
        console.log('Adding category to AsyncStorage');
        try {
          const categories = categoriesQuery.data || [];
          const updated = [...categories, category];
          const jsonString = JSON.stringify(updated);
          console.log('Adding category - JSON string length:', jsonString.length);
          await AsyncStorage.setItem(CATEGORIES_KEY, jsonString);
          return updated;
        } catch (storageError: any) {
          console.error('AsyncStorage category add error:', storageError);
          throw new Error(`Storage category error: ${storageError.message || 'Unable to add category locally'}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
    },
  });

  // Calculate category counts
  const categoriesWithCounts = useMemo(() => {
    const receipts = receiptsQuery.data || [];
    const categories = categoriesQuery.data || [];
    
    return categories.map((cat: Category) => ({
      ...cat,
      count: receipts.filter((r: Receipt) => r.category === cat.name).length,
    }));
  }, [receiptsQuery.data, categoriesQuery.data]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let receipts = receiptsQuery.data || [];
    
    // Filter by search query
    if (searchQuery) {
      receipts = receipts.filter((r: Receipt) => 
        r.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      receipts = receipts.filter((r: Receipt) => r.category === selectedCategory);
    }
    
    // Filter by date range
    if (dateRange.start || dateRange.end) {
      receipts = receipts.filter((r: Receipt) => {
        const receiptDate = new Date(r.receiptDate);
        if (dateRange.start && receiptDate < dateRange.start) return false;
        if (dateRange.end && receiptDate > dateRange.end) return false;
        return true;
      });
    }
    
    // Sort by date (newest first)
    return receipts.sort((a: Receipt, b: Receipt) => 
      new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime()
    );
  }, [receiptsQuery.data, searchQuery, selectedCategory, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const receipts = filteredReceipts;
    return {
      total: receipts.reduce((sum: number, r: Receipt) => sum + r.total, 0),
      tax: receipts.reduce((sum: number, r: Receipt) => sum + r.tax, 0),
      count: receipts.length,
    };
  }, [filteredReceipts]);

  return {
    receipts: receiptsQuery.data || [],
    filteredReceipts,
    categories: categoriesWithCounts,
    isLoading: receiptsQuery.isLoading || categoriesQuery.isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    dateRange,
    setDateRange,
    totals,
    saveReceipt: saveReceiptMutation.mutateAsync,
    updateReceipt: updateReceiptMutation.mutate,
    deleteReceipt: deleteReceiptMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    isSaving: saveReceiptMutation.isPending,
  };
});

export function useReceiptById(id: string) {
  const { receipts } = useReceipts();
  return receipts.find((r: Receipt) => r.id === id);
}

export function useCategoryStats() {
  const { receipts, categories } = useReceipts();
  
  return useMemo(() => {
    const stats = categories.map((cat: Category & { count: number }) => {
      const categoryReceipts = receipts.filter((r: Receipt) => r.category === cat.name);
      const total = categoryReceipts.reduce((sum: number, r: Receipt) => sum + r.total, 0);
      
      return {
        ...cat,
        total,
        percentage: receipts.length > 0 ? (categoryReceipts.length / receipts.length) * 100 : 0,
      };
    });
    
    return stats.sort((a: any, b: any) => b.total - a.total);
  }, [receipts, categories]);
}

// Utility function to clear all local storage data (for debugging)
export async function clearAllLocalData() {
  try {
    console.log('Clearing all local storage data...');
    await AsyncStorage.removeItem(RECEIPTS_KEY);
    await AsyncStorage.removeItem(CATEGORIES_KEY);
    console.log('All local storage data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing local storage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Budget Management Hook
export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { receipts } = useReceipts();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Load budgets from AsyncStorage
  const loadBudgets = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('budgets');
      if (stored) {
        setBudgets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save budgets to AsyncStorage
  const saveBudgets = useCallback(async (newBudgets: Budget[]) => {
    try {
      await AsyncStorage.setItem('budgets', JSON.stringify(newBudgets));
      setBudgets(newBudgets);
    } catch (error) {
      console.error('Error saving budgets:', error);
    }
  }, []);

  // Calculate current spending for each budget
  const calculateCurrentSpending = useCallback(() => {
    const updatedBudgets = budgets.map(budget => {
      const categoryReceipts = receipts.filter((receipt: Receipt) => {
        const receiptMonth = new Date(receipt.receiptDate).toISOString().slice(0, 7);
        return receipt.category === budget.category && receiptMonth === budget.month;
      });
      
      const currentSpent = categoryReceipts.reduce((sum: number, receipt: Receipt) => sum + receipt.total, 0);
      
      return {
        ...budget,
        currentSpent
      };
    });
    
    setBudgets(updatedBudgets);
    
    // Generate alerts
    const newAlerts: BudgetAlert[] = [];
    updatedBudgets.forEach(budget => {
      const percentage = (budget.currentSpent / budget.monthlyLimit) * 100;
      
      if (percentage >= 100) {
        newAlerts.push({
          id: `${budget.id}-exceeded`,
          budgetId: budget.id,
          category: budget.category,
          type: 'exceeded',
          threshold: 100,
          currentAmount: budget.currentSpent,
          message: `You've exceeded your ${budget.category} budget by ${(budget.currentSpent - budget.monthlyLimit).toFixed(2)}`,
          createdAt: new Date().toISOString()
        });
      } else if (percentage >= 80) {
        newAlerts.push({
          id: `${budget.id}-warning`,
          budgetId: budget.id,
          category: budget.category,
          type: 'warning',
          threshold: 80,
          currentAmount: budget.currentSpent,
          message: `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget`,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    setAlerts(newAlerts);
  }, [budgets, receipts]);

  // Add or update budget
  const setBudget = useCallback(async (category: string, monthlyLimit: number, month: string = currentMonth) => {
    const existingBudgetIndex = budgets.findIndex(b => b.category === category && b.month === month);
    
    if (existingBudgetIndex >= 0) {
      const updatedBudgets = [...budgets];
      updatedBudgets[existingBudgetIndex] = {
        ...updatedBudgets[existingBudgetIndex],
        monthlyLimit,
        updatedAt: new Date().toISOString()
      };
      await saveBudgets(updatedBudgets);
    } else {
      const newBudget: Budget = {
        id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category,
        monthlyLimit,
        currentSpent: 0,
        month,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveBudgets([...budgets, newBudget]);
    }
  }, [budgets, saveBudgets, currentMonth]);

  // Remove budget
  const removeBudget = useCallback(async (budgetId: string) => {
    const updatedBudgets = budgets.filter(b => b.id !== budgetId);
    await saveBudgets(updatedBudgets);
  }, [budgets, saveBudgets]);

  // Get budget for category and month
  const getBudget = useCallback((category: string, month: string = currentMonth) => {
    return budgets.find(b => b.category === category && b.month === month);
  }, [budgets, currentMonth]);

  // Get current month budgets
  const currentMonthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === currentMonth);
  }, [budgets, currentMonth]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (budgets.length > 0 && receipts.length > 0) {
      calculateCurrentSpending();
    }
  }, [receipts, calculateCurrentSpending]);

  return {
    budgets: currentMonthBudgets,
    allBudgets: budgets,
    alerts,
    isLoading,
    setBudget,
    removeBudget,
    getBudget,
    currentMonth
  };
}