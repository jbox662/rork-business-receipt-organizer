import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Receipt } from '@/types/receipt';
import { Calendar, DollarSign, Tag } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '@/constants/design-system';

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  console.log('ReceiptCard render - Receipt ID:', receipt.id);
  console.log('ReceiptCard render - Image URI:', receipt.imageUri);
  console.log('ReceiptCard render - Platform:', Platform.OS);
  console.log('ReceiptCard render - User Agent:', Platform.OS === 'web' ? navigator.userAgent : 'N/A');
  
  const handlePress = () => {
    router.push(`/receipt/${receipt.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {receipt.imageUri && receipt.imageUri.trim() !== '' && (receipt.imageUri.startsWith('http') || receipt.imageUri.startsWith('data:') || receipt.imageUri.startsWith('file:')) ? (
          <Image 
            source={{ uri: receipt.imageUri }} 
            style={styles.thumbnail}
            onError={(error) => {
              console.log('ReceiptCard: Image failed to load for receipt:', receipt.id);
              console.log('ReceiptCard: Image URI:', receipt.imageUri);
              console.log('ReceiptCard: Error details:', error.nativeEvent?.error);
            }}
            onLoad={() => {
              console.log('ReceiptCard: Image loaded successfully for receipt:', receipt.id);
            }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.merchant} numberOfLines={1}>{receipt.merchant}</Text>
        
        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Calendar size={14} color={Colors.gray500} />
            <Text style={styles.infoText} numberOfLines={1}>
              {new Date(receipt.receiptDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Tag size={14} color={Colors.gray500} />
            <Text style={styles.infoText} numberOfLines={1}>{receipt.category}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.amount}>
            <DollarSign size={16} color={Colors.secondary} />
            <Text style={styles.total}>${receipt.total.toFixed(2)}</Text>
          </View>
          <Text style={styles.itemCount}>{receipt.items.length} items</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    ...Shadows.sm,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  merchant: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  info: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  infoText: {
    fontSize: Typography.xs,
    color: Colors.gray600,
    fontWeight: Typography.medium,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  total: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.secondary,
  },
  itemCount: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  placeholderText: {
    fontSize: 10,
    color: Colors.gray500,
    fontWeight: Typography.semibold,
  },
});