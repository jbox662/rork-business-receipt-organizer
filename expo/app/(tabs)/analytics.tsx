import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, useWindowDimensions, Animated } from 'react-native';
import { TrendingUp, PieChart, Calendar, DollarSign, Store, FileText, Download, BarChart3 } from 'lucide-react-native';
import { useCategoryStats, useReceipts, useBudgets } from '@/hooks/receipt-store-supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, BorderRadius, Spacing, CommonStyles, Typography } from '@/constants/design-system';
import type { Receipt as ReceiptType } from '@/types/receipt';

export default function AnalyticsScreen() {
  const { receipts, totals, isLoading } = useReceipts();
  const categoryStats = useCategoryStats();
  const { budgets } = useBudgets();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'month' | 'quarter' | 'year'>('month');
  
  const isSmallScreen = screenWidth < 400;

  const cardMargin = isSmallScreen ? Spacing.md : Spacing.lg;
  const cardPadding = isSmallScreen ? Spacing.lg : Spacing.xl;
  
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
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}
    >
      <View style={[styles.summaryCard, { margin: cardMargin, padding: cardPadding }]}>
        <Text style={styles.summaryTitle}>Expense Summary</Text>
        <View style={[styles.summaryStats, isSmallScreen && styles.summaryStatsSmall]}>
          <View style={styles.summaryItem}>
            <DollarSign size={isSmallScreen ? 18 : 20} color={Colors.success} />
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>
              ${totals.total.toFixed(2)}
            </Text>
          </View>
          {!isSmallScreen && <View style={styles.summaryDivider} />}
          <View style={styles.summaryItem}>
            <TrendingUp size={isSmallScreen ? 18 : 20} color={Colors.orange} />
            <Text style={styles.summaryLabel}>Avg Receipt</Text>
            <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>
              ${avgReceiptValue.toFixed(2)}
            </Text>
          </View>
          {!isSmallScreen && <View style={styles.summaryDivider} />}
          <View style={styles.summaryItem}>
            <FileText size={isSmallScreen ? 18 : 20} color={Colors.accent} />
            <Text style={styles.summaryLabel}>Tax Deductible</Text>
            <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>
              ${taxDeductibleExpenses.total.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tax Preparation Section */}
      <View style={[styles.section, { marginHorizontal: cardMargin, padding: cardPadding }]}>
        <View style={[styles.sectionHeader, isSmallScreen && { flexWrap: 'wrap' }]}>
          <FileText size={isSmallScreen ? 18 : 20} color={Colors.accent} />
          <Text style={[styles.sectionTitle, { flex: 1 }]}>Tax Preparation</Text>
          <TouchableOpacity onPress={exportTaxData} style={[styles.exportButton, isSmallScreen && { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}>
            <Download size={14} color={Colors.accent} />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.taxSummary, isSmallScreen && { flexDirection: 'column', gap: Spacing.md }]}>
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
      <View style={[styles.section, { marginHorizontal: cardMargin, padding: cardPadding }]}>
        <View style={styles.sectionHeader}>
          <Store size={isSmallScreen ? 18 : 20} color={Colors.orange} />
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

      {/* Enhanced Category Visualization */}
      <View style={[styles.section, { marginHorizontal: cardMargin, padding: cardPadding }]}>
        <View style={styles.sectionHeader}>
          <PieChart size={isSmallScreen ? 18 : 20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
        </View>
        
        {/* Visual Chart */}
        <View style={styles.chartContainer}>
          {categoryStats.filter((cat: any) => cat.total > 0).slice(0, 5).map((category: any, index: number) => {
            const maxTotal = categoryStats[0]?.total || 1;
            const barWidth = (category.total / maxTotal) * 100;
            
            return (
              <View key={category.id} style={styles.chartBar}>
                <View style={styles.chartBarInfo}>
                  <View style={styles.chartBarLabel}>
                    <View style={[styles.chartBarDot, { backgroundColor: category.color }]} />
                    <Text style={styles.chartBarName} numberOfLines={1}>{category.name}</Text>
                  </View>
                  <Text style={styles.chartBarAmount}>${category.total.toFixed(0)}</Text>
                </View>
                <View style={styles.chartBarTrack}>
                  <Animated.View 
                    style={[
                      styles.chartBarFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: category.color
                      }
                    ]}
                  />
                </View>
                <Text style={styles.chartBarPercentage}>{category.percentage.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
        
        {categoryStats.filter((cat: any) => cat.total > 0).length === 0 && (
          <Text style={styles.noData}>No expense data yet</Text>
        )}
      </View>

      {/* Budget vs Actual */}
      {budgets.length > 0 && (
        <View style={[styles.section, { marginHorizontal: cardMargin, padding: cardPadding }]}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={isSmallScreen ? 18 : 20} color={Colors.orange} />
            <Text style={styles.sectionTitle}>Budget vs Actual</Text>
          </View>
          
          {budgets.map((budget) => {
            const percentage = (budget.currentSpent / budget.monthlyLimit) * 100;
            const isOverBudget = budget.currentSpent > budget.monthlyLimit;
            
            return (
              <View key={budget.id} style={styles.budgetComparisonItem}>
                <View style={styles.budgetComparisonHeader}>
                  <Text style={styles.budgetComparisonCategory}>{budget.category}</Text>
                  <View style={styles.budgetComparisonAmounts}>
                    <Text style={[
                      styles.budgetComparisonActual,
                      isOverBudget && { color: Colors.error }
                    ]}>
                      ${budget.currentSpent.toFixed(0)}
                    </Text>
                    <Text style={styles.budgetComparisonBudget}>/ ${budget.monthlyLimit.toFixed(0)}</Text>
                  </View>
                </View>
                <View style={styles.budgetComparisonBar}>
                  <View 
                    style={[
                      styles.budgetComparisonFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverBudget ? Colors.error : 
                          percentage > 80 ? Colors.orange : Colors.secondary
                      }
                    ]}
                  />
                  {isOverBudget && (
                    <View 
                      style={[
                        styles.budgetComparisonOverage,
                        {
                          width: `${Math.min((percentage - 100), 50)}%`,
                        }
                      ]}
                    />
                  )}
                </View>
                <View style={styles.budgetComparisonFooter}>
                  <Text style={[
                    styles.budgetComparisonPercentage,
                    isOverBudget && { color: Colors.error }
                  ]}>
                    {percentage.toFixed(0)}% used
                  </Text>
                  {isOverBudget && (
                    <Text style={styles.budgetComparisonOverageText}>
                      ${(budget.currentSpent - budget.monthlyLimit).toFixed(0)} over
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.section, { marginHorizontal: cardMargin, padding: cardPadding }]}>
        <View style={[styles.sectionHeader, isSmallScreen && { flexWrap: 'wrap' }]}>
          <Calendar size={isSmallScreen ? 18 : 20} color={Colors.primary} />
          <Text style={[styles.sectionTitle, { flex: 1 }]}>Spending Trends</Text>
          <View style={styles.timeframeSelector}>
            {(['month', 'quarter', 'year'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                onPress={() => setSelectedTimeframe(timeframe)}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive,
                  isSmallScreen && { width: 24, height: 24, borderRadius: 12 }
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

      <View style={[styles.insightCard, { marginHorizontal: cardMargin, padding: cardPadding }]}>
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
  summaryStatsSmall: {
    flexDirection: 'column',
    gap: Spacing.lg,
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
  summaryValueSmall: {
    fontSize: Typography.base,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    minHeight: 56,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
  },

  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: Typography.sm,
    color: Colors.gray800,
    fontWeight: Typography.semibold,
    flex: 1,
  },

  categoryCount: {
    fontSize: Typography.xs,
    color: Colors.gray400,
    marginLeft: Spacing.xs,
  },
  categoryStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 90,
    flexShrink: 0,
  },

  categoryAmount: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.gray900,
    textAlign: 'right',
    lineHeight: 20,
  },

  categoryPercentage: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    fontWeight: Typography.medium,
    textAlign: 'right',
    marginTop: 1,
    lineHeight: 14,
  },

  viewAllButton: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium,
    marginLeft: 'auto',
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
  chartContainer: {
    marginBottom: Spacing.lg,
  },
  chartBar: {
    marginBottom: Spacing.lg,
  },
  chartBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  chartBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartBarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  chartBarName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.gray800,
    flex: 1,
  },
  chartBarAmount: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.gray900,
  },
  chartBarTrack: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartBarPercentage: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    textAlign: 'right',
  },
  budgetComparisonItem: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
  },
  budgetComparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetComparisonCategory: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.gray800,
  },
  budgetComparisonAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetComparisonActual: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.gray900,
  },
  budgetComparisonBudget: {
    fontSize: Typography.sm,
    color: Colors.gray600,
    marginLeft: 2,
  },
  budgetComparisonBar: {
    height: 12,
    backgroundColor: Colors.gray200,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  budgetComparisonFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetComparisonOverage: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    backgroundColor: Colors.error,
    opacity: 0.7,
  },
  budgetComparisonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetComparisonPercentage: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.gray600,
  },
  budgetComparisonOverageText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.error,
  },
});