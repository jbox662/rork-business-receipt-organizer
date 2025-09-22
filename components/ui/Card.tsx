import React from 'react';
import { View, ViewStyle } from 'react-native';
import { CommonStyles, Shadows, Colors, BorderRadius, Spacing } from '@/constants/design-system';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  testID,
}: CardProps) {
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [{
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.lg,
    }];
    
    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.push(Shadows.md);
        break;
      case 'elevated':
        baseStyle.push(Shadows.lg);
        break;
      case 'outlined':
        baseStyle.push({
          borderWidth: 1,
          borderColor: Colors.gray200,
        });
        break;
    }
    
    // Padding styles
    switch (padding) {
      case 'none':
        break;
      case 'small':
        baseStyle.push({ padding: Spacing.md });
        break;
      case 'medium':
        baseStyle.push({ padding: Spacing.lg });
        break;
      case 'large':
        baseStyle.push({ padding: Spacing.xl });
        break;
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  return (
    <View style={getCardStyle()} testID={testID}>
      {children}
    </View>
  );
}