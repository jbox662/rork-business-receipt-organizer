import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Plus, TrendingUp, Receipt, DollarSign, Calendar } from 'lucide-react-native';
import { useReceipts } from '@/hooks/receipt-store-supabase';
import { ReceiptCard } from '@/components/ReceiptCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/design-system';

import type { Receipt as ReceiptType } from '@/types/receipt';

export default function DashboardScreen() {
  const { receipts, isLoading, categories } = useReceipts();

  // Sort receipts by date (newest first) for dashboard
  const sortedReceipts = receipts.sort((a: ReceiptType, b: ReceiptType) => 
    new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime()
  );
  
  const recentReceipts = sortedReceipts.slice(0, 3);
  
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Calculate totals from all receipts (not filtered)
  const totalExpenses = receipts.reduce((sum: number, r: ReceiptType) => sum + r.total, 0);
  const totalCount = receipts.length;
  
  const monthTotal = receipts
    .filter((r: ReceiptType) => {
      const receiptDate = new Date(r.receiptDate);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && 
             receiptDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, r: ReceiptType) => sum + r.total, 0);

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
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.date}>{currentMonth}</Text>
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
          <View style={[styles.statIcon, { backgroundColor: Colors.secondaryBackground }]}>
            <DollarSign size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>${totalExpenses.toFixed(2)}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.orangeBackground }]}>
            <Calendar size={16} color={Colors.orange} />
          </View>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>${monthTotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accentBackground }]}>
            <Receipt size={16} color={Colors.accent} />
          </View>
          <Text style={styles.statLabel}>Total Receipts</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{totalCount}</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
    minHeight: 90,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Shadows.sm,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.gray500,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray900,
    textAlign: 'center',
    flexShrink: 1,
    numberOfLines: 1,
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
});