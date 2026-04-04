import { BaseService, APIResponse, PaginatedResponse, PaginationParams } from './base.service';
import {
  ExpenseRequest,
  ExpenseType,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '@/models/hr/expense-models';
import axiosInstance from '@/helpers/api/axiosInstance';

class ExpenseService extends BaseService<ExpenseRequest> {
  constructor() {
    super('/expense/requests');
  }

  // ==================== Expense Request Methods ====================

  /**
   * Get my expense requests (for employee)
   */
  async getMyExpenseRequests(
    page: number = 1,
    limit: number = 10,
    status?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<ExpenseRequest>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy || 'created_at',
      sort_order: sortOrder,
    });

    if (status) {
      params.append('status', status);
    }

    try {
      const response = await axiosInstance.get(`/expense/requests/me?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all expense requests (admin only)
   */
  async getAllExpenseRequests(
    page: number = 1,
    limit: number = 10,
    employeeId?: number,
    status?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<ExpenseRequest>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy || 'created_at',
      sort_order: sortOrder,
    });

    if (employeeId) {
      params.append('employee_id', employeeId.toString());
    }
    if (status) {
      params.append('status', status);
    }

    try {
      const response = await axiosInstance.get(`/expense/requests?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get expense request by ID
   */
  async getExpenseRequestById(id: number): Promise<APIResponse<ExpenseRequest>> {
    return this.getById(id);
  }

  /**
   * Create new expense request
   */
  async createExpenseRequest(data: CreateExpenseRequest): Promise<APIResponse<ExpenseRequest>> {
    return this.create(data);
  }

  /**
   * Update expense request
   */
  async updateExpenseRequest(
    id: number,
    data: UpdateExpenseRequest
  ): Promise<APIResponse<ExpenseRequest>> {
    return this.update(id, data);
  }

  /**
   * Delete expense request
   */
  async deleteExpenseRequest(id: number): Promise<APIResponse<void>> {
    return this.delete(id);
  }

  /**
   * Approve expense request (admin only)
   */
  async approveExpenseRequest(
    id: number,
    approvedAmount?: number,
    notes?: string
  ): Promise<APIResponse<ExpenseRequest>> {
    try {
      const response = await axiosInstance.post(`/expense/requests/${id}/approve`, {
        approved_amount: approvedAmount,
        notes,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject expense request (admin only)
   */
  async rejectExpenseRequest(id: number, notes?: string): Promise<APIResponse<ExpenseRequest>> {
    try {
      const response = await axiosInstance.post(`/expense/requests/${id}/reject`, {
        notes,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark expense as paid (admin only)
   */
  async markExpenseAsPaid(
    id: number,
    paymentReference: string,
    paidAt?: string
  ): Promise<APIResponse<ExpenseRequest>> {
    try {
      const response = await axiosInstance.post(`/expense/requests/${id}/pay`, {
        payment_reference: paymentReference,
        paid_at: paidAt,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== Expense Type Methods ====================

  /**
   * Get all expense types (admin only)
   */
  async getExpenseTypes(): Promise<APIResponse<ExpenseType[]>> {
    try {
      const response = await axiosInstance.get(`/expense/types`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active expense types
   */
  async getActiveExpenseTypes(): Promise<APIResponse<ExpenseType[]>> {
    try {
      const response = await axiosInstance.get(`/expense/types/active`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create expense type (admin only)
   */
  async createExpenseType(data: {
    name: string;
    description: string;
    requires_receipt: boolean;
    max_amount?: number;
    active: boolean;
  }): Promise<APIResponse<ExpenseType>> {
    try {
      const response = await axiosInstance.post(`/expense/types`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update expense type (admin only)
   */
  async updateExpenseType(
    id: number,
    data: {
      name?: string;
      description?: string;
      requires_receipt?: boolean;
      max_amount?: number;
      active?: boolean;
    }
  ): Promise<APIResponse<ExpenseType>> {
    try {
      const response = await axiosInstance.put(`/expense/types/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete expense type (admin only)
   */
  async deleteExpenseType(id: number): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.delete(`/expense/types/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== Document Methods ====================

  /**
   * Upload document for expense request
   */
  async uploadExpenseDocument(
    expenseRequestId: number,
    file: File
  ): Promise<APIResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post(
        `/expense/requests/${expenseRequestId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get documents for expense request
   */
  async getExpenseDocuments(expenseRequestId: number): Promise<APIResponse<any[]>> {
    try {
      const response = await axiosInstance.get(
        `/expense/requests/${expenseRequestId}/documents`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete expense document
   */
  async deleteExpenseDocument(documentId: string): Promise<APIResponse<void>> {
    try {
      const response = await axiosInstance.delete(`/expense/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get download URL for expense document
   */
  async downloadExpenseDocument(documentId: string): Promise<APIResponse<{ url: string }>> {
    try {
      const response = await axiosInstance.get(
        `/expense/documents/${documentId}/download`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ExpenseService();
