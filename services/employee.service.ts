import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Employee } from '@/models/hr/hr-models';
import axiosInstance from '@/helpers/api/axiosInstance';
import { CreateEmployeeRequest, UpdateEmployeeRequest, UpdateMyProfileRequest } from '@/models/hr/hr-requests';

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