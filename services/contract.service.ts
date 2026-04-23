import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { Contract } from '@/models/hr/contract';

class ContractService extends BaseService<Contract> {
  constructor() {
    super(HR_ENDPOINTS.CONTRACTS);
  }
}

export const contractService = new ContractService();