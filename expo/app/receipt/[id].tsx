import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Trash2, Calendar, CreditCard, Tag, Receipt as ReceiptIcon, Edit3, Maximize2 } from 'lucide-react-native';
import { useReceiptById, useReceipts } from '@/hooks/receipt-store-supabase';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageViewer from '@/components/ImageViewer';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams();
  const receipt = useReceiptById(id as string);
  const { deleteReceipt } = useReceipts();
  const insets = useSafeAreaInsets();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  
  console.log('ReceiptDetail render - Receipt ID:', id);
  console.log('ReceiptDetail render - Receipt found:', !!receipt);
  console.log('ReceiptDetail render - Image URI:', receipt?.imageUri);
  console.log('ReceiptDetail render - Platform:', Platform.OS);
  console.log('ReceiptDetail render - User Agent:', Platform.OS === 'web' ? navigator.userAgent : 'N/A');

  if (!receipt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Receipt not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            deleteReceipt(receipt.id);
            if (Platform.OS !== 'web') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.safeContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        {receipt.imageUri && receipt.imageUri.trim() !== '' && (receipt.imageUri.startsWith('http') || receipt.imageUri.startsWith('data:') || receipt.imageUri.startsWith('file:')) ? (
          <>
            <Image 
              source={{ uri: receipt.imageUri }} 
              style={styles.receiptImage}
              onError={(error) => {
                console.log('ReceiptDetail: Image failed to load for receipt:', receipt.id);
                console.log('ReceiptDetail: Image URI:', receipt.imageUri);
                console.log('ReceiptDetail: Error details:', error.nativeEvent?.error);
              }}
              onLoad={() => {
                console.log('ReceiptDetail: Image loaded successfully for receipt:', receipt.id);
              }}
            />
            <TouchableOpacity 
              style={styles.fullscreenButton}
              onPress={() => setImageViewerVisible(true)}
              activeOpacity={0.8}
            >
              <Maximize2 size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.receiptImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
      </View>

      <View style={styles.merchantCard}>
        <Text style={styles.merchantName}>{receipt.merchant}</Text>
        <Text style={styles.totalAmount}>${(receipt.total || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Date</Text>
          </View>
          <Text style={styles.detailValue}>
            {new Date(receipt.receiptDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Tag size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Category</Text>
          </View>
          <Text style={styles.detailValue}>{receipt.category}</Text>
        </View>

        {receipt.paymentMethod && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <CreditCard size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Payment</Text>
            </View>
            <Text style={styles.detailValue}>{receipt.paymentMethod}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <ReceiptIcon size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Scanned</Text>
          </View>
          <Text style={styles.detailValue}>
            {new Date(receipt.dateScanned).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Price Breakdown</Text>
        
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Subtotal</Text>
          <Text style={styles.breakdownValue}>${(receipt.subtotal || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Tax</Text>
          <Text style={styles.breakdownValue}>${(receipt.tax || 0).toFixed(2)}</Text>
        </View>
        
        <View style={[styles.breakdownRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${(receipt.total || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.itemsCard}>
        <Text style={styles.itemsTitle}>Items ({receipt.items.length})</Text>
        
        {receipt.items.map((item: any, index: number) => (
          <View key={`${item.name}-${index}`} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <View style={styles.itemPricing}>
              <Text style={styles.itemPrice}>${(item.price || 0).toFixed(2)} ea</Text>
              <Text style={styles.itemTotal}>${(item.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {receipt.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notesText}>{receipt.notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/receipt/edit/${receipt.id}`)}
        >
          <Edit3 size={20} color="#3B82F6" />
          <Text style={styles.editButtonText}>Edit Receipt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      
      {receipt.imageUri && receipt.imageUri.trim() !== '' && (receipt.imageUri.startsWith('http') || receipt.imageUri.startsWith('data:') || receipt.imageUri.startsWith('file:')) && (
        <ImageViewer
          visible={imageViewerVisible}
          imageUri={receipt.imageUri}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
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
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  merchantCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  breakdownCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  itemsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notesCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});