import { PagedResponse } from '../common';

export enum ContractStatus {
  PendingProposalInfo = 'PENDING_PROPOSAL_INFO',
  ProposalSentContractExpected = 'PROPOSAL_SENT_CONTRACT_EXPECTED',
  ProposalRejected = 'PROPOSAL_REJECTED',
  ContractCancelled = 'CONTRACT_CANCELLED',
  ContractCompletedAwaitingPayment = 'CONTRACT_COMPLETED_AWAITING_PAYMENT',
  ContractCompletedPaymentReceived = 'CONTRACT_COMPLETED_PAYMENT_RECEIVED',
  ContractCompletedPartialPayment = 'CONTRACT_COMPLETED_PARTIAL_PAYMENT',
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
  employee_contracts?: any[];
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
