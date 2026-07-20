import { BaseService } from './base.service';
import { Job, JobHistory, JobUpdateRequest, RunJobRequest } from '@/models/hr/job-models';
import axiosInstance from '@/helpers/api/axiosInstance';

class JobService extends BaseService<Job> {
  constructor() {
    super('/jobs'); // Backend uses /api/v1/jobs
  }

  // Get all jobs with optional sorting
  async getJobs(sort?: string, direction?: string): Promise<Job[]> {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (direction) params.append('direction', direction);

    const response = await axiosInstance.get<Job[]>(this.baseUrl, { params });
    return response.data;
  }

  // Get job by ID
  async getJobById(id: number): Promise<Job> {
    const response = await axiosInstance.get<Job>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Update job (cron, is_active, timeout)
  async updateJob(id: number, data: JobUpdateRequest): Promise<{ message: string }> {
    const response = await axiosInstance.put<{ message: string }>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Trigger job manually
  async runJob(id: number, payload?: RunJobRequest): Promise<{ message: string }> {
    const body = payload?.reference_date ? { reference_date: payload.reference_date } : undefined;
    const response = await axiosInstance.post<{ message: string }>(`${this.baseUrl}/${id}/run`, body);
    return response.data;
  }

  // Get job history
  async getJobHistory(id: number, limit: number = 50): Promise<JobHistory[]> {
    const response = await axiosInstance.get<JobHistory[]>(`${this.baseUrl}/${id}/history`, { params: { limit } });
    return response.data;
  }
}

export const jobService = new JobService();