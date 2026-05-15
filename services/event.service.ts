import axiosInstance from '@/helpers/api/axiosInstance';
import { BaseService, APIResponse } from './base.service';
import { Event } from '@/models/hr/hr-models';

class EventService extends BaseService<Event> {
  constructor() {
    super('/events');
  }

  async publish(id: number | string): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/publish`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async participate(id: number | string, data: { status: string, companion_count: number }): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/participate`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getDashboardEvents(audience?: string): Promise<APIResponse<Event[]>> {
    try {
      const params = audience ? { audience } : {};
      const response = await axiosInstance.get(`${this.baseUrl}/dashboard`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async exportParticipants(id: number | string): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}/participants/export`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const eventService = new EventService();
