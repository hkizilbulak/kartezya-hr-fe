// Expense Request Interface
export interface ExpenseRequest {
  id: number;
  employee_id: number;
  expense_type_id: number;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  approved_by?: number;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  created_by: string;
  modified_by: string;
  
  // Relationships
  employee?: Employee;
  expense_type?: ExpenseType;
  approver?: UserInfo;
  
  // Computed fields
  document_count?: number; // Number of attached documents
}

// Expense Type Interface
export interface ExpenseType {
  id: number;
  name: string;
  description: string;
  requires_receipt: boolean;
  max_amount?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  created_by: string;
  modified_by: string;
}

// Create/Update Expense Request DTO
export interface CreateExpenseRequest {
  expense_type_id: number;
  amount: number;
  currency?: string;
  expense_date: string;
  description: string;
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {
  id: number;
}

// Expense Status Enum
export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

// Currency Enum
export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR'
}

// Import Employee and UserInfo types
import { Employee, UserInfo } from './hr-models';
