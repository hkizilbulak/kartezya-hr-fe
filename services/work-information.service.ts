import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { EmployeeWorkInformation } from '@/models/hr/hr-models';

class WorkInformationService extends BaseService<EmployeeWorkInformation> {
  constructor() {
    super(HR_ENDPOINTS.WORK_INFORMATION);
  }

  async getMyWorkInformation(): Promise<APIResponse<EmployeeWorkInformation>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.WORK_INFORMATION_ME);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getByEmployeeId(employeeId: number): Promise<APIResponse<EmployeeWorkInformation[]>> {
    try {
      const response = await axiosInstance.get(this.baseUrl, {
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
}

export const workInformationService = new WorkInformationService();