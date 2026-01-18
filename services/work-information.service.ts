import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getErrorMessage } from '@/helpers/HelperUtils';
import { toast } from 'react-toastify';

export interface WorkInformation {
  id: number;
  employeeId: number;
  jobPositionId: number;
  salary: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  jobPosition?: {
    id: number;
    title: string;
    department?: {
      id: number;
      name: string;
      company?: {
        id: number;
        name: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

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
}

export const workInformationService = new WorkInformationService();