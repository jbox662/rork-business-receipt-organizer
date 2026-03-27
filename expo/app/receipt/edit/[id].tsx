import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Save, Plus, Minus } from 'lucide-react-native';
import { useReceiptById, useReceipts } from '@/hooks/receipt-store-supabase';
import { Receipt, ReceiptItem } from '@/types/receipt';
import { CategoryPill } from '@/components/CategoryPill';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, CommonStyles } from '@/constants/design-system';

export default function EditReceiptScreen() {
  const { id } = useLocalSearchParams();
  const receipt = useReceiptById(id as string);
  const { updateReceipt, categories } = useReceipts();
  const insets = useSafeAreaInsets();
  
  const [merchant, setMerchant] = useState('');
  const [total, setTotal] = useState('');
  const [tax, setTax] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [category, setCategory] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (receipt) {
      setMerchant(receipt.merchant || '');
      setTotal(receipt.total?.toString() || '');
      setTax(receipt.tax?.toString() || '');
      setSubtotal(receipt.subtotal?.toString() || '');
      setCategory(receipt.category || '');
      setReceiptDate(receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : '');
      setPaymentMethod(receipt.paymentMethod || '');
      setNotes(receipt.notes || '');
      setItems(receipt.items || []);
    }
  }, [receipt]);

  if (!receipt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Receipt not found</Text>
      </View>
    );
  }

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total for item
    if (field === 'quantity' || field === 'price') {
      const item = updatedItems[index];
      item.total = item.quantity * item.price;
    }
    
    setItems(updatedItems);
  };

  const handleSave = async () => {
    if (!merchant.trim()) {
      Alert.alert('Error', 'Please enter a merchant name');
      return;
    }
    
    if (!total || isNaN(parseFloat(total))) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return;
    }
    
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    if (!receiptDate) {
      Alert.alert('Error', 'Please enter a receipt date');
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedReceipt: Receipt = {
        ...receipt,
        merchant: merchant.trim(),
        total: parseFloat(total),
        tax: parseFloat(tax) || 0,
        subtotal: parseFloat(subtotal) || (parseFloat(total) - (parseFloat(tax) || 0)),
        category,
        receiptDate: new Date(receiptDate).toISOString(),
        paymentMethod: paymentMethod.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.filter(item => item.name.trim() !== ''),
        updatedAt: new Date().toISOString(),
      };
      
      await updateReceipt(updatedReceipt);
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      router.back();
    } catch (error: any) {
      console.error('Error updating receipt:', error);
      Alert.alert('Error', error.message || 'Failed to update receipt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Edit Receipt',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isLoading}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            >
              <Save size={20} color={isLoading ? '#9CA3AF' : '#3B82F6'} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant Name *</Text>
              <TextInput
                style={styles.input}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Enter merchant name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Total Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={total}
                  onChangeText={setTotal}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Tax</Text>
                <TextInput
                  style={styles.input}
                  value={tax}
                  onChangeText={setTax}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt Date *</Text>
              <TextInput
                style={styles.input}
                value={receiptDate}
                onChangeText={setReceiptDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <TextInput
                style={styles.input}
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="Credit Card, Cash, etc."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat: any) => (
                <CategoryPill
                  key={cat.id}
                  category={cat}
                  isSelected={category === cat.name}
                  onPress={() => setCategory(cat.name)}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity onPress={addItem} style={styles.addButton}>
                <Plus size={16} color="#3B82F6" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
            
            {items.map((item, index) => (
              <View key={`item-${index}-${item.name}`} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  <TouchableOpacity 
                    onPress={() => removeItem(index)}
                    style={styles.removeButton}
                  >
                    <Minus size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.input}
                  value={item.name}
                  onChangeText={(value) => updateItem(index, 'name', value)}
                  placeholder="Item name"
                  placeholderTextColor="#9CA3AF"
                />
                
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 0)}
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>Price Each</Text>
                    <TextInput
                      style={styles.input}
                      value={item.price.toString()}
                      onChangeText={(value) => updateItem(index, 'price', parseFloat(value) || 0)}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalText}>Total: ${item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  removeButton: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  itemTotal: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  bottomPadding: {
    height: 32,
  },
});