import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { TrendingUp, PieChart, Calendar, DollarSign } from 'lucide-react-native';
import { useCategoryStats, useReceipts } from '@/hooks/receipt-store-supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Receipt as ReceiptType } from '@/types/receipt';

export default function AnalyticsScreen() {
  const { receipts, totals, isLoading } = useReceipts();
  const categoryStats = useCategoryStats();
  const insets = useSafeAreaInsets();
  
  const avgReceiptValue = totals.count > 0 ? totals.total / totals.count : 0;
  
  // Calculate monthly spending
  const monthlySpending = React.useMemo(() => {
    const months: { [key: string]: number } = {};
    receipts.forEach((receipt: ReceiptType) => {
      const date = new Date(receipt.receiptDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] || 0) + receipt.total;
    });
    
    return Object.entries(months)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .reverse();
  }, [receipts]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Expense Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <DollarSign size={20} color="#10B981" />
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>${totals.total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <TrendingUp size={20} color="#F59E0B" />
            <Text style={styles.summaryLabel}>Avg Receipt</Text>
            <Text style={styles.summaryValue}>${avgReceiptValue.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <PieChart size={20} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Spending by Category</Text>
        </View>
        
        {categoryStats.filter((cat: any) => cat.total > 0).map((category: any) => (
          <View key={category.id} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>({category.count})</Text>
            </View>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryAmount}>${category.total.toFixed(2)}</Text>
              <View style={styles.percentageBar}>
                <View 
                  style={[
                    styles.percentageFill, 
                    { 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
        
        {categoryStats.filter((cat: any) => cat.total > 0).length === 0 && (
          <Text style={styles.noData}>No expense data yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
        </View>
        
        {monthlySpending.map(([month, amount]) => {
          const [year, monthNum] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short' });
          const maxAmount = Math.max(...monthlySpending.map(([, a]) => a));
          const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          
          return (
            <View key={month} style={styles.monthRow}>
              <Text style={styles.monthLabel}>{monthName} {year}</Text>
              <View style={styles.monthBar}>
                <View 
                  style={[
                    styles.monthBarFill, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.monthAmount}>${amount.toFixed(0)}</Text>
            </View>
          );
        })}
        
        {monthlySpending.length === 0 && (
          <Text style={styles.noData}>No monthly data yet</Text>
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Insight</Text>
        <Text style={styles.insightText}>
          {totals.count > 10 
            ? `You've tracked ${totals.count} receipts! Keep up the good habit of documenting expenses.`
            : 'Start scanning more receipts to get detailed spending insights and trends.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  categoryStats: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  percentageBar: {
    width: 100,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  percentageFill: {
    height: '100%',
    borderRadius: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 70,
  },
  monthBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  monthBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  monthAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    width: 50,
    textAlign: 'right',
  },
  noData: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  insightCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
});