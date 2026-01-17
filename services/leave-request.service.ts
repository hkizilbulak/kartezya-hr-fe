import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService, APIResponse, PaginatedResponse, PaginationParams } from './base.service';
import { LeaveRequest } from '@/models/hr/common.types';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getErrorMessage } from '@/helpers/HelperUtils';
import { toast } from 'react-toastify';

export interface CreateLeaveRequestRequest {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
  is_paid?: boolean;
}

export interface UpdateLeaveRequestRequest {
  employee_id?: number;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
  reason?: string;
  is_paid?: boolean;
}

export interface ApproveLeaveRequestRequest {
  approvedBy: number;
}

export interface RejectLeaveRequestRequest {
  rejectionReason: string;
}

export interface CancelLeaveRequestRequest {
  reason: string;
}

class LeaveRequestService extends BaseService<LeaveRequest> {
  constructor() {
    super(HR_ENDPOINTS.LEAVE.REQUESTS);
  }

  // Create new leave request
  async create(data: CreateLeaveRequestRequest): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update leave request
  async update(id: number, data: UpdateLeaveRequestRequest): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get my leave requests (for employees)
  async getMyLeaveRequests(params?: PaginationParams): Promise<PaginatedResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.LEAVE.REQUESTS_ME, { params });
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  // Approve leave request (for managers/admins)
  async approveLeaveRequest(id: number, data: ApproveLeaveRequestRequest): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/approve`, data);
      toast.success('Leave request approved successfully!');
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  // Reject leave request (for managers/admins)
  async rejectLeaveRequest(id: number, data: RejectLeaveRequestRequest): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/reject`, data);
      toast.success('Leave request rejected successfully!');
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  // Cancel leave request (for employees - their own requests)
  async cancelLeaveRequest(id: number, data: CancelLeaveRequestRequest): Promise<APIResponse<LeaveRequest>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/${id}/cancel`, data);
      toast.success('Leave request cancelled successfully!');
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }
}

export const leaveRequestService = new LeaveRequestService();