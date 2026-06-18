import { HR_ENDPOINTS } from '@/contants/urls';
import { BaseService } from './base.service';
import { FAQ } from '@/models/hr/hr-models';

class FaqService extends BaseService<FAQ> {
  constructor() {
    super(HR_ENDPOINTS.FAQS);
  }
}

export const faqService = new FaqService();