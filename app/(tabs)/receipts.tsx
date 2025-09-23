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
import { Colors, Shadows, BorderRadius, Spacing, CommonStyles, Typography } from '@/constants/design-system';

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

  // Auto-refresh every 30 seconds (reduced from 5 seconds for better performance)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing receipts...');
      queryClient.invalidateQueries({ queryKey: ['receipts', user?.id] });
    }, 30000);

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
      <View style={CommonStyles.loadingContainer}>
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
          {selectedCategory && (
            <Text style={styles.filterIndicator}> • {selectedCategory}</Text>
          )}
        </Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.autoRefreshText}>Live</Text>
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
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
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.gray900,
    fontWeight: Typography.medium,
  },
  categoriesWrapper: {
    backgroundColor: Colors.gray50,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resultsCount: {
    fontSize: Typography.sm,
    color: Colors.gray600,
    fontWeight: Typography.semibold,
    flex: 1,
    minWidth: 120,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.gray600,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: Spacing.xs,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  autoRefreshText: {
    fontSize: Typography.xs,
    color: Colors.secondary,
    fontWeight: Typography.semibold,
  },
  filterIndicator: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
});