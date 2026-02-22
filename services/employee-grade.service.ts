import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { EmployeeGrade } from '@/models/hr/hr-models';

class EmployeeGradeService extends BaseService<EmployeeGrade> {
  constructor() {
    super(`${HR_ENDPOINTS.EMPLOYEE_GRADES}`);
  }

  async getByEmployeeId(employeeId: number): Promise<APIResponse<EmployeeGrade[]>> {
    try {
      const response = await axiosInstance.get(`${HR_ENDPOINTS.EMPLOYEE_GRADES}`, {
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

export const employeeGradeService = new EmployeeGradeService();
