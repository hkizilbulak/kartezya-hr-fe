import cvSearchAxiosInstance from '@/helpers/api/cvSearchAxiosInstance'
import { CV_SEARCH_ENDPOINTS } from '@/contants/urls'
import type {
  BulkUploadResponse,
  BatchStatusResponse,
  HybridSearchResponse,
  ListCandidatesResponse,
  CandidateDetail,
  InterviewRequest,
  SuggestionResult,
} from '@/models/cv-search/cv-search.models'

class CvSearchService {
  async bulkUpload(files: File[]): Promise<BulkUploadResponse> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await cvSearchAxiosInstance.post<BulkUploadResponse>(
      CV_SEARCH_ENDPOINTS.BULK_UPLOAD,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data
  }

  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    const response = await cvSearchAxiosInstance.get<BatchStatusResponse>(
      `${CV_SEARCH_ENDPOINTS.BATCH_STATUS}/${batchId}`
    )
    return response.data
  }

  async hybridSearch(query: string): Promise<HybridSearchResponse> {
    const response = await cvSearchAxiosInstance.post<HybridSearchResponse>(
      CV_SEARCH_ENDPOINTS.HYBRID_SEARCH,
      {
        query,
        final_top_n: 20,
      }
    )
    return response.data
  }

  // ── Candidates ──────────────────────────────────────────────────────────────

  async listCandidates(limit = 20, offset = 0): Promise<ListCandidatesResponse> {
    const response = await cvSearchAxiosInstance.get<ListCandidatesResponse>(
      CV_SEARCH_ENDPOINTS.CANDIDATES,
      { params: { limit, offset } }
    )
    return response.data
  }

  async getCandidateDetail(id: number): Promise<CandidateDetail> {
    const response = await cvSearchAxiosInstance.get<CandidateDetail>(
      `${CV_SEARCH_ENDPOINTS.CANDIDATES}/${id}`
    )
    return response.data
  }

  async createInterview(candidateId: number, data: InterviewRequest): Promise<void> {
    await cvSearchAxiosInstance.post(
      `${CV_SEARCH_ENDPOINTS.CANDIDATES}/${candidateId}/interviews`,
      data
    )
  }

  async updateInterview(candidateId: number, interviewId: number, data: InterviewRequest): Promise<void> {
    await cvSearchAxiosInstance.put(
      `${CV_SEARCH_ENDPOINTS.CANDIDATES}/${candidateId}/interviews/${interviewId}`,
      data
    )
  }

  async deleteInterview(candidateId: number, interviewId: number): Promise<void> {
    await cvSearchAxiosInstance.delete(
      `${CV_SEARCH_ENDPOINTS.CANDIDATES}/${candidateId}/interviews/${interviewId}`
    )
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  async getPopularQueries(): Promise<string[]> {
    const response = await cvSearchAxiosInstance.get<string[]>(
      CV_SEARCH_ENDPOINTS.POPULAR_QUERIES
    )
    return response.data
  }

  async getSuggestions(q: string, limit = 5): Promise<SuggestionResult[]> {
    const response = await cvSearchAxiosInstance.get<SuggestionResult[]>(
      CV_SEARCH_ENDPOINTS.SUGGEST,
      { params: { q, limit } }
    )
    return response.data
  }
}

export const cvSearchService = new CvSearchService()
