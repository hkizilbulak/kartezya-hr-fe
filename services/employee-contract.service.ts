import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { EmployeeContract } from '@/models/hr/hr-models';

class EmployeeContractService extends BaseService<EmployeeContract> {
  constructor() {
    super(`${HR_ENDPOINTS.EMPLOYEE_CONTRACTS}`);
  }

  /**
   * Get contracts by employee ID
   */
  async getByEmployeeId(employeeId: number): Promise<APIResponse<EmployeeContract[]>> {
    try {
      const response = await axiosInstance.get(`${HR_ENDPOINTS.EMPLOYEE_CONTRACTS}`, {
        params: {
          employee_id: employeeId,
          limit: 100
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create contract with snake_case fields
   */
  async create(data: any): Promise<APIResponse<EmployeeContract>> {
    try {
      const response = await axiosInstance.post(`${HR_ENDPOINTS.EMPLOYEE_CONTRACTS}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update contract with snake_case fields
   */
  async update(id: number, data: any): Promise<APIResponse<EmployeeContract>> {
    try {
      const response = await axiosInstance.put(`${HR_ENDPOINTS.EMPLOYEE_CONTRACTS}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const employeeContractService = new EmployeeContractService();
