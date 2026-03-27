import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Receipt, Category } from '@/types/receipt';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

const RECEIPTS_KEY = 'receipts';
const CATEGORIES_KEY = 'categories';

export const [ReceiptProvider, useReceipts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Load receipts from AsyncStorage
  const receiptsQuery = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      console.log('Loading receipts from AsyncStorage...');
      const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
      const receipts = stored ? JSON.parse(stored) : [];
      console.log('Loaded receipts count:', receipts.length);
      receipts.forEach((receipt: Receipt, index: number) => {
        console.log(`Receipt ${index + 1} - ID: ${receipt.id}, Image URI: ${receipt.imageUri}`);
      });
      return receipts;
    },
  });

  // Load categories from AsyncStorage
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CATEGORIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default categories
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    },
  });

  // Save receipt mutation
  const saveReceiptMutation = useMutation({
    mutationFn: async (receipt: Receipt) => {
      console.log('saveReceiptMutation called with:', receipt);
      const receipts = receiptsQuery.data || [];
      console.log('Current receipts:', receipts.length);
      const updated = [...receipts, receipt];
      console.log('Updated receipts:', updated.length);
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
      console.log('Saved to AsyncStorage');
      return updated;
    },
    onSuccess: (data) => {
      console.log('saveReceiptMutation onSuccess, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
    onError: (error) => {
      console.error('saveReceiptMutation error:', error);
    },
  });

  // Update receipt mutation
  const updateReceiptMutation = useMutation({
    mutationFn: async (receipt: Receipt) => {
      const receipts = receiptsQuery.data || [];
      const updated = receipts.map((r: Receipt) => r.id === receipt.id ? receipt : r);
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  // Delete receipt mutation
  const deleteReceiptMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      const receipts = receiptsQuery.data || [];
      const updated = receipts.filter((r: Receipt) => r.id !== receiptId);
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const categories = categoriesQuery.data || [];
      const updated = [...categories, category];
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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