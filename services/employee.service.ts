import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Employee } from '@/models/hr/common.types';
import axiosInstance from '@/helpers/api/axiosInstance';

interface CreateEmployeeRequest {
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
  total_experience?: number;
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

interface UpdateEmployeeRequest {
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
  total_experience?: number;
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

interface UpdateMyProfileRequest {
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
  total_experience?: number;
  marital_status?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  mother_name?: string;
  father_name?: string;
  nationality?: string;
  identity_no?: string;
}

class EmployeeService extends BaseService<Employee> {
  constructor() {
    super(HR_ENDPOINTS.EMPLOYEES);
  }

  async getMyProfile() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/me`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async create(data: CreateEmployeeRequest) {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(employeeId: number, data: UpdateEmployeeRequest) {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${employeeId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number | string, data: UpdateEmployeeRequest) {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateMyProfile(data: UpdateMyProfileRequest) {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/me`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();