import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions, Animated, PanResponder, Alert, Dimensions } from 'react-native';
import { Receipt } from '@/types/receipt';
import { Calendar, DollarSign, Tag, Edit3, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '@/constants/design-system';
import { useReceipts } from '@/hooks/receipt-store-supabase';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 400;
  const { deleteReceipt } = useReceipts();
  const [isDeleting, setIsDeleting] = useState(false);
  
  console.log('ReceiptCard render - Receipt ID:', receipt.id);
  console.log('ReceiptCard render - Image URI:', receipt.imageUri);
  console.log('ReceiptCard render - Platform:', Platform.OS);
  console.log('ReceiptCard render - User Agent:', Platform.OS === 'web' ? navigator.userAgent : 'N/A');
  
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    router.push(`/receipt/${receipt.id}`);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      `Are you sure you want to delete the receipt from ${receipt.merchant}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            // Animate out
            Animated.parallel([
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              deleteReceipt(receipt.id);
            });
          },
        },
      ]
    );
  };
  
  const handleEdit = () => {
    router.push(`/receipt/edit/${receipt.id}`);
  };
  
  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderGrant: () => {
      translateX.setOffset((translateX as any)._value);
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow left swipe (negative dx)
      if (gestureState.dx < 0) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      translateX.flattenOffset();
      
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        // Swipe left to reveal actions
        Animated.spring(translateX, {
          toValue: -120,
          useNativeDriver: true,
        }).start();
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });
  
  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };
  
  if (isDeleting) {
    return null;
  }

  return (
    <View style={[styles.cardContainer, isSmallScreen && styles.cardContainerSmall]}>
      {/* Action buttons behind the card */}
      <View style={styles.actionsBackground}>
        <TouchableOpacity 
          style={[styles.actionBackgroundButton, { backgroundColor: Colors.primary }]}
          onPress={() => {
            resetSwipe();
            handleEdit();
          }}
        >
          <Edit3 size={20} color="white" />
          <Text style={styles.actionBackgroundText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBackgroundButton, { backgroundColor: Colors.error }]}
          onPress={() => {
            resetSwipe();
            handleDelete();
          }}
        >
          <Trash2 size={20} color="white" />
          <Text style={styles.actionBackgroundText}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX }, { scale }],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={[styles.card, isSmallScreen && styles.cardSmall]} onPress={handlePress} activeOpacity={0.7}>
          <View style={[styles.imageContainer, isSmallScreen && styles.imageContainerSmall]}>
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
            <Text style={[styles.merchant, isSmallScreen && styles.merchantSmall]} numberOfLines={1}>{receipt.merchant}</Text>
            
            <View style={[styles.info, isSmallScreen && styles.infoSmall]}>
              <View style={styles.infoItem}>
                <Calendar size={14} color={Colors.gray500} />
                <Text style={[styles.infoText, isSmallScreen && styles.infoTextSmall]} numberOfLines={1}>
                  {new Date(receipt.receiptDate).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Tag size={14} color={Colors.gray500} />
                <Text style={[styles.infoText, isSmallScreen && styles.infoTextSmall]} numberOfLines={1}>{receipt.category}</Text>
              </View>
            </View>
            
            <View style={styles.footer}>
              <View style={styles.amount}>
                <DollarSign size={16} color={Colors.secondary} />
                <Text style={[styles.total, isSmallScreen && styles.totalSmall]}>${receipt.total.toFixed(2)}</Text>
              </View>
              <View style={styles.rightInfo}>
                <Text style={[styles.itemCount, isSmallScreen && styles.itemCountSmall]}>{receipt.items.length} items</Text>
                <Text style={styles.swipeHint}>← Swipe for actions</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    position: 'relative',
  },
  cardContainerSmall: {
    marginHorizontal: Spacing.md,
  },
  actionsBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  actionBackgroundButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    borderRadius: BorderRadius.lg,
  },
  actionBackgroundText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  cardWrapper: {
    zIndex: 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.gray100,
    minHeight: 100,
  },
  cardSmall: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    minHeight: 90,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    ...Shadows.sm,
    flexShrink: 0,
  },
  imageContainerSmall: {
    width: 60,
    height: 60,
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
  merchantSmall: {
    fontSize: Typography.sm,
  },
  info: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoSmall: {
    flexDirection: 'column',
    gap: Spacing.xs,
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
  infoTextSmall: {
    fontSize: 10,
    flex: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  swipeHint: {
    fontSize: 9,
    color: Colors.gray400,
    marginTop: 2,
    fontStyle: 'italic',
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
  totalSmall: {
    fontSize: Typography.base,
  },
  itemCount: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  itemCountSmall: {
    fontSize: 10,
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