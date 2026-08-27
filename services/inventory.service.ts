import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse, PaginatedResponse, PaginationParams } from './base.service';
import { InventoryItem } from '@/models/hr/hr-models';
import axiosInstance from '@/helpers/api/axiosInstance';

export interface InventoryReportFilters extends PaginationParams {
  search?: string;
  device_type?: string;
  brand?: string;
  status?: string;
  department_id?: number;
}

class InventoryService extends BaseService<InventoryItem> {
  constructor() {
    super(HR_ENDPOINTS.INVENTORY.BASE);
  }

  // Get current user's inventory
  async getMyItems(params?: PaginationParams): Promise<PaginatedResponse<InventoryItem>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.INVENTORY.MY_ITEMS, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create an item for current user
  async createMyItem(data: Partial<InventoryItem>): Promise<APIResponse<InventoryItem>> {
    try {
      const response = await axiosInstance.post(HR_ENDPOINTS.INVENTORY.MY_ITEMS, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update an item for current user
  async updateMyItem(id: string, data: Partial<InventoryItem>): Promise<APIResponse<InventoryItem>> {
    try {
      const response = await axiosInstance.put(`${HR_ENDPOINTS.INVENTORY.MY_ITEMS}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete an item for current user
  async deleteMyItem(id: string): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.delete(`${HR_ENDPOINTS.INVENTORY.MY_ITEMS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Admin/HR endpoints for specific employee's inventory
  async getEmployeeInventory(employeeId: string | number): Promise<APIResponse<InventoryItem[]>> {
    try {
      const response = await axiosInstance.get(`${HR_ENDPOINTS.EMPLOYEES}/${employeeId}/inventory`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createEmployeeInventory(employeeId: string | number, data: Partial<InventoryItem>): Promise<APIResponse<InventoryItem>> {
    try {
      const response = await axiosInstance.post(`${HR_ENDPOINTS.EMPLOYEES}/${employeeId}/inventory`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Report endpoint
  async getInventoryReport(params?: InventoryReportFilters): Promise<PaginatedResponse<InventoryItem>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.INVENTORY.REPORTS, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
