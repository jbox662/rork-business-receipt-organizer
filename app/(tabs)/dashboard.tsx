import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Plus, TrendingUp, Receipt, DollarSign, Calendar, BarChart3, PieChart, ArrowUp, ArrowDown, Target, ShoppingBag, CreditCard, Clock } from 'lucide-react-native';
import { useReceipts, useCategoryStats } from '@/hooks/receipt-store-supabase';
import { ReceiptCard } from '@/components/ReceiptCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius } from '@/constants/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Receipt as ReceiptType } from '@/types/receipt';

export default function DashboardScreen() {
  const { receipts, isLoading, categories } = useReceipts();
  const categoryStats = useCategoryStats();
  const insets = useSafeAreaInsets();

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
    
    // Calculate totals
    const totalExpenses = receipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const monthTotal = currentMonthReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const lastMonthTotal = lastMonthReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    const weekTotal = thisWeekReceipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
    
    // Calculate changes
    const monthChange = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const avgPerReceipt = receipts.length > 0 ? totalExpenses / receipts.length : 0;
    
    // Top category
    const topCategory = categoryStats.length > 0 ? categoryStats[0] : null;
    
    return {
      totalExpenses,
      totalCount: receipts.length,
      monthTotal,
      monthCount: currentMonthReceipts.length,
      weekTotal,
      weekCount: thisWeekReceipts.length,
      monthChange,
      avgPerReceipt,
      topCategory,
      lastMonthTotal,
    };
  }, [receipts, categoryStats]);

  if (isLoading || !receipts || !categories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.date}>{currentMonth}</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>${stats.monthTotal.toFixed(0)}</Text>
              <Text style={styles.headerStatLabel}>This Month</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.monthCount}</Text>
              <Text style={styles.headerStatLabel}>Receipts</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
        >
          <Plus size={20} color="white" />
          <Text style={styles.scanButtonText}>Scan Receipt</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondaryBackground }]}>
              <DollarSign size={12} color={Colors.secondary} />
            </View>
            <View style={styles.statTrend}>
              {stats.monthChange > 0 ? (
                <ArrowUp size={12} color={Colors.success} />
              ) : stats.monthChange < 0 ? (
                <ArrowDown size={12} color={Colors.error} />
              ) : null}
              {stats.monthChange !== 0 && (
                <Text style={[styles.trendText, { color: stats.monthChange > 0 ? Colors.success : Colors.error }]}>
                  {Math.abs(stats.monthChange).toFixed(1)}%
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={styles.statValue}>${stats.totalExpenses.toFixed(0)}</Text>
          <Text style={styles.statSubtext}>All time</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.orangeBackground }]}>
              <Calendar size={12} color={Colors.orange} />
            </View>
          </View>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>${stats.weekTotal.toFixed(0)}</Text>
          <Text style={styles.statSubtext}>{stats.weekCount} receipts</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentBackground }]}>
              <Target size={12} color={Colors.accent} />
            </View>
          </View>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>${stats.avgPerReceipt.toFixed(0)}</Text>
          <Text style={styles.statSubtext}>per receipt</Text>
        </View>
      </View>
      
      {/* Enhanced Analytics Cards */}
      <View style={styles.analyticsSection}>
        <View style={styles.analyticsRow}>
          <TouchableOpacity 
            style={[styles.analyticsCard, styles.analyticsCardLarge]}
            onPress={() => router.push('/(tabs)/analytics')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              style={styles.analyticsGradient}
            >
              <View style={styles.analyticsHeader}>
                <BarChart3 size={24} color="white" />
                <Text style={styles.analyticsTitle}>Spending Insights</Text>
              </View>
              <Text style={styles.analyticsValue}>${stats.monthTotal.toFixed(0)}</Text>
              <Text style={styles.analyticsSubtitle}>This month vs ${stats.lastMonthTotal.toFixed(0)} last month</Text>
              <View style={styles.analyticsFooter}>
                <Text style={styles.analyticsFooterText}>View detailed analytics</Text>
                <ArrowUp size={16} color="rgba(255,255,255,0.8)" style={styles.rotatedArrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.analyticsColumn}>
            <View style={[styles.analyticsCard, styles.analyticsCardSmall]}>
              <View style={styles.smallCardHeader}>
                <View style={[styles.smallCardIcon, { backgroundColor: Colors.successLight }]}>
                  <ShoppingBag size={12} color={Colors.success} />
                </View>
                <Text style={styles.smallCardTitle}>Top Category</Text>
              </View>
              <Text style={styles.smallCardValue}>
                {stats.topCategory ? stats.topCategory.name : 'None'}
              </Text>
              <Text style={styles.smallCardSubtext}>
                ${stats.topCategory ? stats.topCategory.total.toFixed(0) : '0'}
              </Text>
            </View>
            
            <View style={[styles.analyticsCard, styles.analyticsCardSmall]}>
              <View style={styles.smallCardHeader}>
                <View style={[styles.smallCardIcon, { backgroundColor: Colors.infoLight }]}>
                  <Clock size={12} color={Colors.info} />
                </View>
                <Text style={styles.smallCardTitle}>Recent Activity</Text>
              </View>
              <Text style={styles.smallCardValue}>{stats.weekCount}</Text>
              <Text style={styles.smallCardSubtext}>receipts this week</Text>
            </View>
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

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/analytics')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryBackground }]}>
              <PieChart size={16} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/receipts')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondaryBackground }]}>
              <Receipt size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>All Receipts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/scan')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.orangeBackground }]}>
              <Plus size={16} color={Colors.orange} />
            </View>
            <Text style={styles.quickActionText}>Scan New</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accentBackground }]}>
              <CreditCard size={16} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.quickTip}>
        <TrendingUp size={20} color={Colors.primary} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Smart Insights</Text>
          <Text style={styles.tipText}>
            {stats.monthChange > 10 
              ? `You're spending ${stats.monthChange.toFixed(1)}% more this month. Consider reviewing your expenses.`
              : stats.monthChange < -10
              ? `Great job! You've reduced spending by ${Math.abs(stats.monthChange).toFixed(1)}% this month.`
              : 'Your spending is consistent. Keep tracking to identify trends.'}
          </Text>
        </View>
      </View>
    </ScrollView>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginBottom: 20,
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
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.md,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 16,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    height: 100,
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray500,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.gray900,
    marginBottom: 2,
    lineHeight: 22,
  },
  statSubtext: {
    fontSize: 10,
    color: Colors.gray400,
    fontWeight: '500',
  },
  analyticsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsColumn: {
    flex: 1,
    gap: 12,
  },
  analyticsCard: {
    borderRadius: BorderRadius['2xl'],
    ...Shadows.lg,
    overflow: 'hidden',
  },
  analyticsCardLarge: {
    flex: 2,
  },
  analyticsCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    minHeight: 64,
    justifyContent: 'space-between',
  },
  analyticsGradient: {
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  analyticsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsFooterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  smallCardIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray600,
  },
  smallCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray900,
    marginBottom: 1,
  },
  smallCardSubtext: {
    fontSize: 10,
    color: Colors.gray500,
    fontWeight: '500',
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
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
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 10,
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.gray100,
    minHeight: 60,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
  },
  quickTip: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryBackground,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    gap: 12,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '20',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
    fontWeight: '500',
  },
  rotatedArrow: {
    transform: [{ rotate: '45deg' }],
  },
});