import { Company, Department, JobPosition, Employee, WorkInformation, LeaveType, LeaveRequest, LeaveBalance, User, LookupItem, Grade, EmployeeGrade } from './hr-models';

// Base API Response
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Response
export interface LoginResponse {
  token: string;
  user: User;
}

// Specific Response Types
export type CompanyResponse = APIResponse<Company>;
export type CompaniesResponse = PaginatedResponse<Company>;

export type DepartmentResponse = APIResponse<Department>;
export type DepartmentsResponse = PaginatedResponse<Department>;
export type DepartmentLookupResponse = APIResponse<LookupItem[]>;

export type JobPositionResponse = APIResponse<JobPosition>;
export type JobPositionsResponse = PaginatedResponse<JobPosition>;
export type JobPositionLookupResponse = APIResponse<LookupItem[]>;

export type EmployeeResponse = APIResponse<Employee>;
export type EmployeesResponse = PaginatedResponse<Employee>;

export type WorkInformationResponse = APIResponse<WorkInformation>;
export type WorkInformationsResponse = PaginatedResponse<WorkInformation>;

export type LeaveTypeResponse = APIResponse<LeaveType>;
export type LeaveTypesResponse = PaginatedResponse<LeaveType>;
export type LeaveTypeLookupResponse = APIResponse<LookupItem[]>;

export type LeaveRequestResponse = APIResponse<LeaveRequest>;
export type LeaveRequestsResponse = PaginatedResponse<LeaveRequest>;

export type LeaveBalancesResponse = APIResponse<LeaveBalance[]>;

export type GradeResponse = APIResponse<Grade>;
export type GradesResponse = PaginatedResponse<Grade>;
export type GradeLookupResponse = APIResponse<LookupItem[]>;

export type EmployeeGradeResponse = APIResponse<EmployeeGrade>;
export type EmployeeGradesResponse = PaginatedResponse<EmployeeGrade>;

export type UserProfileResponse = APIResponse<User>;