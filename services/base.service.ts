import axiosInstance from '@/helpers/api/axiosInstance';
import { PagedResponse as PaginatedResponse } from '@/models/common/http.model';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export for backward compatibility
export type { PaginatedResponse };

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  search?: string;
  [key: string]: any;
}

export class BaseService<T = any> {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<T>> {
    try {
      const response = await axiosInstance.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: number | string): Promise<APIResponse<T>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<APIResponse<T>> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number | string, data: Partial<T>): Promise<APIResponse<T>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number | string): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLookup(): Promise<APIResponse<Array<{id: number, name: string}>>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/lookup`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
