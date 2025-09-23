export interface Receipt {
  id: string;
  imageUri: string;
  dateScanned: string;
  receiptDate: string;
  merchant: string;
  total: number;
  tax: number;
  subtotal: number;
  category: string;
  items: ReceiptItem[];
  notes?: string;
  paymentMethod?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface ReceiptScanResult {
  merchant: string;
  date: string;
  total: number;
  tax: number;
  subtotal: number;
  items: ReceiptItem[];
  paymentMethod?: string;
  suggestedCategory?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currentSpent: number;
  month: string; // YYYY-MM format
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  category: string;
  type: 'warning' | 'exceeded';
  threshold: number;
  currentAmount: number;
  message: string;
  createdAt: string;
}