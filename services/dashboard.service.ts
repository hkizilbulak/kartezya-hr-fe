import {  APIResponse } from './base.service';
import axiosInstance from '@/helpers/api/axiosInstance';

const DASHBOARD_ENDPOINTS = {
  DATA: '/dashboard/data',
  EMPLOYEES_BY_GENDER: '/dashboard/employees-by-gender',
  EMPLOYEES_BY_POSITION: '/dashboard/employees-by-position',
  EMPLOYEES_BY_COMPANY_DEPARTMENT: '/dashboard/employees-by-company-department',
  EMPLOYEE_DASHBOARD: '/dashboard/employee',
};

export interface DashboardData {
  total_employees: number;
  total_departments: number;
  total_companies: number;
  pending_leave_requests: number;
}

export interface GenderChartData {
  gender: string;
  count: number;
}

export interface PositionChartData {
  position_title: string;
  count: number;
}

export interface CompanyDepartmentChartData {
  company_name: string;
  department_name: string;
  count: number;
}

export interface EmployeeDashboardData {
  pending_requests: number;
  years_in_company: number;
  years_in_company_text: string;
  start_date: string;
}

class DashboardService {

  async getDashboardData(): Promise<APIResponse<DashboardData>> {
    try {
      const response = await axiosInstance.get(`${DASHBOARD_ENDPOINTS.DATA}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEmployeesByGender(): Promise<APIResponse<GenderChartData[]>> {
    try {
      const response = await axiosInstance.get(`${DASHBOARD_ENDPOINTS.EMPLOYEES_BY_GENDER}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEmployeesByPosition(): Promise<APIResponse<PositionChartData[]>> {
    try {
      const response = await axiosInstance.get(`${DASHBOARD_ENDPOINTS.EMPLOYEES_BY_POSITION}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEmployeesByCompanyDepartment(): Promise<APIResponse<CompanyDepartmentChartData[]>> {
    try {
      const response = await axiosInstance.get(`${DASHBOARD_ENDPOINTS.EMPLOYEES_BY_COMPANY_DEPARTMENT}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEmployeeDashboardData(): Promise<APIResponse<EmployeeDashboardData>> {
    try {
      const response = await axiosInstance.get(`${DASHBOARD_ENDPOINTS.EMPLOYEE_DASHBOARD}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
