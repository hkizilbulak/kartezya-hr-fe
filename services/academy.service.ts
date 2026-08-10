import axiosInstance from '@/helpers/api/axiosInstance';
import { APIResponse } from './base.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TrainingStatus = 'ACTIVE' | 'INACTIVE';
export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Training {
  id: number;
  title: string;
  description: string;
  duration: number; // minutes
  status: TrainingStatus;
  created_at: string;
  updated_at: string;
}

export interface TrainingAssignment {
  id: number;
  training_id: number;
  employee_id: number;
  status: AssignmentStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  training: Training;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TrainingCertificate {
  id: number;
  assignment_id: number;
  employee_id: number;
  training_id: number;
  certificate_code: string;
  issued_at: string;
  training: Training;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface CreateTrainingPayload {
  title: string;
  description?: string;
  duration?: number;
  status?: TrainingStatus;
  file: File;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/academy';

export const academyService = {
  // Training
  listTrainings: async (limit = 50, offset = 0): Promise<APIResponse<Training[]>> => {
    const res = await axiosInstance.get(`${BASE}/trainings`, { params: { limit, offset } });
    return res.data;
  },

  getTraining: async (id: number): Promise<APIResponse<Training>> => {
    const res = await axiosInstance.get(`${BASE}/trainings/${id}`);
    return res.data;
  },

  createTraining: async (data: CreateTrainingPayload): Promise<APIResponse<Training>> => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.duration) formData.append('duration', data.duration.toString());
    if (data.status) formData.append('status', data.status);
    formData.append('file', data.file);

    const res = await axiosInstance.post(`${BASE}/trainings`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  updateTraining: async (id: number, data: Partial<CreateTrainingPayload>): Promise<APIResponse<Training>> => {
    const res = await axiosInstance.put(`${BASE}/trainings/${id}`, data);
    return res.data;
  },

  deleteTraining: async (id: number): Promise<APIResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE}/trainings/${id}`);
    return res.data;
  },

  // Assignment (Admin)
  assignEmployee: async (trainingId: number, employeeIds: number[]): Promise<APIResponse> => {
    const res = await axiosInstance.post(`${BASE}/trainings/${trainingId}/assign`, { employee_ids: employeeIds });
    return res.data;
  },

  listTrainingAssignments: async (trainingId: number): Promise<APIResponse<TrainingAssignment[]> & { total: number }> => {
    const res = await axiosInstance.get(`${BASE}/trainings/${trainingId}/assignments`);
    return res.data;
  },

  removeAssignment: async (assignmentId: number): Promise<APIResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE}/assignments/${assignmentId}`);
    return res.data;
  },

  // Assignments (Employee)
  getMyAssignments: async (): Promise<APIResponse<TrainingAssignment[]>> => {
    try {
      const res = await axiosInstance.get(`${BASE}/assignments/me`);
      return res.data;
    } catch (e: any) {
      if (e.response?.status === 400) return { success: true, data: [] };
      throw e;
    }
  },

  startTraining: async (assignmentId: number): Promise<APIResponse<void>> => {
    const res = await axiosInstance.post(`${BASE}/assignments/${assignmentId}/start`);
    return res.data;
  },

  completeTraining: async (assignmentId: number): Promise<APIResponse<TrainingCertificate>> => {
    const res = await axiosInstance.post(`${BASE}/assignments/${assignmentId}/complete`);
    return res.data;
  },

  // Certificates
  getMyCertificates: async (): Promise<APIResponse<TrainingCertificate[]>> => {
    try {
      const res = await axiosInstance.get(`${BASE}/certificates/me`);
      return res.data;
    } catch (e: any) {
      if (e.response?.status === 400) return { success: true, data: [] };
      throw e;
    }
  },

  getCertificateByCode: async (code: string): Promise<APIResponse<TrainingCertificate>> => {
    const res = await axiosInstance.get(`${BASE}/certificates/${code}`);
    return res.data;
  },
};
