import axiosInstance from '@/helpers/api/axiosInstance';

export interface SendDynamicEmailPayload {
  to: string;
  template_code: string;
  subject?: string;
  template_data: Record<string, string>;
}

export interface ResendTemplate {
  id: string;
  name: string;
  status: string;
  alias: string;
}

class EmailService {
  private readonly baseUrl = '/emails';

  async getTemplates(): Promise<ResendTemplate[]> {
    const response = await axiosInstance.get(`${this.baseUrl}/templates`);
    return response.data?.data ?? [];
  }

  async sendDynamicTemplate(payload: SendDynamicEmailPayload) {
    const response = await axiosInstance.post(`${this.baseUrl}/send-template`, payload);
    return response.data;
  }
}

export const emailService = new EmailService();
