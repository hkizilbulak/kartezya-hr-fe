import { HR_ENDPOINTS } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { APIResponse } from './base.service';

export interface UserSetting {
  id: number;
  user_id: number;
  photo_consent: 'PENDING' | 'APPROVED' | 'REJECTED';
  kvkk_text: 'PENDING' | 'READ';
  privacy_policy: 'PENDING' | 'READ';
  anti_bribery_policy: 'PENDING' | 'READ';
  photo_consent_at: string | null;
  kvkk_text_at: string | null;
  privacy_policy_at: string | null;
  anti_bribery_policy_at: string | null;
  kvkk_last_postponed_at: string | null;
  kvkk_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  kvkk_approved: boolean;
  kvkk_approved_at: string | null;
  kvkk_rejected_at: string | null;
  promotion_email_allowed: boolean;
  promotion_sms_allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveKvkkRequest {
  action: 'SUBMIT' | 'REMIND_LATER';
  photo_consent?: 'APPROVED' | 'REJECTED';
  kvkk_text?: 'READ';
  privacy_policy?: 'READ';
  anti_bribery_policy?: 'READ';
}

export const settingsService = {
  getUserSettings: async (): Promise<APIResponse<UserSetting>> => {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.AUTH.SETTINGS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  saveKvkkConsent: async (payload: SaveKvkkRequest): Promise<APIResponse<UserSetting>> => {
    try {
      const response = await axiosInstance.post(HR_ENDPOINTS.AUTH.KVKK, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
