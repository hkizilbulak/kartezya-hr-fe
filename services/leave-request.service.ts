import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse, PaginatedResponse, PaginationParams } from './base.service';
import { LeaveRequest } from '@/models/hr/hr-models';
import axiosInstance from '@/helpers/api/axiosInstance';

class LeaveRequestService extends BaseService<LeaveRequest> {
  constructor() {
    super(HR_ENDPOINTS.LEAVE.REQUESTS);
  }

  // Get my leave requests (for employees)
  async getMyLeaveRequests(params?: PaginationParams): Promise<PaginatedResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.LEAVE.REQUESTS_ME, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get my requests (alias for getMyLeaveRequests)
  async getMyRequests(): Promise<APIResponse<LeaveRequest[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/me`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Approve leave request (for managers/admins)
  async approveLeaveRequest(id: number, data: { rejectionReason?: string }): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/approve`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Reject leave request (for managers/admins)
  async rejectLeaveRequest(id: number, data: { rejectionReason: string }): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/reject`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Cancel leave request (for employees - their own requests)
  async cancelLeaveRequest(id: number): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Calculate working days between two dates
  async calculateWorkingDays(
    startDate: string, 
    endDate: string, 
    isStartDateFullDay: boolean = true,
    isFinishDateFullDay: boolean = true
  ): Promise<APIResponse<{ working_days: number; calendar_days: number; start_date: string; end_date: string }>> {
    try {
      const response = await axiosInstance.post(`${HR_ENDPOINTS.LEAVE.BASE}/calculate-working-days`, {
        start_date: startDate,
        end_date: endDate,
        is_start_date_full_day: isStartDateFullDay,
        is_finish_date_full_day: isFinishDateFullDay,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const leaveRequestService = new LeaveRequestService();