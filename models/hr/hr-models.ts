// HR Domain Models
export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface Department {
  id: number;
  company_id: number;
  name: string;
  manager?: string;
  company?: Company;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface JobPosition {
  id: number;
  title: string;
  departmentId: number;
  department?: Department;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface Employee {
  id: number;
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
  user?: UserInfo;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface UserInfo {
  id: number;
  email: string;
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
  employee?: Employee;
  company?: Company;
  department?: Department;
  job_position?: JobPosition;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
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
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
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
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

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
  employee: Employee;
  leave_type?: LeaveType;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface Grade {
  id: number;
  name: string;
  description?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface EmployeeGrade {
  id: number;
  employee_id: number;
  employee?: Employee;
  grade_id: number;
  grade?: Grade;
  start_date: string;
  end_date?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface EmployeeContract {
  id: number;
  employee_id: number;
  employee?: Employee;
  contract_no: string;
  start_date: string;
  end_date?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // ADMIN, EMPLOYEE
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

// Lookup Types
export interface LookupItem {
  id: number;
  name: string;
}

// Enums
export enum WorkType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN'
}

export enum WorkStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}