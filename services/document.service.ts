import { API_URL, HR_API_BASE_URL } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { BaseService } from './base.service';

// AttachmentRelatedType: 4 = Employee
// AttachmentType: 9 = Resume/CV
export const ATTACHMENT_RELATED_TYPE_EMPLOYEE = 4;
export const ATTACHMENT_TYPE_CV = 9;

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

  async uploadDocument(formData: FormData) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async linkDocuments(documentIds: string[], relatedType: number, relatedId: number) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/link`, {
        document_ids: documentIds,
        related_type: relatedType,
        related_id: relatedId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const documentService = new DocumentService();
