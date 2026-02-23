import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Department } from '@/models/hr/hr-models';

class DepartmentService extends BaseService<Department> {
  constructor() {
    super(HR_ENDPOINTS.DEPARTMENTS);
  }
}

export const departmentService = new DepartmentService();