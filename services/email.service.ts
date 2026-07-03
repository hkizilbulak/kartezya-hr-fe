import axiosInstance from '@/helpers/api/axiosInstance';

export interface SendDynamicEmailPayload {
  to: string;
  template_code: string;
  subject?: string;
  template_data: Record<string, string>;
}

class EmailService {
  private readonly baseUrl = '/emails';

  async sendDynamicTemplate(payload: SendDynamicEmailPayload) {
    const response = await axiosInstance.post(`${this.baseUrl}/send-template`, payload);
    return response.data;
  }
}

export const emailService = new EmailService();
