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

// User Info for Employee Response
export interface UserInfo {
  id: number;
  email: string;
}

// Leave Management Types
export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_start_date_full_day?: boolean;
  is_finish_date_full_day?: boolean;
  requested_days: number;
  remaining_days?: number; // Leave balance remaining days (only for annual leave)
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  is_paid: boolean;
  approved_by?: number;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  cancel_reason?: string;
  cancelled_at?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  leave_type?: LeaveType;
  // Helper properties
  employeeId?: number;
  leaveTypeId?: number;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  requestedDays?: number;
  isPaid?: boolean;
  approvedBy?: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isStartDateFullDay?: boolean;
  isFinishDateFullDay?: boolean;
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  is_paid: boolean;
  is_limited: boolean;
  max_days?: number;
  is_accrual: boolean;
  is_required_document: boolean;
  created_at: string;
  updated_at: string;
  // Helper properties
  isPaid?: boolean;
  isLimited?: boolean;
  maxDays?: number;
  isAccrual?: boolean;
  isRequiredDocument?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  employee?: Employee;
  leave_type?: LeaveType;
  // Helper properties
  employeeId?: number;
  leaveTypeId?: number;
  totalDays?: number;
  usedDays?: number;
  remainingDays?: number;
}

// Employee Types
export interface Employee {
  id: number;
  user?: UserInfo;
  first_name: string;
  last_name: string;
  email: string;
  company_email?: string;
  phone?: string;
  address?: string;
  state?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
  hire_date: string;
  leave_date?: string;
  total_gap?: number;
  marital_status?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  grade_id?: number;
  is_grade_up?: boolean;
  contract_no?: string;
  profession_start_date?: string;
  note?: string;
  mother_name?: string;
  father_name?: string;
  nationality?: string;
  identity_no?: string;
  roles?: string[];
  work_information?: {
    company_name: string;
    department_name: string;
    manager: string;
    job_title: string;
  };
  status?: 'ACTIVE' | 'PASSIVE';
}

// Company Types
export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  // Helper properties
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  company_id: number;
  name: string;
  manager?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  // Helper properties
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobPosition {
  id: number;
  title: string;
  description?: string;
  department_id?: number;
  created_at: string;
  updated_at: string;
  department?: Department;
  // Helper properties
  departmentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeWorkInformation {
  id: number;
  employee_id: number;
  company_id: number;
  department_id: number;
  job_position_id: number;
  start_date: string;
  end_date?: string;
  personnel_no?: string;
  work_email?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  company?: Company;
  department?: Department;
  job_position?: JobPosition;
  // Helper properties
  employeeId?: number;
  companyId?: number;
  departmentId?: number;
  jobPositionId?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}