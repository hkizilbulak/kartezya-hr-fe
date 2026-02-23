import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Company } from '@/models/hr/hr-models';

class CompanyService extends BaseService<Company> {
  constructor() {
    super(HR_ENDPOINTS.COMPANIES);
  }
}

export const companyService = new CompanyService();