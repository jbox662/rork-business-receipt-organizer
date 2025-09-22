import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { CommonStyles, ButtonTextStyles, Colors } from '@/constants/design-system';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'accent' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [CommonStyles.buttonBase];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(CommonStyles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(CommonStyles.buttonSecondary);
        break;
      case 'success':
        baseStyle.push(CommonStyles.buttonSuccess);
        break;
      case 'error':
        baseStyle.push(CommonStyles.buttonError);
        break;
      case 'accent':
        baseStyle.push(CommonStyles.buttonAccent);
        break;
      case 'outline':
        baseStyle.push(CommonStyles.buttonOutline);
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push({
          paddingVertical: 8,
          paddingHorizontal: 12,
        });
        break;
      case 'large':
        baseStyle.push({
          paddingVertical: 16,
          paddingHorizontal: 24,
        });
        break;
    }
    
    // Disabled state
    if (disabled || loading) {
      baseStyle.push(CommonStyles.buttonDisabled);
    }
    
    // Custom style
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    let baseTextStyle;
    
    switch (variant) {
      case 'primary':
        baseTextStyle = ButtonTextStyles.primary;
        break;
      case 'secondary':
        baseTextStyle = ButtonTextStyles.secondary;
        break;
      case 'success':
        baseTextStyle = ButtonTextStyles.success;
        break;
      case 'error':
        baseTextStyle = ButtonTextStyles.error;
        break;
      case 'accent':
        baseTextStyle = ButtonTextStyles.primary; // White text for accent
        break;
      case 'outline':
        baseTextStyle = ButtonTextStyles.outline;
        break;
      default:
        baseTextStyle = ButtonTextStyles.primary;
    }
    
    // Size adjustments
    const sizeAdjustments = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };
    
    return [baseTextStyle, sizeAdjustments[size], textStyle];
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'secondary' || variant === 'outline' ? Colors.gray600 : Colors.white} 
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}