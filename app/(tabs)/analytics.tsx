import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { TrendingUp, PieChart, Calendar, DollarSign, Store, FileText, Download } from 'lucide-react-native';
import { useCategoryStats, useReceipts } from '@/hooks/receipt-store-supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, BorderRadius, Spacing, CommonStyles, Typography } from '@/constants/design-system';
import type { Receipt as ReceiptType } from '@/types/receipt';

export default function AnalyticsScreen() {
  const { receipts, totals, isLoading } = useReceipts();
  const categoryStats = useCategoryStats();
  const insets = useSafeAreaInsets();
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'month' | 'quarter' | 'year'>('month');
  
  const avgReceiptValue = totals.count > 0 ? totals.total / totals.count : 0;
  
  // Calculate spending trends based on timeframe
  const spendingTrends = React.useMemo(() => {
    const periods: { [key: string]: number } = {};
    receipts.forEach((receipt: ReceiptType) => {
      const date = new Date(receipt.receiptDate);
      let periodKey: string;
      
      if (selectedTimeframe === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (selectedTimeframe === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
      } else {
        periodKey = date.getFullYear().toString();
      }
      
      periods[periodKey] = (periods[periodKey] || 0) + receipt.total;
    });
    
    return Object.entries(periods)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, selectedTimeframe === 'year' ? 5 : 6)
      .reverse();
  }, [receipts, selectedTimeframe]);

  // Calculate merchant insights
  const merchantInsights = React.useMemo(() => {
    const merchants: { [key: string]: { total: number; count: number; avgSpend: number } } = {};
    
    receipts.forEach((receipt: ReceiptType) => {
      if (!merchants[receipt.merchant]) {
        merchants[receipt.merchant] = { total: 0, count: 0, avgSpend: 0 };
      }
      merchants[receipt.merchant].total += receipt.total;
      merchants[receipt.merchant].count += 1;
    });
    
    // Calculate average spend and sort by total
    return Object.entries(merchants)
      .map(([name, data]) => ({
        name,
        ...data,
        avgSpend: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [receipts]);

  // Calculate tax-deductible expenses (business categories)
  const taxDeductibleExpenses = React.useMemo(() => {
    const businessCategories = ['Business', 'Office Supplies', 'Travel', 'Meals', 'Transportation', 'Equipment'];
    const deductibleReceipts = receipts.filter((receipt: ReceiptType) => 
      businessCategories.some(cat => receipt.category.toLowerCase().includes(cat.toLowerCase()))
    );
    
    const total = deductibleReceipts.reduce((sum: number, receipt: ReceiptType) => sum + receipt.total, 0);
    const percentage = receipts.length > 0 ? (total / totals.total) * 100 : 0;
    
    return {
      total,
      count: deductibleReceipts.length,
      percentage,
      receipts: deductibleReceipts,
    };
  }, [receipts, totals.total]);

  // Export tax data
  const exportTaxData = () => {
    if (taxDeductibleExpenses.receipts.length === 0) {
      Alert.alert('No Data', 'No tax-deductible expenses found.');
      return;
    }
    
    const csvData = taxDeductibleExpenses.receipts.map((receipt: ReceiptType) => 
      `${receipt.receiptDate},${receipt.merchant},${receipt.category},${receipt.total.toFixed(2)},${receipt.tax.toFixed(2)}`
    ).join('\n');
    
    const header = 'Date,Merchant,Category,Total,Tax\n';
    const fullCsv = header + csvData;
    
    Alert.alert(
      'Export Ready',
      `Found ${taxDeductibleExpenses.receipts.length} tax-deductible receipts totaling ${taxDeductibleExpenses.total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Data', onPress: () => console.log('CSV Data:', fullCsv) }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={CommonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <FileText size={20} color="#8B5CF6" />
            <Text style={styles.summaryLabel}>Tax Deductible</Text>
            <Text style={styles.summaryValue}>${taxDeductibleExpenses.total.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* Tax Preparation Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Tax Preparation</Text>
          <TouchableOpacity onPress={exportTaxData} style={styles.exportButton}>
            <Download size={16} color="#8B5CF6" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.taxSummary}>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Deductible Expenses</Text>
            <Text style={styles.taxValue}>${taxDeductibleExpenses.total.toFixed(2)}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Receipts Count</Text>
            <Text style={styles.taxValue}>{taxDeductibleExpenses.count}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>% of Total Spending</Text>
            <Text style={styles.taxValue}>{taxDeductibleExpenses.percentage.toFixed(1)}%</Text>
          </View>
        </View>
        
        {taxDeductibleExpenses.count === 0 && (
          <Text style={styles.noData}>No business expenses found. Add receipts with business categories to track deductible expenses.</Text>
        )}
      </View>

      {/* Merchant Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Store size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Top Merchants</Text>
        </View>
        
        {merchantInsights.map((merchant, index) => {
          const maxTotal = merchantInsights[0]?.total || 1;
          const percentage = (merchant.total / maxTotal) * 100;
          
          return (
            <View key={merchant.name} style={styles.merchantRow}>
              <View style={styles.merchantRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>{merchant.name}</Text>
                <Text style={styles.merchantStats}>
                  {merchant.count} visits • Avg ${merchant.avgSpend.toFixed(0)}
                </Text>
              </View>
              <View style={styles.merchantAmount}>
                <Text style={styles.merchantTotal}>${merchant.total.toFixed(0)}</Text>
                <View style={styles.merchantBar}>
                  <View 
                    style={[
                      styles.merchantBarFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          );
        })}
        
        {merchantInsights.length === 0 && (
          <Text style={styles.noData}>No merchant data yet</Text>
        )}
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
          <Text style={styles.sectionTitle}>Spending Trends</Text>
          <View style={styles.timeframeSelector}>
            {(['month', 'quarter', 'year'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                onPress={() => setSelectedTimeframe(timeframe)}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive
                ]}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  selectedTimeframe === timeframe && styles.timeframeButtonTextActive
                ]}>
                  {timeframe === 'month' ? 'M' : timeframe === 'quarter' ? 'Q' : 'Y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {spendingTrends.map(([period, amount]) => {
          let displayLabel: string;
          if (selectedTimeframe === 'month') {
            const [year, monthNum] = period.split('-');
            displayLabel = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          } else if (selectedTimeframe === 'quarter') {
            displayLabel = period.replace('-', ' ');
          } else {
            displayLabel = period;
          }
          
          const maxAmount = Math.max(...spendingTrends.map(([, a]) => a));
          const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          
          // Calculate trend (compare with previous period)
          const currentIndex = spendingTrends.findIndex(([p]) => p === period);
          const previousAmount = currentIndex > 0 ? spendingTrends[currentIndex - 1][1] : amount;
          const trendPercentage = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;
          const isPositiveTrend = trendPercentage > 0;
          
          return (
            <View key={period} style={styles.trendRow}>
              <View style={styles.trendLabel}>
                <Text style={styles.trendPeriod}>{displayLabel}</Text>
                {Math.abs(trendPercentage) > 5 && (
                  <Text style={[
                    styles.trendChange,
                    { color: isPositiveTrend ? '#EF4444' : '#10B981' }
                  ]}>
                    {isPositiveTrend ? '+' : ''}{trendPercentage.toFixed(0)}%
                  </Text>
                )}
              </View>
              <View style={styles.trendBar}>
                <View 
                  style={[
                    styles.trendBarFill, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.trendAmount}>${amount.toFixed(0)}</Text>
            </View>
          );
        })}
        
        {spendingTrends.length === 0 && (
          <Text style={styles.noData}>No trend data yet</Text>
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Smart Insights</Text>
        <Text style={styles.insightText}>
          {totals.count > 20 
            ? `You've tracked ${totals.count} receipts! Your top merchant is ${merchantInsights[0]?.name || 'unknown'} with ${merchantInsights[0]?.total.toFixed(0) || '0'} spent.`
            : totals.count > 10
            ? `Great progress with ${totals.count} receipts! ${taxDeductibleExpenses.count > 0 ? `You have ${taxDeductibleExpenses.total.toFixed(0)} in potential tax deductions.` : 'Consider categorizing business expenses for tax benefits.'}`
            : 'Start scanning more receipts to unlock detailed spending insights, trends, and tax preparation tools.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  summaryTitle: {
    ...CommonStyles.heading3,
    marginBottom: Spacing.lg,
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
    fontSize: Typography.xs,
    color: Colors.gray500,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  summaryValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.gray900,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.gray200,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...CommonStyles.heading4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    marginRight: Spacing.sm,
  },
  categoryName: {
    fontSize: Typography.sm,
    color: Colors.gray700,
    fontWeight: Typography.medium,
  },
  categoryCount: {
    fontSize: Typography.xs,
    color: Colors.gray400,
    marginLeft: Spacing.xs,
  },
  categoryStats: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryAmount: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  percentageBar: {
    width: 100,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
  },
  percentageFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
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
    ...CommonStyles.body,
    color: Colors.gray400,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  insightCard: {
    backgroundColor: Colors.primaryBackground,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing['3xl'],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '20',
  },
  insightTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  insightText: {
    fontSize: Typography.xs,
    color: Colors.primaryLight,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: 'auto',
    ...Shadows.sm,
  },
  exportButtonText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  taxSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  taxItem: {
    alignItems: 'center',
    flex: 1,
  },
  taxLabel: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  taxValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.gray800,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  merchantRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  rankNumber: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.gray800,
    marginBottom: 2,
  },
  merchantStats: {
    fontSize: Typography.xs,
    color: Colors.gray500,
  },
  merchantAmount: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  merchantTotal: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.gray800,
    marginBottom: Spacing.xs,
  },
  merchantBar: {
    width: 60,
    height: 3,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
  },
  merchantBarFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: BorderRadius.sm,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: 'auto',
  },
  timeframeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.primary,
  },
  timeframeButtonText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.gray500,
  },
  timeframeButtonTextActive: {
    color: Colors.white,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  trendLabel: {
    width: 80,
  },
  trendPeriod: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  trendChange: {
    fontSize: 10,
    fontWeight: Typography.semibold,
    marginTop: 1,
  },
  trendBar: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.sm,
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
  },
  trendAmount: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.gray900,
    width: 50,
    textAlign: 'right',
  },
});