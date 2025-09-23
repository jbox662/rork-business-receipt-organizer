import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Icons from 'lucide-react-native';
import { Category } from '@/types/receipt';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/design-system';

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryPill({ category, isSelected, onPress }: CategoryPillProps) {
  const IconComponent = (Icons as any)[category.icon] || Icons.MoreHorizontal;
  
  return (
    <TouchableOpacity 
      style={[
        styles.pill, 
        isSelected && styles.selectedPill,
        { 
          backgroundColor: isSelected ? category.color : Colors.white,
          borderColor: isSelected ? category.color : Colors.gray400
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconComponent 
        size={14} 
        color={isSelected ? Colors.white : category.color} 
      />
      <Text style={[
        styles.text, 
        isSelected && styles.selectedText, 
        { color: isSelected ? Colors.white : Colors.gray800 }
      ]}>
        {category.name}
      </Text>
      {category.count > 0 && (
        <View style={[styles.badge, isSelected && styles.selectedBadge]}>
          <Text style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>
            {category.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1.5,
    ...Shadows.md,
    elevation: 3,
    minHeight: 32,
  },
  selectedPill: {
    ...Shadows.lg,
    transform: [{ scale: 1.02 }],
    elevation: 5,
    borderWidth: 2,
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: Typography.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
    letterSpacing: 0.4,
  },
  badge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: Colors.gray200,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Shadows.lg,
    elevation: 4,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.gray800,
    fontWeight: Typography.semibold,
  },
  selectedBadgeText: {
    color: Colors.gray900,
    fontWeight: Typography.bold,
  },
});