import axiosInstance from '@/helpers/api/axiosInstance';

export type MailProvider = 'RESEND' | 'SMTP';
export type RecipientType = 'TO' | 'CC' | 'BCC';
export type ValueType = 'STATIC' | 'DYNAMIC';

export interface MailRecipient {
  id?: number;
  mail_config_id?: number;
  recipient_type: RecipientType;
  value_type: ValueType;
  recipient_value: string;
}

export interface MailConfiguration {
  id: number;
  mail_key: string;
  description: string;
  provider: MailProvider;
  resend_template_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  recipients: MailRecipient[];
}

export interface MailConfigPayload {
  mail_key: string;
  description: string;
  provider: MailProvider;
  resend_template_code: string;
  is_active: boolean;
  recipients: Omit<MailRecipient, 'id' | 'mail_config_id'>[];
}

class MailConfigService {
  private readonly baseUrl = '/mail-configs';

  async getAll(): Promise<MailConfiguration[]> {
    const res = await axiosInstance.get(this.baseUrl);
    return res.data?.data ?? [];
  }

  async getById(id: number): Promise<MailConfiguration> {
    const res = await axiosInstance.get(`${this.baseUrl}/${id}`);
    return res.data?.data;
  }

  async create(payload: MailConfigPayload): Promise<MailConfiguration> {
    const res = await axiosInstance.post(this.baseUrl, payload);
    return res.data?.data;
  }

  async update(id: number, payload: MailConfigPayload): Promise<void> {
    await axiosInstance.put(`${this.baseUrl}/${id}`, payload);
  }

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${id}`);
  }
}

export const mailConfigService = new MailConfigService();
