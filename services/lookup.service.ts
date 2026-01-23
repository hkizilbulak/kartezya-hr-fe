import { HR_ENDPOINTS } from '@/contants/urls';
import { APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getErrorMessage } from '@/helpers/HelperUtils';

export interface CompanyLookup {
  id: number;
  name: string;
}

export interface DepartmentLookup {
  id: number;
  name: string;
  manager?: string;
  company_id?: number;
}

export interface JobPositionLookup {
  id: number;
  title: string;
}

export interface LeaveTypeLookup {
  id: number;
  name: string;
}

export interface GradeLookup {
  id: number;
  name: string;
}

export const lookupService = {
  // Get companies lookup (public - no auth required)
  getCompaniesLookup: async (): Promise<APIResponse<CompanyLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/companies');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch companies lookup:', getErrorMessage(error));
      throw error;
    }
  },

  // Get departments lookup (public - no auth required)
  getDepartmentsLookup: async (): Promise<APIResponse<DepartmentLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/departments');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch departments lookup:', getErrorMessage(error));
      throw error;
    }
  },

  // Get departments by company lookup (public - no auth required)
  getDepartmentsByCompanyLookup: async (companyId: number): Promise<APIResponse<DepartmentLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/departments-by-company', {
        params: { company_id: companyId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch departments lookup:', getErrorMessage(error));
      throw error;
    }
  },

  // Get job positions lookup (public - no auth required)
  getJobPositionsLookup: async (): Promise<APIResponse<JobPositionLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/job-positions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch job positions lookup:', getErrorMessage(error));
      throw error;
    }
  },

  // Get leave types lookup (public - no auth required)
  getLeaveTypesLookup: async (): Promise<APIResponse<LeaveTypeLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/leave-types');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch leave types lookup:', getErrorMessage(error));
      throw error;
    }
  },

  // Get grades lookup (public - no auth required)
  getGradesLookup: async (): Promise<APIResponse<GradeLookup[]>> => {
    try {
      const response = await axiosInstance.get('/lookup/grades');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch grades lookup:', getErrorMessage(error));
      throw error;
    }
  },
};
