import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Receipt } from '@/types/receipt';
import { useAuth } from '@/hooks/auth-store';
import { useReceipts, useBudgets } from '@/hooks/receipt-store-supabase';
import { LogOut, User, Mail, Shield, HelpCircle, Info, ChevronRight, Trash2, Download, RefreshCw, Plus, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/design-system';
import { router } from 'expo-router';

import { DEFAULT_CATEGORIES } from '@/constants/categories';

export default function SettingsScreen() {
  const { user, signOut, resetPassword } = useAuth();
  const { receipts, deleteReceipt } = useReceipts();
  const { budgets, setBudget, removeBudget } = useBudgets();
  const [isSigningOut, setIsSigningOut] = useState(false);


  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            console.log('Signing out...');
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } else {
              router.replace('/auth');
            }
            setIsSigningOut(false);
          },
        },
      ]
    );
  };

  const handleResetPassword = () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address found for your account.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send a password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            const { error } = await resetPassword(user.email!);
            if (error) {
              Alert.alert('Error', 'Failed to send reset email. Please try again.');
            } else {
              Alert.alert(
                'Email Sent',
                'Check your email for password reset instructions.'
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your receipts and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This will delete all your receipts permanently.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete all receipts
                      for (const receipt of receipts) {
                        await deleteReceipt(receipt.id);
                      }
                      Alert.alert('Success', 'All data has been deleted.');
                    } catch (deleteError) {
                      console.error('Delete error:', deleteError);
                      Alert.alert('Error', 'Failed to delete some data. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    if (receipts.length === 0) {
      Alert.alert('No Data', 'You have no receipts to export.');
      return;
    }

    const csvData = receipts.map((receipt: Receipt) => ({
      Date: new Date(receipt.receiptDate).toLocaleDateString(),
      Merchant: receipt.merchant,
      Category: receipt.category,
      Total: receipt.total,
      Tax: receipt.tax,
      Items: receipt.items.map((item: any) => `${item.name}: ${item.price}`).join('; '),
      Notes: receipt.notes || '',
    }));
    
    console.log('CSV data prepared:', csvData.length, 'rows');

    // In a real app, you'd implement proper CSV export
    Alert.alert(
      'Export Data',
      `Ready to export ${receipts.length} receipts. This feature will be available in a future update.`
    );
  };

  const handleContactSupport = () => {
    const email = 'support@receiptscanner.com';
    const subject = 'Receipt Scanner Support Request';
    const body = `Hi,\n\nI need help with the Receipt Scanner app.\n\nDevice: ${Platform.OS}\nUser: ${user?.email || 'Guest'}\n\nDescription:\n`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            `Please contact support at: ${email}`
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Not Available',
          `Please contact support at: ${email}`
        );
      });
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your receipt data is stored securely and never shared with third parties. We only collect data necessary for app functionality.'
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'By using this app, you agree to use it responsibly and in accordance with applicable laws.'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Receipt Scanner',
      `Version: 1.0.0\nBuild: ${Platform.OS === 'ios' ? 'iOS' : 'Android'}\n\nA secure and easy way to manage your receipts and expenses.\n\nDeveloped with ❤️ for small businesses and individuals.`
    );
  };



  const accountItems = [
    {
      icon: Mail,
      title: 'Reset Password',
      subtitle: 'Change your account password',
      onPress: handleResetPassword,
      disabled: !user,
    },
  ];

  const privacyItems = [
    {
      icon: Shield,
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: handlePrivacyPolicy,
    },
    {
      icon: Info,
      title: 'Terms of Service',
      subtitle: 'App usage terms and conditions',
      onPress: handleTermsOfService,
    },
  ];

  const dataItems = [
    {
      icon: Download,
      title: 'Export Data',
      subtitle: 'Download your receipts as CSV',
      onPress: handleExportData,
    },
    {
      icon: Trash2,
      title: 'Delete All Data',
      subtitle: 'Permanently remove all receipts',
      onPress: handleDeleteAllData,
      destructive: true,
    },
  ];



  const supportItems = [
    {
      icon: HelpCircle,
      title: 'Contact Support',
      subtitle: 'Get help with the app',
      onPress: handleContactSupport,
    },
    {
      icon: Info,
      title: 'About',
      subtitle: 'App version and information',
      onPress: handleAbout,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#1E40AF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] || 'Guest User'}
              </Text>
              <View style={styles.emailContainer}>
                <Mail size={16} color="#6B7280" />
                <Text style={styles.userEmail}>
                  {user?.email || 'Not signed in'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {accountItems.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.settingItem, item.disabled && styles.disabledItem]}
                onPress={item.disabled ? undefined : item.onPress}
                disabled={item.disabled}
              >
                <View style={styles.settingIcon}>
                  <item.icon size={20} color={item.disabled ? "#D1D5DB" : "#6B7280"} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, item.disabled && styles.disabledText]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, item.disabled && styles.disabledText]}>
                    {item.subtitle}
                  </Text>
                </View>
                <ChevronRight size={16} color={item.disabled ? "#D1D5DB" : "#9CA3AF"} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          {privacyItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingIcon}>
                <item.icon size={20} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Management</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowBudgetModal(true)}
          >
            <View style={styles.settingIcon}>
              <Plus size={20} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Add Budget</Text>
              <Text style={styles.settingSubtitle}>Set monthly spending limits</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {budgets.map((budget) => {
            const percentage = (budget.currentSpent / budget.monthlyLimit) * 100;
            const isOverBudget = budget.currentSpent > budget.monthlyLimit;
            
            return (
              <View key={budget.id} style={styles.budgetItem}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={[
                    styles.budgetAmount,
                    isOverBudget && { color: '#DC2626' }
                  ]}>
                    ${budget.currentSpent.toFixed(0)} / ${budget.monthlyLimit.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.budgetProgressContainer}>
                  <View style={styles.budgetProgressBar}>
                    <View 
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOverBudget ? '#DC2626' : 
                            percentage > 80 ? '#F59E0B' : '#10B981'
                        }
                      ]}
                    />
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeBudget(budget.id)}
                    style={styles.deleteBudgetButton}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          {dataItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingIcon}>
                <item.icon size={20} color={item.destructive ? "#DC2626" : "#6B7280"} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
                  {item.title}
                </Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingIcon}>
                <item.icon size={20} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {user && (
          <View style={styles.buttonSection}>
            <Button
              title={isSigningOut ? "Signing Out..." : "Sign Out"}
              variant="error"
              onPress={handleSignOut}
              disabled={isSigningOut}
              icon={isSigningOut ? <RefreshCw size={20} color={Colors.white} /> : <LogOut size={20} color={Colors.white} />}
              testID="sign-out-button"
            />
          </View>
        )}

        {!user && (
          <View style={styles.buttonSection}>
            <Button
              title="Sign In"
              variant="primary"
              onPress={() => router.push('/auth')}
              icon={<User size={20} color={Colors.white} />}
              testID="sign-in-button"
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Receipt Scanner v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Secure receipt management for businesses
          </Text>
        </View>
      </ScrollView>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget</Text>
              <TouchableOpacity 
                onPress={() => setShowBudgetModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelector}
              >
                {DEFAULT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.name && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category.name && styles.categoryOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Monthly Limit</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              
              <TouchableOpacity
                style={[
                  styles.addBudgetButton,
                  (!selectedCategory || !budgetAmount) && styles.addBudgetButtonDisabled
                ]}
                onPress={async () => {
                  if (selectedCategory && budgetAmount) {
                    await setBudget(selectedCategory, parseFloat(budgetAmount));
                    setSelectedCategory('');
                    setBudgetAmount('');
                    setShowBudgetModal(false);
                  }
                }}
                disabled={!selectedCategory || !budgetAmount}
              >
                <Text style={[
                  styles.addBudgetButtonText,
                  (!selectedCategory || !budgetAmount) && styles.addBudgetButtonTextDisabled
                ]}>
                  Add Budget
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#D1D5DB',
  },
  destructiveText: {
    color: '#DC2626',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  buttonSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  budgetItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  deleteBudgetButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  categorySelector: {
    marginBottom: 20,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#1E40AF',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  addBudgetButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addBudgetButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addBudgetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addBudgetButtonTextDisabled: {
    color: '#9CA3AF',
  },
});