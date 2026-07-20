export interface Job {
  id: number;
  job_key: string;
  name: string;
  cron_expression: string;
  is_active: boolean;
  timeout_second: number;
  created_at?: string;
  updated_at?: string;
}

export interface JobHistory {
  id: number;
  job_id: number;
  start_time: string;
  end_time?: string;
  processed_count: number;
  status: string;
  error_summary?: string;
  execution_node?: string;
  reference_date?: string;
  execution_type?: string;
  triggered_by_user_id?: number;
  job?: Job;
}

export interface RunJobRequest {
  reference_date?: string;
}

export interface JobUpdateRequest {
  cron_expression: string;
  is_active: boolean;
  timeout_second: number;
}
