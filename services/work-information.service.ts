import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getErrorMessage } from '@/helpers/HelperUtils';
import { toast } from 'react-toastify';

export interface WorkInformation {
  id: number;
  employee_id: number;
  company_id: number;
  department_id: number;
  job_position_id: number;
  start_date: string;
  end_date?: string;
  personnel_no?: string;
  work_email?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  company?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
    manager?: string;
  };
  job_position?: {
    id: number;
    title: string;
  };
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

export interface UpdateWorkInformationRequest extends CreateWorkInformationRequest {}

class WorkInformationService extends BaseService<WorkInformation> {
  constructor() {
    super(HR_ENDPOINTS.WORK_INFORMATION);
  }

  async getMyWorkInformation(): Promise<APIResponse<WorkInformation>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.WORK_INFORMATION_ME);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  async getByEmployeeId(employeeId: number): Promise<APIResponse<WorkInformation[]>> {
    try {
      const response = await axiosInstance.get(this.baseUrl, {
        params: {
          employee_id: employeeId,
          limit: 100
        }
      });
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  async createWorkInformation(data: CreateWorkInformationRequest): Promise<APIResponse<WorkInformation>> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  async updateWorkInformation(id: number, data: UpdateWorkInformationRequest): Promise<APIResponse<WorkInformation>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  async deleteWorkInformation(id: number): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }
}

export const workInformationService = new WorkInformationService();