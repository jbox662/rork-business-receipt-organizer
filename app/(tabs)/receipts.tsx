import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react-native';
import { useReceipts } from '@/hooks/receipt-store-supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth-store';
import { ReceiptCard } from '@/components/ReceiptCard';
import { CategoryPill } from '@/components/CategoryPill';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/design-system';

export default function ReceiptsScreen() {
  const { 
    filteredReceipts, 
    categories, 
    searchQuery, 
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading 
  } = useReceipts();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  console.log('ReceiptsScreen render - filteredReceipts count:', filteredReceipts.length);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing receipts...');
      queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient, user?.id]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('Manual refresh triggered');
    await queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
    setIsRefreshing(false);
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray400}
          />
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
        >
          <RefreshCw 
            size={20} 
            color={isRefreshing ? Colors.gray400 : Colors.primary} 
            style={[styles.refreshIcon, isRefreshing && styles.refreshIconSpinning]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category: any) => (
            <CategoryPill
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.name}
              onPress={() => handleCategoryPress(category.name)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredReceipts.length} {filteredReceipts.length === 1 ? 'receipt' : 'receipts'}
        </Text>
        <Text style={styles.autoRefreshText}>
          Auto-refresh: ON
        </Text>
      </View>

      <FlatList
        data={filteredReceipts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Filter size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No receipts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory 
                ? 'Try adjusting your filters' 
                : 'Start by scanning your first receipt'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/scan')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.gray900,
    fontWeight: '500',
  },
  categoriesWrapper: {
    backgroundColor: Colors.gray50,
    paddingTop: 8,
    paddingBottom: 16,
    marginBottom: 8,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  refreshIcon: {
    transform: [{ rotate: '0deg' }],
  },
  refreshIconSpinning: {
    transform: [{ rotate: '180deg' }],
  },
  autoRefreshText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
});