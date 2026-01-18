import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { LeaveType } from '@/models/hr/common.types';

class LeaveTypeService extends BaseService<LeaveType> {
  constructor() {
    super(HR_ENDPOINTS.LEAVE.TYPES);
  }
}

export const leaveTypeService = new LeaveTypeService();