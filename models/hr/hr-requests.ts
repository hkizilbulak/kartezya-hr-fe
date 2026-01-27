// HR API Request Models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  id: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  companyId: number;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: number;
}

export interface CreateJobPositionRequest {
  title: string;
  description?: string;
  departmentId: number;
}

export interface UpdateJobPositionRequest extends CreateJobPositionRequest {
  id: number;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  employeeNumber: string;
}

export interface UpdateEmployeeRequest extends CreateEmployeeRequest {
  id: number;
}

export interface CreateWorkInformationRequest {
  employeeId: number;
  jobPositionId: number;
  startDate: string;
  endDate?: string;
  salary?: number;
  workType: string;
  status: string;
}

export interface UpdateWorkInformationRequest extends CreateWorkInformationRequest {
  id: number;
}

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  maxDays: number;
}

export interface UpdateLeaveTypeRequest extends CreateLeaveTypeRequest {
  id: number;
}

export interface CreateLeaveRequestRequest {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  isStartDateFullDay?: boolean;
  isFinishDateFullDay?: boolean;
  reason?: string;
}

export interface UpdateLeaveRequestRequest extends CreateLeaveRequestRequest {
  id: number;
}

export interface ApproveRejectLeaveRequest {
  comments?: string;
}