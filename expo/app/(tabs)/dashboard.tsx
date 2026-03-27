import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Receipt, DollarSign, Calendar, BarChart3, Camera, FileText, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useReceipts, useBudgets } from '@/hooks/receipt-store-supabase';
import { ReceiptCard } from '@/components/ReceiptCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/design-system';
import { DEFAULT_CATEGORIES } from '@/constants/categories';


import type { Receipt as ReceiptType } from '@/types/receipt';

export default function DashboardScreen() {
  const { receipts, isLoading, categories } = useReceipts();
  const { budgets, alerts } = useBudgets();


  // Sort receipts by date (newest first) for dashboard
  const sortedReceipts = receipts.sort((a: ReceiptType, b: ReceiptType) => 
    new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime()
  );
  
  const recentReceipts = sortedReceipts.slice(0, 3);
  
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Enhanced statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Current month receipts
    const currentMonthReceipts = receipts.filter((r: ReceiptType) => {
      const receiptDate = new Date(r.receiptDate);
      return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
    });
    
    // Last month receipts
    const lastMonthReceipts = receipts.filter((r: ReceiptType) => {
      const receiptDate = new Date(r.receiptDate);
      return receiptDate.getMonth() === lastMonth && receiptDate.getFullYear() === lastMonthYear;
    });
    
    // This week receipts
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekReceipts = receipts.filter((r: ReceiptType) => {
      const receiptDate = new Date(r.receiptDate);
      return receiptDate >= weekStart;
    });
    
    const totalExpenses = receipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const monthTotal = currentMonthReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const lastMonthTotal = lastMonthReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const weekTotal = thisWeekReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const avgPerReceipt = receipts.length > 0 ? totalExpenses / receipts.length : 0;
    
    // Calculate month-over-month change
    const monthChange = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    // Category breakdown
    const categoryStats = DEFAULT_CATEGORIES.map(cat => {
      const categoryReceipts = receipts.filter((r: ReceiptType) => r.category === cat.name);
      const total = categoryReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
      return {
        ...cat,
        total,
        count: categoryReceipts.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);
    
    return {
      totalExpenses,
      monthTotal,
      lastMonthTotal,
      weekTotal,
      avgPerReceipt,
      monthChange,
      totalCount: receipts.length,
      monthCount: currentMonthReceipts.length,
      weekCount: thisWeekReceipts.length,
      categoryStats: categoryStats.slice(0, 4), // Top 4 categories
    };
  }, [receipts]);

  if (isLoading || !receipts || !categories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.date}>{currentMonth}</Text>
          <View style={styles.monthlyInsight}>
            <Text style={styles.monthlyAmount}>${stats.monthTotal.toFixed(2)}</Text>
            <View style={styles.changeIndicator}>
              {stats.monthChange >= 0 ? (
                <ArrowUpRight size={14} color={Colors.orangeLight} />
              ) : (
                <ArrowDownRight size={14} color={Colors.secondaryLight} />
              )}
              <Text style={[styles.changeText, { 
                color: stats.monthChange >= 0 ? Colors.orangeLight : Colors.secondaryLight 
              }]}>
                {Math.abs(stats.monthChange).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.quickActionContent}
          >
            <Camera size={24} color="white" />
            <Text style={styles.quickActionTextPrimary} numberOfLines={2}>Scan Receipt</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/analytics')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionContent}>
            <BarChart3 size={24} color={Colors.accent} />
            <Text style={styles.quickActionLabel} numberOfLines={2}>Analytics</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/receipts')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionContent}>
            <FileText size={24} color={Colors.secondary} />
            <Text style={styles.quickActionLabel} numberOfLines={2}>All Receipts</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {alerts.slice(0, 2).map((alert) => (
            <View 
              key={alert.id} 
              style={[
                styles.alertCard,
                { borderLeftColor: alert.type === 'exceeded' ? Colors.error : Colors.orange }
              ]}
            >
              <Text style={[
                styles.alertTitle,
                { color: alert.type === 'exceeded' ? Colors.error : Colors.orange }
              ]}>
                {alert.type === 'exceeded' ? '⚠️ Budget Exceeded' : '⚡ Budget Warning'}
              </Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Enhanced Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondaryBackground }]}>
              <DollarSign size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <Text style={styles.statValue}>${stats.totalExpenses.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{stats.totalCount} receipts</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.orangeBackground }]}>
              <Calendar size={18} color={Colors.orange} />
            </View>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <Text style={styles.statValue}>${stats.monthTotal.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{stats.monthCount} receipts</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentBackground }]}>
              <TrendingUp size={18} color={Colors.accent} />
            </View>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <Text style={styles.statValue}>${stats.weekTotal.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{stats.weekCount} receipts</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primaryBackground }]}>
              <Target size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statLabel}>Avg per Receipt</Text>
          </View>
          <Text style={styles.statValue}>${stats.avgPerReceipt.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>average amount</Text>
        </View>
      </View>

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.budgetCard}>
            {budgets.slice(0, 3).map((budget) => {
              const percentage = Math.min((budget.currentSpent / budget.monthlyLimit) * 100, 100);
              const isOverBudget = budget.currentSpent > budget.monthlyLimit;
              
              return (
                <View key={budget.id} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text style={[
                      styles.budgetAmount,
                      isOverBudget && { color: Colors.error }
                    ]}>
                      ${budget.currentSpent.toFixed(0)} / ${budget.monthlyLimit.toFixed(0)}
                    </Text>
                  </View>
                  <View style={styles.budgetProgressBar}>
                    <View 
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: isOverBudget ? Colors.error : 
                            percentage > 80 ? Colors.orange : Colors.secondary
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.budgetPercentage}>
                    {percentage.toFixed(0)}% used
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Top Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoriesCard}>
          <View style={styles.categoriesContainer}>
            {stats.categoryStats.map((category, index) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryAmount}>${category.total.toFixed(2)}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Receipts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/receipts')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentReceipts.length > 0 ? (
          recentReceipts.map((receipt: ReceiptType) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Receipt size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No receipts yet</Text>
            <Text style={styles.emptySubtext}>Tap the button above to scan your first receipt</Text>
          </View>
        )}
      </View>

      <View style={styles.quickTip}>
        <TrendingUp size={20} color={Colors.primary} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Pro Tip</Text>
          <Text style={styles.tipText}>
            Scan receipts immediately after purchase for better accuracy
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  monthlyInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthlyAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    height: 88,
    minWidth: 0,
  },
  quickActionContent: {
    backgroundColor: Colors.white,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gray100,
    height: '100%',
    minWidth: 0,
  },
  quickActionTextPrimary: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  quickActionLabel: {
    color: Colors.gray700,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    maxWidth: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray600,
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.gray900,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '500',
  },
  categoriesCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 32,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    minWidth: 0,
    paddingRight: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray700,
    flex: 1,
    minWidth: 0,
  },
  categoryStats: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 60,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray900,
  },
  categoryPercentage: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray900,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  quickTip: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryBackground,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '20',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    color: Colors.primaryLight,
    lineHeight: 18,
    fontWeight: '500',
  },
  alertsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: Colors.gray600,
    lineHeight: 18,
  },
  budgetCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    gap: 16,
  },
  budgetItem: {
    gap: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray800,
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray600,
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetPercentage: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '500',
  },
});