import { Category } from '@/types/receipt';

export const DEFAULT_CATEGORIES: Omit<Category, 'count'>[] = [
  { id: '1', name: 'Office Supplies', color: '#3B82F6', icon: 'Briefcase' },
  { id: '2', name: 'Travel', color: '#10B981', icon: 'Plane' },
  { id: '3', name: 'Meals & Entertainment', color: '#F59E0B', icon: 'Utensils' },
  { id: '4', name: 'Transportation', color: '#8B5CF6', icon: 'Car' },
  { id: '5', name: 'Equipment', color: '#EF4444', icon: 'Laptop' },
  { id: '6', name: 'Marketing', color: '#EC4899', icon: 'Megaphone' },
  { id: '7', name: 'Utilities', color: '#06B6D4', icon: 'Zap' },
  { id: '8', name: 'Other', color: '#6B7280', icon: 'MoreHorizontal' },
];

export const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#06B6D4', '#6B7280',
  '#84CC16', '#F97316', '#14B8A6', '#A855F7',
];