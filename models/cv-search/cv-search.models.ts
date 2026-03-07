export interface SkillNode {
  name: string
  proficiency: string
  years_of_experience: number
}

export interface CompanyNode {
  name: string
  position: string
  is_current: boolean
}

export interface FusedCandidateResponse {
  rank: number
  name: string
  person_id: string
  current_position: string
  seniority: string
  total_experience_years: number
  skills: SkillNode[]
  communities: string[]
  community: string
  companies: CompanyNode[]
  fusion_score: number
  llm_score: number
  vector_score: number
  bm25_score: number
  graph_score: number
  llm_reasoning: string
}

export interface HybridSearchConfig {
  topK: number
  finalTopN: number
  bm25Weight: number
  vectorWeight: number
  graphWeight: number
  useCommunityFilter: boolean
  communityThreshold: number
}

export interface HybridSearchResponse {
  candidates: FusedCandidateResponse[]
  total_found: number
  processing_time: string
  method: string
  query: string
  config?: HybridSearchConfig
}

export interface BulkUploadJobResult {
  job_id?: number
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface BulkUploadResponse {
  batch_id: string
  results: BulkUploadJobResult[]
  message?: string
}

export interface BatchStatusResponse {
  batch_id: string
  total: number
  completed: number
  failed: number
  pending: number
  results: BulkUploadJobResult[]
}

// ── Candidate Models ──────────────────────────────────────────────────────────

export interface CandidateListItem {
  id: number
  name: string
  current_position: string
  seniority: string
  interview_count: number
  latest_outcome: string
  created_at: string
}

export interface ListCandidatesResponse {
  candidates: CandidateListItem[]
  total: number
  limit: number
  offset: number
}

export interface Interview {
  id: number
  candidate_id: number
  interview_date: string
  team: string
  interviewer_name: string
  interview_type: 'technical' | 'hr' | 'case_study' | 'other' | string
  notes: string
  outcome: 'passed' | 'failed' | 'pending' | string
  created_at: string
  updated_at: string
}

export interface InterviewRequest {
  interview_date: string // Required, YYYY-MM-DD
  team?: string
  interviewer_name?: string
  interview_type?: 'technical' | 'hr' | 'case_study' | 'other' | string
  notes?: string
  outcome?: 'passed' | 'failed' | 'pending' | string
}

export interface CandidateDetail {
  id: number
  name: string
  email: string
  phone: string
  location: string
  graph_node_id: number
  current_position: string
  seniority: string
  interviews: Interview[]
  created_at: string
}

// ── Search Suggestion Models ──────────────────────────────────────────────────

export interface SuggestionResult {
  text: string
  type: 'skill' | 'company' | 'position' | string
}
