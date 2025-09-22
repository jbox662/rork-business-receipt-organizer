import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { CommonStyles, Colors, Typography, Spacing } from '@/constants/design-system';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

export function Input({
  label,
  error,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  testID,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const getInputStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [CommonStyles.input];
    
    if (isFocused) {
      baseStyle.push(CommonStyles.inputFocused);
    }
    
    if (error) {
      baseStyle.push(CommonStyles.inputError);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };
  
  const getLabelStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [CommonStyles.label];
    
    if (required) {
      baseStyle.push({ color: Colors.gray700 });
    }
    
    if (labelStyle) {
      baseStyle.push(labelStyle);
    }
    
    return baseStyle;
  };
  
  return (
    <View style={[{ marginBottom: Spacing.lg }, containerStyle]}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={{ color: Colors.error }}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={getInputStyle()}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        placeholderTextColor={Colors.gray400}
        testID={testID}
        {...textInputProps}
      />
      
      {error && (
        <Text style={{
          fontSize: Typography.sm,
          color: Colors.error,
          marginTop: Spacing.xs,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}