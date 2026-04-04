import { API_URL, HR_API_BASE_URL } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { BaseService } from './base.service';

class DocumentService extends BaseService<any> {
  constructor() {
    super('/documents');
  }

  async getMyDocuments() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/me`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRelatedDocuments(type: number, id: number, params?: any) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/related/${type}/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserDocuments(userId: number, params?: any) {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const documentService = new DocumentService();
