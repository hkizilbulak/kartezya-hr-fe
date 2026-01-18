import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Employee } from '@/models/hr/common.types';
import axiosInstance from '@/helpers/api/axiosInstance';

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

  async updateProfile(employeeId: number, data: Partial<Employee>) {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${employeeId}`, data);
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