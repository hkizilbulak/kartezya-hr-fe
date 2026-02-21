// HR Domain Models
export interface Company {
  id: number;
  name: string;
  description?: string;
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
  name: string;
  description?: string;
  companyId: number;
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
  description?: string;
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
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  employeeNumber: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface WorkInformation {
  id: number;
  employeeId: number;
  employee?: Employee;
  jobPositionId: number;
  jobPosition?: JobPosition;
  startDate: string;
  endDate?: string;
  salary?: number;
  workType: string; // FULL_TIME, PART_TIME, CONTRACT, INTERN
  status: string; // ACTIVE, INACTIVE, TERMINATED
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
  maxDays: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employee?: Employee;
  leaveTypeId: number;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  isStartDateFullDay?: boolean;
  isFinishDateFullDay?: boolean;
  days: number;
  reason?: string;
  status: string; // PENDING, APPROVED, REJECTED, CANCELLED
  approverId?: number;
  approver?: Employee;
  approvalDate?: string;
  approverComments?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  employee?: Employee;
  leaveTypeId: number;
  leaveType?: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
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
  employeeId: number;
  employee?: Employee;
  gradeId: number;
  grade?: Grade;
  startDate: string;
  endDate?: string;
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