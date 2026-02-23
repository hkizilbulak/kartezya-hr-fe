import { useState, useEffect } from 'react';
import { leaveBalanceService } from '@/services/leave-balance.service';
import { leaveRequestService } from '@/services/leave-request.service';
import { LeaveRequest, LeaveBalance } from '@/models/hr/hr-models';
import { PaginationParams } from '@/services/base.service';

export const useLeaveManagement = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const loadBalances = async () => {
    setIsLoadingBalances(true);
    try {
      const response = await leaveBalanceService.getMyLeaveBalances();
      if (response.success && response.data) {
        setBalances(response.data);
      }
    } catch (error) {
      console.error('Error loading leave balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const loadMyRequests = async (params?: PaginationParams) => {
    setIsLoadingRequests(true);
    try {
      const response = await leaveRequestService.getMyLeaveRequests(params);
      if (response.success && response.data) {
        setMyRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const submitLeaveRequest = async (requestData: any) => {
    try {
      const response = await leaveRequestService.create(requestData);
      if (response.success) {
        // Refresh requests and balances
        await Promise.all([loadMyRequests(), loadBalances()]);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const cancelLeaveRequest = async (requestId: number) => {
    try {
      const response = await leaveRequestService.cancelLeaveRequest(requestId);
      if (response.success) {
        // Refresh requests and balances
        await Promise.all([loadMyRequests(), loadBalances()]);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadBalances();
    loadMyRequests();
  }, []);

  return {
    balances,
    myRequests,
    isLoadingBalances,
    isLoadingRequests,
    loadBalances,
    loadMyRequests,
    submitLeaveRequest,
    cancelLeaveRequest
  };
};