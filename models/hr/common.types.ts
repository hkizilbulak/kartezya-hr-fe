// Common API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  search?: string;
}

// Lookup type for dropdowns
export interface LookupItem {
  id: number;
  name: string;
}

// Leave Management Types
export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  leaveType?: LeaveType;
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  isPaid: boolean;
  isLimited: boolean;
  maxDays?: number;
  isAccrual: boolean;
  isRequiredDocument: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
  employee?: Employee;
  leaveType?: LeaveType;
}

// Employee Types
export interface Employee {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
  user?: User;
  // Extra fields
  address?: string;
  city?: string;
  state?: string;
  gender?: string;
  leaveDate?: string;
  maritalStatus?: string;
  totalExperience?: number;
  emergencyContactName?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
}

export interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  companyId: number;
  name: string;
  manager?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
}

export interface JobPosition {
  id: number;
  title: string;
  description?: string;
  departmentId?: number;
  createdAt: string;
  updatedAt: string;
  department?: Department;
}