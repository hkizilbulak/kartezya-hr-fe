import { HR_ENDPOINTS } from '@/contants/urls';
import { APIResponse } from './base.service';
import { LeaveBalance } from '@/models/hr/hr-models';
import axiosInstance from '@/helpers/api/axiosInstance';

export const leaveBalanceService = {
  // Get my leave balance for annual leave
  getMyLeaveBalance: async () => {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.LEAVE.BALANCES_ME);
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Return the first annual leave balance record
        return {
          success: true,
          data: response.data.data[0] || null
        };
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get my leave balances
  getMyLeaveBalances: async (): Promise<APIResponse<LeaveBalance[]>> => {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.LEAVE.BALANCES_ME);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};