// HR API Request Models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateEmployeeRequest {
  email: string;
  company_email: string;
  first_name: string;
  last_name: string;
  phone: string;
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
  roles: string[];
}

export interface UpdateEmployeeRequest {
  email?: string;
  company_email?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  state?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
  hire_date?: string;
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
}

export interface UpdateMyProfileRequest {
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
  profession_start_date?: string;
  marital_status?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  mother_name?: string;
  father_name?: string;
  nationality?: string;
  identity_no?: string;
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
  manager?: string;
  company_id: number;
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

export interface CreateWorkInformationRequest {
  employee_id: number;
  company_id: number;
  department_id: number;
  job_position_id: number;
  start_date: string;
  end_date?: string;
  personnel_no?: string;
  work_email?: string;
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

export interface CreateGradeRequest {
  name: string;
  description?: string;
}

export interface UpdateGradeRequest extends CreateGradeRequest {
  id: number;
}

export interface CreateEmployeeGradeRequest {
  employee_id: number;
  grade_id: number;
  start_date: string;
  end_date?: string;
}

export interface UpdateEmployeeGradeRequest extends CreateEmployeeGradeRequest {
  id: number;
}

export interface CreateEmployeeContractRequest {
  employee_id: number;
  contract_no: string;
  start_date: string;
  end_date?: string;
}

export interface UpdateEmployeeContractRequest extends CreateEmployeeContractRequest {
  id: number;
}