import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  is_paid: boolean;
  is_limited: boolean;
  is_accrual: boolean;
  is_required_document: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  modified_by?: string;
  deleted?: boolean;
}

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  is_paid: boolean;
  is_limited: boolean;
  is_accrual: boolean;
  is_required_document: boolean;
}

class LeaveTypeService extends BaseService<LeaveType> {
  constructor() {
    super(HR_ENDPOINTS.LEAVE.TYPES);
  }
}

export const leaveTypeService = new LeaveTypeService();