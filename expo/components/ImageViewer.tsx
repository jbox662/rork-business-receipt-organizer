import React, { useState, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export default function ImageViewer({ visible, imageUri, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
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
          const initialDistance = 200; // Base distance
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

  const handleReset = () => {
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

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar hidden={Platform.OS !== 'web'} />
      <View style={styles.container}>
        <View style={styles.overlay} />
        
        {/* Controls */}
        <View style={[styles.controls, { top: insets.top + 10 }]}>
          <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <ZoomOut size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <ZoomIn size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
              <RotateCcw size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
              <View style={styles.resetDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          {imageUri && imageUri.trim() !== '' && (imageUri.startsWith('http') || imageUri.startsWith('data:') || imageUri.startsWith('file:')) ? (
            <Animated.Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
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
              onError={() => console.log('ImageViewer: Image failed to load:', imageUri)}
            />
          ) : (
            <View style={styles.errorContainer}>
              <X size={48} color="rgba(255, 255, 255, 0.5)" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
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
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});