import cvSearchAxiosInstance from '@/helpers/api/cvSearchAxiosInstance'
import { CV_SEARCH_ENDPOINTS } from '@/contants/urls'
import type {
  BulkUploadResponse,
  BatchStatusResponse,
  HybridSearchResponse,
  ListCandidatesResponse,
  CandidateDetail,
  CandidateCV,
  InterviewRequest,
  SuggestionResult,
  DuplicatesResponse,
  MergeCandidatesRequest,
  MergeCandidatesResponse,
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

  async listCandidates(
    params?:
      | {
          page?: number
          pageSize?: number
          limit?: number
          offset?: number
          sort?: string
          direction?: string
          search?: string
          outcome?: string
        }
      | number,
    offsetArg = 0,
    sortArg?: string,
    directionArg?: string,
    searchArg?: string,
    outcomeArg?: string
  ): Promise<ListCandidatesResponse> {
    let page = 1
    let limit = 20
    let offset = 0
    let sort = sortArg
    let direction = directionArg
    let search = searchArg
    let outcome = outcomeArg

    if (typeof params === 'object' && params !== null) {
      page = params.page ?? 1
      limit = params.pageSize ?? params.limit ?? 20
      offset = params.offset ?? (page - 1) * limit
      sort = params.sort
      direction = params.direction
      search = params.search
      outcome = params.outcome
    } else if (typeof params === 'number') {
      limit = params
      offset = offsetArg
      page = Math.floor(offset / limit) + 1
    }

    const response = await cvSearchAxiosInstance.get<ListCandidatesResponse>(
      CV_SEARCH_ENDPOINTS.CANDIDATES,
      { params: { page, pageSize: limit, limit, offset, sort, direction, search, outcome } }
    )
    return response.data
  }

  async getCandidateDetail(id: number): Promise<CandidateDetail> {
    const response = await cvSearchAxiosInstance.get<CandidateDetail>(
      `${CV_SEARCH_ENDPOINTS.CANDIDATES}/${id}`
    )
    return response.data
  }

  async getCandidateCV(id: number): Promise<CandidateCV> {
    const response = await cvSearchAxiosInstance.get<CandidateCV>(
      CV_SEARCH_ENDPOINTS.CANDIDATE_CV(id)
    )
    return response.data
  }

  /** Downloads the server-rendered CV PDF and triggers the browser "save as" flow. */
  async downloadCandidateCVPdf(id: number, fallbackName?: string): Promise<void> {
    const response = await cvSearchAxiosInstance.get<Blob>(
      CV_SEARCH_ENDPOINTS.CANDIDATE_CV_PDF(id),
      { responseType: 'blob', headers: { Accept: 'application/pdf' } }
    )
    const disposition = response.headers['content-disposition'] as string | undefined
    const match = disposition?.match(/filename="?([^";]+)"?/)
    const filename = match?.[1] || `${(fallbackName || `aday_${id}`).replace(/\s+/g, '_')}_CV.pdf`

    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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

  // ── Duplicates ───────────────────────────────────────────────────────────────

  async getDuplicateCandidates(): Promise<DuplicatesResponse> {
    const response = await cvSearchAxiosInstance.get<DuplicatesResponse>(
      CV_SEARCH_ENDPOINTS.CANDIDATES_DUPLICATES
    )
    return response.data
  }

  async mergeCandidates(req: MergeCandidatesRequest): Promise<MergeCandidatesResponse> {
    const response = await cvSearchAxiosInstance.post<MergeCandidatesResponse>(
      CV_SEARCH_ENDPOINTS.CANDIDATES_MERGE,
      req
    )
    return response.data
  }
}

export const cvSearchService = new CvSearchService()
