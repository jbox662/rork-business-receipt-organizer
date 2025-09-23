import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Download,
  TrendingUp,
  PieChart,
  BarChart3,
  FileText,
  DollarSign,
  ShoppingBag,
  Target,
} from 'lucide-react-native';
import { useReceipts } from '@/hooks/receipt-store-supabase';
import { Receipt } from '@/types/receipt';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportType = 'summary' | 'category' | 'merchant' | 'trends' | 'detailed';

interface ReportData {
  totalSpent: number;
  totalReceipts: number;
  averagePerReceipt: number;
  topCategory: string;
  topMerchant: string;
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  merchantBreakdown: {
    merchant: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  dailyTrends: {
    date: string;
    amount: number;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export default function ReportsScreen() {
  const { receipts } = useReceipts();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('summary');
  const [customDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  // Filter receipts based on selected period
  const filteredReceipts = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (!customDateRange.start || !customDateRange.end) return receipts;
        startDate = customDateRange.start;
        endDate = customDateRange.end;
        break;
      default:
        return receipts;
    }

    return receipts.filter((receipt: Receipt) => {
      const receiptDate = new Date(receipt.receiptDate);
      return receiptDate >= startDate && receiptDate <= endDate;
    });
  }, [receipts, selectedPeriod, customDateRange]);

  // Generate report data
  const reportData = useMemo((): ReportData => {
    const totalSpent = filteredReceipts.reduce((sum: number, r: Receipt) => sum + r.total, 0);
    const totalReceipts = filteredReceipts.length;
    const averagePerReceipt = totalReceipts > 0 ? totalSpent / totalReceipts : 0;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    filteredReceipts.forEach((receipt: Receipt) => {
      const existing = categoryMap.get(receipt.category) || { amount: 0, count: 0 };
      categoryMap.set(receipt.category, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Merchant breakdown
    const merchantMap = new Map<string, { amount: number; count: number }>();
    filteredReceipts.forEach((receipt: Receipt) => {
      const existing = merchantMap.get(receipt.merchant) || { amount: 0, count: 0 };
      merchantMap.set(receipt.merchant, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    const merchantBreakdown = Array.from(merchantMap.entries())
      .map(([merchant, data]) => ({
        merchant,
        amount: data.amount,
        count: data.count,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 merchants

    // Daily trends (last 30 days)
    const dailyMap = new Map<string, { amount: number; count: number }>();
    const last30Days = filteredReceipts.filter((receipt: Receipt) => {
      const receiptDate = new Date(receipt.receiptDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return receiptDate >= thirtyDaysAgo;
    });

    last30Days.forEach((receipt: Receipt) => {
      const dateKey = new Date(receipt.receiptDate).toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { amount: 0, count: 0 };
      dailyMap.set(dateKey, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    const dailyTrends = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Monthly trends (last 12 months)
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    const last12Months = filteredReceipts.filter((receipt: Receipt) => {
      const receiptDate = new Date(receipt.receiptDate);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      return receiptDate >= twelveMonthsAgo;
    });

    last12Months.forEach((receipt: Receipt) => {
      const date = new Date(receipt.receiptDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { amount: 0, count: 0 };
      monthlyMap.set(monthKey, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalSpent,
      totalReceipts,
      averagePerReceipt,
      topCategory: categoryBreakdown[0]?.category || 'N/A',
      topMerchant: merchantBreakdown[0]?.merchant || 'N/A',
      categoryBreakdown,
      merchantBreakdown,
      dailyTrends,
      monthlyTrends,
    };
  }, [filteredReceipts]);

  const generateReportText = (): string => {
    const periodText = selectedPeriod === 'custom' 
      ? `${customDateRange.start?.toLocaleDateString()} - ${customDateRange.end?.toLocaleDateString()}`
      : selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);

    let report = `EXPENSE REPORT - ${periodText.toUpperCase()}\n`;
    report += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    report += `SUMMARY\n`;
    report += `Total Spent: $${reportData.totalSpent.toFixed(2)}\n`;
    report += `Total Receipts: ${reportData.totalReceipts}\n`;
    report += `Average per Receipt: $${reportData.averagePerReceipt.toFixed(2)}\n`;
    report += `Top Category: ${reportData.topCategory}\n`;
    report += `Top Merchant: ${reportData.topMerchant}\n\n`;
    
    report += `CATEGORY BREAKDOWN\n`;
    reportData.categoryBreakdown.forEach((cat, index) => {
      report += `${index + 1}. ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%) - ${cat.count} receipts\n`;
    });
    
    report += `\nTOP MERCHANTS\n`;
    reportData.merchantBreakdown.slice(0, 5).forEach((merchant, index) => {
      report += `${index + 1}. ${merchant.merchant}: $${merchant.amount.toFixed(2)} (${merchant.percentage.toFixed(1)}%) - ${merchant.count} receipts\n`;
    });
    
    if (selectedReportType === 'detailed') {
      report += `\nDETAILED RECEIPTS\n`;
      filteredReceipts.forEach((receipt: Receipt, index: number) => {
        report += `${index + 1}. ${new Date(receipt.receiptDate).toLocaleDateString()} - ${receipt.merchant} - ${receipt.total.toFixed(2)} (${receipt.category})\n`;
      });
    }
    
    return report;
  };

  const exportReport = async () => {
    try {
      const reportText = generateReportText();
      
      if (Platform.OS === 'web') {
        // For web, create a downloadable file
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Report downloaded successfully!');
        }
      } else {
        // For mobile, use Share API
        await Share.share({
          message: reportText,
          title: `Expense Report - ${selectedPeriod}`,
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to export report. Please try again.');
      } else {
        console.error('Failed to export report:', error);
      }
    }
  };

  const renderPeriodSelector = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Report Period</Text>
      <View style={styles.periodContainer}>
        {(['week', 'month', 'quarter', 'year'] as ReportPeriod[]).map((period) => {
          return (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => {
                if (period.trim() && period.length <= 20) {
                  setSelectedPeriod(period);
                }
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );

  const renderReportTypeSelector = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Report Type</Text>
      <View style={styles.reportTypeContainer}>
        {([
          { key: 'summary', label: 'Summary', icon: BarChart3 },
          { key: 'category', label: 'Category', icon: PieChart },
          { key: 'merchant', label: 'Merchant', icon: ShoppingBag },
          { key: 'trends', label: 'Trends', icon: TrendingUp },
          { key: 'detailed', label: 'Detailed', icon: FileText },
        ] as { key: ReportType; label: string; icon: any }[]).map((type) => {
          const IconComponent = type.icon;
          return (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.reportTypeButton,
                selectedReportType === type.key && styles.reportTypeButtonActive,
              ]}
              onPress={() => setSelectedReportType(type.key)}
            >
              <IconComponent
                size={20}
                color={selectedReportType === type.key ? '#1E40AF' : '#6B7280'}
              />
              <Text
                style={[
                  styles.reportTypeButtonText,
                  selectedReportType === type.key && styles.reportTypeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );

  const renderSummaryReport = () => (
    <>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <DollarSign size={24} color="#10B981" />
            <Text style={styles.summaryValue}>${reportData.totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryItem}>
            <FileText size={24} color="#3B82F6" />
            <Text style={styles.summaryValue}>{reportData.totalReceipts}</Text>
            <Text style={styles.summaryLabel}>Receipts</Text>
          </View>
          <View style={styles.summaryItem}>
            <Target size={24} color="#8B5CF6" />
            <Text style={styles.summaryValue}>${reportData.averagePerReceipt.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Average</Text>
          </View>
          <View style={styles.summaryItem}>
            <ShoppingBag size={24} color="#F59E0B" />
            <Text style={styles.summaryValue}>{reportData.topCategory}</Text>
            <Text style={styles.summaryLabel}>Top Category</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Top Categories</Text>
        {reportData.categoryBreakdown.slice(0, 5).map((cat, index) => (
          <View key={cat.category} style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownRank}>{index + 1}</Text>
              <View style={styles.breakdownDetails}>
                <Text style={styles.breakdownName}>{cat.category}</Text>
                <Text style={styles.breakdownSubtext}>{cat.count} receipts</Text>
              </View>
            </View>
            <View style={styles.breakdownAmount}>
              <Text style={styles.breakdownValue}>${cat.amount.toFixed(2)}</Text>
              <Text style={styles.breakdownPercentage}>{cat.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );

  const renderCategoryReport = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Category Breakdown</Text>
      {reportData.categoryBreakdown.map((cat, index) => (
        <View key={cat.category} style={styles.breakdownItem}>
          <View style={styles.breakdownInfo}>
            <Text style={styles.breakdownRank}>{index + 1}</Text>
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownName}>{cat.category}</Text>
              <Text style={styles.breakdownSubtext}>{cat.count} receipts</Text>
            </View>
          </View>
          <View style={styles.breakdownAmount}>
            <Text style={styles.breakdownValue}>${cat.amount.toFixed(2)}</Text>
            <Text style={styles.breakdownPercentage}>{cat.percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(cat.percentage, 100)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </Card>
  );

  const renderMerchantReport = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Top Merchants</Text>
      {reportData.merchantBreakdown.map((merchant, index) => (
        <View key={merchant.merchant} style={styles.breakdownItem}>
          <View style={styles.breakdownInfo}>
            <Text style={styles.breakdownRank}>{index + 1}</Text>
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownName}>{merchant.merchant}</Text>
              <Text style={styles.breakdownSubtext}>{merchant.count} visits</Text>
            </View>
          </View>
          <View style={styles.breakdownAmount}>
            <Text style={styles.breakdownValue}>${merchant.amount.toFixed(2)}</Text>
            <Text style={styles.breakdownPercentage}>{merchant.percentage.toFixed(1)}%</Text>
          </View>
        </View>
      ))}
    </Card>
  );

  const renderTrendsReport = () => (
    <>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Trends</Text>
        {reportData.monthlyTrends.slice(-6).map((trend) => {
          const [year, month] = trend.month.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          return (
            <View key={trend.month} style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendMonth}>{monthName}</Text>
                <Text style={styles.trendSubtext}>{trend.count} receipts</Text>
              </View>
              <Text style={styles.trendAmount}>${trend.amount.toFixed(2)}</Text>
            </View>
          );
        })}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Recent Daily Activity</Text>
        {reportData.dailyTrends.slice(-7).map((trend) => {
          const date = new Date(trend.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <View key={trend.date} style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendMonth}>{dayName}</Text>
                <Text style={styles.trendSubtext}>{trend.count} receipts</Text>
              </View>
              <Text style={styles.trendAmount}>${trend.amount.toFixed(2)}</Text>
            </View>
          );
        })}
      </Card>
    </>
  );

  const renderDetailedReport = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Detailed Receipts</Text>
      {filteredReceipts.slice(0, 20).map((receipt: Receipt, index: number) => (
        <View key={receipt.id} style={styles.detailedItem}>
          <View style={styles.detailedInfo}>
            <Text style={styles.detailedDate}>
              {new Date(receipt.receiptDate).toLocaleDateString()}
            </Text>
            <Text style={styles.detailedMerchant}>{receipt.merchant}</Text>
            <Text style={styles.detailedCategory}>{receipt.category}</Text>
          </View>
          <Text style={styles.detailedAmount}>${receipt.total.toFixed(2)}</Text>
        </View>
      ))}
      {filteredReceipts.length > 20 && (
        <Text style={styles.moreText}>
          ... and {filteredReceipts.length - 20} more receipts
        </Text>
      )}
    </Card>
  );

  const renderReportContent = () => {
    switch (selectedReportType) {
      case 'summary':
        return renderSummaryReport();
      case 'category':
        return renderCategoryReport();
      case 'merchant':
        return renderMerchantReport();
      case 'trends':
        return renderTrendsReport();
      case 'detailed':
        return renderDetailedReport();
      default:
        return renderSummaryReport();
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      showsVerticalScrollIndicator={false}
    >
      {renderPeriodSelector()}
      {renderReportTypeSelector()}
      
      <View style={styles.exportContainer}>
        <Button
          title="Export Report"
          onPress={exportReport}
          icon={<Download size={20} color="white" />}
          style={styles.exportButton}
        />
      </View>

      {renderReportContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  reportTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  reportTypeButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#1E40AF',
  },
  reportTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  reportTypeButtonTextActive: {
    color: '#1E40AF',
  },
  exportContainer: {
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: '#10B981',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    width: 24,
  },
  breakdownDetails: {
    flex: 1,
    marginLeft: 12,
  },
  breakdownName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  breakdownSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  breakdownAmount: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownPercentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 36,
    right: 0,
    height: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 1,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  trendInfo: {
    flex: 1,
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  trendSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailedInfo: {
    flex: 1,
  },
  detailedDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailedMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  detailedCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  detailedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  moreText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});