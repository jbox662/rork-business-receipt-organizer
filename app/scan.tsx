import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, TextInput, Platform, Modal, StatusBar, useWindowDimensions, Animated, PanResponder } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, Image as ImageIcon, Check, X, RotateCcw, Zap, ZapOff, ZoomIn, ZoomOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReceipts } from '@/hooks/receipt-store-supabase';
import { scanReceipt } from '@/utils/receipt-scanner';
import { Receipt, ReceiptScanResult } from '@/types/receipt';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius, Shadows, CommonStyles } from '@/constants/design-system';



export default function ScanScreen() {
  const { saveReceipt, categories, isSaving } = useReceipts();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [editedResult, setEditedResult] = useState<ReceiptScanResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageBase64, setPreviewImageBase64] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Image preview zoom/pan state
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [rotation, setRotation] = useState(0);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const pickImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos or camera.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable built-in editing to show our full screen preview
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Show full screen preview first
        setPreviewImage(result.assets[0].uri);
        setPreviewImageBase64(result.assets[0].base64 || null);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const openCamera = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        return;
      }
    }

    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo) {
        setSelectedImage(photo.uri);
        setShowCamera(false);
        if (photo.base64) {
          processImage(photo.base64);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current: boolean) => !current);
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    try {
      const result = await scanReceipt(base64);
      setScanResult(result);
      setEditedResult(result);
      
      // Check if this is a fallback result (AI failed but we provided defaults)
      if (result.merchant === 'Unknown Merchant' && result.total === 0) {
        Alert.alert(
          'Scan Incomplete', 
          'Could not automatically extract receipt data. Please enter the details manually.',
          [{ text: 'OK' }]
        );
      }
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!editedResult || !selectedImage) {
      console.log('Missing data for save:', { editedResult: !!editedResult, selectedImage: !!selectedImage });
      Alert.alert('Error', 'Missing receipt data. Please try scanning again.');
      return;
    }

    // Validate required fields before creating receipt
    if (!editedResult.merchant || editedResult.merchant.trim() === '') {
      Alert.alert('Error', 'Please enter a merchant name.');
      return;
    }
    
    if (!editedResult.date || editedResult.date.trim() === '') {
      Alert.alert('Error', 'Please enter a receipt date.');
      return;
    }
    
    if (editedResult.total === undefined || editedResult.total === null || isNaN(editedResult.total)) {
      Alert.alert('Error', 'Please enter a valid total amount.');
      return;
    }
    
    if (!editedResult.suggestedCategory || editedResult.suggestedCategory.trim() === '') {
      Alert.alert('Error', 'Please select a category.');
      return;
    }

    // Generate a temporary ID for local use (Supabase will generate its own UUID)
    const generateTempId = () => {
      return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    const receipt: Receipt = {
      id: generateTempId(),
      imageUri: selectedImage,
      dateScanned: new Date().toISOString(),
      receiptDate: editedResult.date,
      merchant: editedResult.merchant.trim(),
      total: Number(editedResult.total),
      tax: Number(editedResult.tax) || 0,
      subtotal: Number(editedResult.subtotal) || 0,
      category: editedResult.suggestedCategory.trim(),
      items: editedResult.items || [],
      paymentMethod: editedResult.paymentMethod || 'Unknown',
    };
    
    console.log('Final receipt object before save:', {
      id: receipt.id,
      merchant: receipt.merchant,
      total: receipt.total,
      category: receipt.category,
      receiptDate: receipt.receiptDate,
      itemsCount: receipt.items.length
    });

    try {
      console.log('Attempting to save receipt...');
      await saveReceipt(receipt);
      console.log('Receipt saved successfully!');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Receipt saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving receipt:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        receipt: receipt
      });
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Showing error alert with message:', errorMessage);
      
      Alert.alert(
        'Error', 
        `Failed to save receipt: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    }
  };

  const updateField = (field: keyof ReceiptScanResult, value: any) => {
    if (editedResult) {
      setEditedResult({ ...editedResult, [field]: value });
    }
  };

  // Image preview pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scaleValue.setOffset(lastScale);
        translateX.setOffset(lastX);
        translateY.setOffset(lastY);
        scaleValue.setValue(0);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          const initialDistance = 200;
          const newScale = Math.max(0.5, Math.min(5, distance / initialDistance));
          scaleValue.setValue(newScale - 1);
        } else if (scale > 1) {
          // Pan when zoomed in
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        const newScale = Math.max(0.5, Math.min(5, lastScale + scale - 1));
        const newX = Math.max(-screenWidth, Math.min(screenWidth, lastX + offsetX));
        const newY = Math.max(-screenHeight, Math.min(screenHeight, lastY + offsetY));

        setLastScale(newScale);
        setScale(newScale);
        setLastX(newX);
        setOffsetX(newX);
        setLastY(newY);
        setOffsetY(newY);

        scaleValue.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(5, scale * 1.5);
    setScale(newScale);
    setLastScale(newScale);
    Animated.spring(scaleValue, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale / 1.5);
    setScale(newScale);
    setLastScale(newScale);
    Animated.spring(scaleValue, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleResetZoom = () => {
    setScale(1);
    setLastScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setLastX(0);
    setLastY(0);
    setRotation(0);
    
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotateValue, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const handleRotate = () => {
    const newRotation = rotation + 90;
    setRotation(newRotation);
    Animated.spring(rotateValue, {
      toValue: newRotation,
      useNativeDriver: true,
    }).start();
  };

  const handleUseImage = async () => {
    if (!previewImage) return;
    
    setSelectedImage(previewImage);
    setShowImagePreview(false);
    handleResetZoom();
    
    // Process the image if we have base64 data
    if (previewImageBase64) {
      processImage(previewImageBase64);
    } else {
      // Create a default scan result for manual entry
      const defaultResult: ReceiptScanResult = {
        merchant: '',
        date: new Date().toLocaleDateString(),
        total: 0,
        tax: 0,
        subtotal: 0,
        suggestedCategory: 'General',
        items: [],
        paymentMethod: 'Unknown'
      };
      setScanResult(defaultResult);
      setEditedResult(defaultResult);
      Alert.alert('Note', 'Image selected. Please enter receipt details manually as automatic scanning is not available.');
    }
  };

  const handleCancelPreview = () => {
    setShowImagePreview(false);
    setPreviewImage(null);
    setPreviewImageBase64(null);
    handleResetZoom();
  };

  if (showCamera) {
    return (
      <View style={styles.fullScreenContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
          flash={flash ? 'on' : 'off'}
        >
          <View style={[styles.cameraOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.cameraTitle}>Position receipt in frame</Text>
              
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleFlash}
              >
                {flash ? <Zap size={24} color="#FFD700" /> : <ZapOff size={24} color="white" />}
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraFrame} />
            
            <View style={styles.cameraFooter}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={styles.cameraButton} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // Full screen image preview modal
  if (showImagePreview && previewImage) {
    return (
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPreview}
      >
        <StatusBar hidden={Platform.OS !== 'web'} />
        <View style={styles.fullScreenContainer}>
          <View style={styles.overlay} />
          
          {/* Controls */}
          <View style={[styles.previewControls, { top: insets.top + 10 }]}>
            <TouchableOpacity style={styles.previewControlButton} onPress={handleCancelPreview}>
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.previewTitle}>Preview Receipt</Text>
            
            <View style={styles.rightControls}>
              <TouchableOpacity style={styles.previewControlButton} onPress={handleZoomOut}>
                <ZoomOut size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.previewControlButton} onPress={handleZoomIn}>
                <ZoomIn size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.previewControlButton} onPress={handleRotate}>
                <RotateCcw size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.previewControlButton} onPress={handleResetZoom}>
                <View style={styles.resetDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          <View style={styles.previewImageContainer} {...panResponder.panHandlers}>
            <Animated.Image
              source={{ uri: previewImage }}
              style={[
                styles.previewImage,
                {
                  transform: [
                    { scale: scaleValue },
                    { translateX: translateX },
                    { translateY: translateY },
                    { rotate: rotateValue.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }) },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>
          
          {/* Bottom Actions */}
          <View style={[styles.previewActions, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity 
              style={[styles.previewActionButton, styles.cancelPreviewButton]}
              onPress={handleCancelPreview}
            >
              <X size={20} color="#6B7280" />
              <Text style={styles.cancelPreviewText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.previewActionButton, styles.useImageButton]}
              onPress={handleUseImage}
            >
              <Check size={20} color="white" />
              <Text style={styles.useImageText}>Use This Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!selectedImage ? (
        <View style={styles.uploadSection}>
          <Text style={styles.title}>Scan Your Receipt</Text>
          <Text style={styles.subtitle}>Choose an option to add your receipt</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={openCamera}
            activeOpacity={0.7}
          >
            <Camera size={32} color="#1E40AF" />
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDescription}>Use your camera to capture a receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => pickImage(false)}
            activeOpacity={0.7}
          >
            <ImageIcon size={32} color="#10B981" />
            <Text style={styles.optionTitle}>Choose from Library</Text>
            <Text style={styles.optionDescription}>Select an existing photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultSection}>
          <View style={styles.receiptImageContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.receiptImage} />
            ) : (
              <View style={[styles.receiptImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No Image Selected</Text>
              </View>
            )}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.processingText}>Analyzing receipt...</Text>
              </View>
            )}
          </View>

          {scanResult && editedResult && !isProcessing && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Receipt Details</Text>
              
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Merchant</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedResult.merchant}
                  onChangeText={(text) => updateField('merchant', text)}
                />
              </View>
              
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedResult.date}
                  onChangeText={(text) => updateField('date', text)}
                />
              </View>
              
              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Subtotal</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editedResult.subtotal.toString()}
                    onChangeText={(text) => updateField('subtotal', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.fieldLabel}>Tax</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editedResult.tax.toString()}
                    onChangeText={(text) => updateField('tax', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Total</Text>
                <TextInput
                  style={[styles.fieldInput, styles.totalInput]}
                  value={editedResult.total.toString()}
                  onChangeText={(text) => updateField('total', parseFloat(text) || 0)}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        editedResult.suggestedCategory === cat.name && styles.selectedChip
                      ]}
                      onPress={() => updateField('suggestedCategory', cat.name)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        editedResult.suggestedCategory === cat.name && styles.selectedChipText
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.itemsSection}>
                <Text style={styles.itemsTitle}>Items ({editedResult.items.length})</Text>
                {editedResult.items.map((item: any, index: number) => (
                  <View key={`${item.name}-${index}`} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  icon={<X size={20} color={Colors.gray600} />}
                  style={styles.flexButton}
                  testID="cancel-button"
                />
                
                <Button
                  title={isSaving ? 'Saving...' : 'Save Receipt'}
                  variant="primary"
                  onPress={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                  icon={!isSaving ? <Check size={20} color={Colors.white} /> : undefined}
                  style={styles.flexButton}
                  testID="save-button"
                />
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
  uploadSection: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultSection: {
    padding: 20,
  },
  receiptImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalInput: {
    fontSize: 20,
    fontWeight: '600',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#1E40AF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  itemsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#1E40AF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  disabledButton: {
    opacity: 0.6,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cameraTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    flex: 1,
    margin: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  cameraFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flexButton: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  previewControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },
  previewActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelPreviewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  useImageButton: {
    backgroundColor: Colors.primary,
  },
  cancelPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  useImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});