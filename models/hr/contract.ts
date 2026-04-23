import { PagedResponse } from '../common';

export enum ContractStatus {
  PendingProposal = 'PENDING_PROPOSAL',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export interface Contract {
  id: number;
  created_at: string;
  updated_at: string;
  customer_contact_name: string;
  customer_contact_phone: string;
  customer_contact_email: string;
  project_name: string;
  contract_no: string;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
}

export interface ContractRequest {
  customer_contact_name: string;
  customer_contact_phone: string;
  customer_contact_email: string;
  project_name: string;
  contract_no: string;
  start_date: string;
  end_date?: string;
  status?: ContractStatus;
}

export interface ContractListResponse extends PagedResponse<Contract> {}
