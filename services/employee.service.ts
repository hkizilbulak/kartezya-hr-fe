import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Employee } from '@/models/hr/common.types';
import axiosInstance from '@/helpers/api/axiosInstance';

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  hireDate: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface ListEmployeesParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

// Helper function to convert ISO datetime to date input format (YYYY-MM-DD)
const formatDateForInput = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

// Helper function to convert Turkish enum values to English/system values
const mapGenderValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const genderMap: Record<string, string> = {
    'Erkek': 'MALE',
    'Kadın': 'FEMALE',
    'Diğer': 'OTHER',
    'MALE': 'MALE',
    'FEMALE': 'FEMALE',
    'OTHER': 'OTHER'
  };
  return genderMap[value] || value;
};

const mapMaritalStatusValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const maritalMap: Record<string, string> = {
    'Bekar': 'SINGLE',
    'Bekâr': 'SINGLE',
    'Evli': 'MARRIED',
    'Boşanmış': 'DIVORCED',
    'Dul': 'WIDOWED',
    'SINGLE': 'SINGLE',
    'MARRIED': 'MARRIED',
    'DIVORCED': 'DIVORCED',
    'WIDOWED': 'WIDOWED'
  };
  return maritalMap[value] || value;
};

const mapEmergencyContactRelationValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const relationMap: Record<string, string> = {
    'Eş': 'SPOUSE',
    'Ebeveyn': 'PARENT',
    'Çocuk': 'CHILD',
    'Kardeş': 'SIBLING',
    'Akraba': 'RELATIVE',
    'Arkadaş': 'FRIEND',
    'Diğer': 'OTHER',
    'SPOUSE': 'SPOUSE',
    'PARENT': 'PARENT',
    'CHILD': 'CHILD',
    'SIBLING': 'SIBLING',
    'RELATIVE': 'RELATIVE',
    'FRIEND': 'FRIEND',
    'OTHER': 'OTHER'
  };
  return relationMap[value] || value;
};

// Reverse mapping - convert English values back to Turkish for backend
const mapGenderValueToBackend = (value: string | null | undefined): string => {
  if (!value) return '';
  const reverseMap: Record<string, string> = {
    'MALE': 'Erkek',
    'FEMALE': 'Kadın',
    'OTHER': 'Diğer',
    'Erkek': 'Erkek',
    'Kadın': 'Kadın',
    'Diğer': 'Diğer'
  };
  return reverseMap[value] || value;
};

const mapMaritalStatusValueToBackend = (value: string | null | undefined): string => {
  if (!value) return '';
  const reverseMap: Record<string, string> = {
    'SINGLE': 'Bekar',
    'MARRIED': 'Evli',
    'DIVORCED': 'Boşanmış',
    'WIDOWED': 'Dul',
    'Bekar': 'Bekar',
    'Bekâr': 'Bekar',
    'Evli': 'Evli',
    'Boşanmış': 'Boşanmış',
    'Dul': 'Dul'
  };
  return reverseMap[value] || value;
};

const mapEmergencyContactRelationValueToBackend = (value: string | null | undefined): string => {
  if (!value) return '';
  const reverseMap: Record<string, string> = {
    'SPOUSE': 'Eş',
    'PARENT': 'Ebeveyn',
    'CHILD': 'Çocuk',
    'SIBLING': 'Kardeş',
    'RELATIVE': 'Akraba',
    'FRIEND': 'Arkadaş',
    'OTHER': 'Diğer',
    'Eş': 'Eş',
    'Ebeveyn': 'Ebeveyn',
    'Çocuk': 'Çocuk',
    'Kardeş': 'Kardeş',
    'Akraba': 'Akraba',
    'Arkadaş': 'Arkadaş',
    'Diğer': 'Diğer'
  };
  return reverseMap[value] || value;
};

// Backend response mapping - convert backend response to Employee model
const mapBackendEmployeeToModel = (backendEmployee: any): Employee => {
  return {
    id: backendEmployee.id,
    userId: backendEmployee.userId || backendEmployee.user_id,
    firstName: backendEmployee.firstName || backendEmployee.first_name || '',
    lastName: backendEmployee.lastName || backendEmployee.last_name || '',
    email: backendEmployee.email || backendEmployee.user?.email || '',
    phone: backendEmployee.phone || '',
    birthDate: formatDateForInput(backendEmployee.birthDate || backendEmployee.date_of_birth),
    hireDate: formatDateForInput(backendEmployee.hireDate || backendEmployee.hire_date),
    status: backendEmployee.status || 'ACTIVE',
    createdAt: backendEmployee.createdAt || backendEmployee.created_at || '',
    updatedAt: backendEmployee.updatedAt || backendEmployee.updated_at || '',
    user: backendEmployee.user,
    // Extra fields from backend that we need - convert enum values to system values
    address: backendEmployee.address || '',
    city: backendEmployee.city || '',
    state: backendEmployee.state || '',
    gender: mapGenderValue(backendEmployee.gender || backendEmployee.Gender),
    leaveDate: formatDateForInput(backendEmployee.leaveDate || backendEmployee.leave_date),
    maritalStatus: mapMaritalStatusValue(backendEmployee.maritalStatus || backendEmployee.marital_status),
    totalExperience: backendEmployee.totalExperience || backendEmployee.total_experience || 0,
    emergencyContactName: backendEmployee.emergencyContactName || backendEmployee.emergency_contact_name || '',
    emergencyContact: backendEmployee.emergencyContact || backendEmployee.emergency_contact || '',
    emergencyContactRelation: mapEmergencyContactRelationValue(backendEmployee.emergencyContactRelation || backendEmployee.emergency_contact_relation)
  } as any;
};

class EmployeeService extends BaseService<Employee> {
  constructor() {
    super(HR_ENDPOINTS.EMPLOYEES);
  }

  async listWithFilters(params: ListEmployeesParams) {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    const response = await axiosInstance.get(url);
    
    // Map backend response to our Employee model
    if (response.data && response.data.data) {
      response.data.data = response.data.data.map((emp: any) => mapBackendEmployeeToModel(emp));
    }
    
    return response;
  }

  async getById(id: number | string) {
    const response = await super.getById(id);
    
    // Map single employee response
    if (response.data) {
      response.data = mapBackendEmployeeToModel(response.data);
    }
    
    return response;
  }

  async create(data: any) {
    // Transform camelCase to snake_case for backend and convert enum values back to Turkish
    const backendData = {
      first_name: data.first_name || data.firstName || '',
      last_name: data.last_name || data.lastName || '',
      company_email: data.company_email || data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      date_of_birth: data.date_of_birth || data.dateOfBirth || '',
      gender: mapGenderValueToBackend(data.gender || ''),
      hire_date: data.hire_date || data.hireDate || '',
      leave_date: data.leave_date || data.leaveDate || '',
      marital_status: mapMaritalStatusValueToBackend(data.marital_status || ''),
      total_experience: data.total_experience || data.totalExperience || 0,
      emergency_contact_name: data.emergency_contact_name || data.emergencyContactName || '',
      emergency_contact: data.emergency_contact || data.emergencyContact || '',
      emergency_contact_relation: mapEmergencyContactRelationValueToBackend(data.emergency_contact_relation || '')
    };
    
    const response = await axiosInstance.post(this.baseUrl, backendData);
    
    // Map response back to our model
    if (response.data) {
      response.data = mapBackendEmployeeToModel(response.data);
    }
    
    return response;
  }

  async update(id: number | string, data: any) {
    // Transform camelCase to snake_case for backend and convert enum values back to Turkish
    const backendData = {
      first_name: data.first_name || data.firstName || '',
      last_name: data.last_name || data.lastName || '',
      company_email: data.company_email || data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      date_of_birth: data.date_of_birth || data.dateOfBirth || '',
      gender: mapGenderValueToBackend(data.gender || ''),
      hire_date: data.hire_date || data.hireDate || '',
      leave_date: data.leave_date || data.leaveDate || '',
      marital_status: mapMaritalStatusValueToBackend(data.marital_status || ''),
      total_experience: data.total_experience || data.totalExperience || 0,
      emergency_contact_name: data.emergency_contact_name || data.emergencyContactName || '',
      emergency_contact: data.emergency_contact || data.emergencyContact || '',
      emergency_contact_relation: mapEmergencyContactRelationValueToBackend(data.emergency_contact_relation || '')
    };
    
    const response = await axiosInstance.put(`${this.baseUrl}/${id}`, backendData);
    
    // Map response back to our model
    if (response.data) {
      response.data = mapBackendEmployeeToModel(response.data);
    }
    
    return response;
  }
}

export const employeeService = new EmployeeService();