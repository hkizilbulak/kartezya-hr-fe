import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { EmployeeGrade } from '@/models/hr/hr-models';
import { CreateEmployeeGradeRequest, UpdateEmployeeGradeRequest } from '@/models/hr/hr-requests';

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

  /** Assign ACTIVE grade (closes previous ACTIVE on backend). Do not send end_date/status. */
  async create(data: CreateEmployeeGradeRequest): Promise<APIResponse<EmployeeGrade>> {
    try {
      const response = await axiosInstance.post(`${HR_ENDPOINTS.EMPLOYEE_GRADES}`, {
        employee_id: data.employee_id,
        grade_id: data.grade_id,
        start_date: data.start_date,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /** Update an existing ACTIVE or INACTIVE history row. */
  async update(id: number, data: UpdateEmployeeGradeRequest): Promise<APIResponse<EmployeeGrade>> {
    try {
      const response = await axiosInstance.put(`${HR_ENDPOINTS.EMPLOYEE_GRADES}/${id}`, {
        employee_id: data.employee_id,
        grade_id: data.grade_id,
        start_date: data.start_date,
        end_date: data.end_date,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const employeeGradeService = new EmployeeGradeService();
