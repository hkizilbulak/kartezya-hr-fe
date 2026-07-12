"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Container,
  Alert,
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { cvSearchService } from '@/services/cv-search.service';
import type { CandidateListItem } from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import CustomPagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { Eye, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import {
  compareDate,
  compareNumber,
  compareText,
  ClientSortDirection,
} from '@/lib/sort/clientCompare';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const PAGE_SIZE = 20;
/** External API ignores sort; walk pages with a working page size until a short page. */
const FETCH_LIMIT = 100;
const FETCH_SAFETY_CAP = 10000;

type CandidateSortKey =
  | 'name'
  | 'current_position'
  | 'seniority'
  | 'interview_count'
  | 'latest_outcome'
  | 'created_at';

type IncompleteReason = 'cap' | 'repeated_page' | 'partial_error' | null;

type FetchAllResult = {
  candidates: CandidateListItem[];
  complete: boolean;
  reason: IncompleteReason;
};

const INCOMPLETE_MESSAGES: Record<Exclude<IncompleteReason, null>, string> = {
  cap: 'Aday listesi güvenlik limiti nedeniyle eksik yüklendi. Global sıralama kapalı; görüntüleme devam edebilir.',
  repeated_page: 'Aday API’si tekrarlayan sayfa döndürdü; liste eksik olabilir. Global sıralama kapalı; görüntüleme devam edebilir.',
  partial_error: 'Aday listesi kısmen yüklendi (sonraki sayfa alınamadı). Global sıralama kapalı; görüntüleme devam edebilir.',
};

const outcomeToStatus = (
  outcome: string
): React.ComponentProps<typeof StatusBadge>['status'] => {
  switch (outcome) {
    case 'passed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'pending':
      return 'pending';
    default:
      return 'info';
  }
};

const outcomeLabel = (outcome: string): string => {
  switch (outcome) {
    case 'passed':
      return 'Geçti';
    case 'failed':
      return 'Geçemedi';
    case 'pending':
      return 'Beklemede';
    default:
      return outcome || '—';
  }
};

/** Deduplicate by stable numeric candidate `id`, keeping first occurrence. */
function appendUniqueById(
  all: CandidateListItem[],
  seen: Set<number>,
  batch: CandidateListItem[]
): number {
  let added = 0;
  for (const candidate of batch) {
    if (seen.has(candidate.id)) {
      continue;
    }
    seen.add(candidate.id);
    all.push(candidate);
    added += 1;
  }
  return added;
}

async function fetchAllCandidates(): Promise<FetchAllResult> {
  const all: CandidateListItem[] = [];
  const seen = new Set<number>();
  let offset = 0;

  while (offset < FETCH_SAFETY_CAP) {
    try {
      const data = await cvSearchService.listCandidates(FETCH_LIMIT, offset);
      const batch = data.candidates ?? [];
      const added = appendUniqueById(all, seen, batch);

      // Short page → natural end of dataset (complete).
      if (batch.length < FETCH_LIMIT) {
        return { candidates: all, complete: true, reason: null };
      }

      // Full page but zero new IDs → API repeating; stop to avoid infinite walk.
      if (added === 0) {
        return { candidates: all, complete: false, reason: 'repeated_page' };
      }

      offset += FETCH_LIMIT;
    } catch (err) {
      // Keep rows already fetched; mark incomplete so sorting stays disabled.
      if (all.length > 0) {
        return { candidates: all, complete: false, reason: 'partial_error' };
      }
      throw err;
    }
  }

  // Hit safety cap without a short page → incomplete, do not pretend global sort is valid.
  return { candidates: all, complete: false, reason: 'cap' };
}

const CandidatesPage = () => {
  const router = useRouter();
  const [allCandidates, setAllCandidates] = useState<CandidateListItem[]>([]);
  const [datasetComplete, setDatasetComplete] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState<IncompleteReason>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: CandidateSortKey | null;
    direction: ClientSortDirection;
  }>({ key: null, direction: 'ASC' });

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // Global ordering only when the walk confirms a complete deduplicated set.
      // The external API ignores sort/direction and reports an unreliable total (=limit).
      const result = await fetchAllCandidates();
      setAllCandidates(result.candidates);
      setDatasetComplete(result.complete);
      setIncompleteReason(result.reason);
      if (!result.complete) {
        setSortConfig({ key: null, direction: 'ASC' });
        if (result.reason) {
          toast.warn(INCOMPLETE_MESSAGES[result.reason]);
        }
      }
      setCurrentPage(1);
    } catch (err: any) {
      // First-page / empty failure: keep any previously successful dataset.
      setDatasetComplete(false);
      setIncompleteReason('partial_error');
      setSortConfig({ key: null, direction: 'ASC' });
      toast.error(err?.response?.data?.error || err?.message || 'Adaylar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const sortedCandidates = useMemo(() => {
    // Sort only when the full deduplicated dataset is confirmed complete.
    if (!datasetComplete || !sortConfig.key) {
      return allCandidates;
    }
    const key = sortConfig.key;
    const dir = sortConfig.direction;
    return [...allCandidates].sort((a, b) => {
      switch (key) {
        case 'interview_count':
          return compareNumber(a.interview_count ?? 0, b.interview_count ?? 0, dir);
        case 'created_at':
          return compareDate(a.created_at, b.created_at, dir);
        case 'latest_outcome':
          return compareText(outcomeLabel(a.latest_outcome || ''), outcomeLabel(b.latest_outcome || ''), dir);
        case 'current_position':
          return compareText(a.current_position || '', b.current_position || '', dir);
        case 'seniority':
          return compareText(a.seniority || '', b.seniority || '', dir);
        case 'name':
        default:
          return compareText(a.name || '', b.name || '', dir);
      }
    });
  }, [allCandidates, sortConfig, datasetComplete]);

  const total = sortedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageCandidates = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedCandidates.slice(start, start + PAGE_SIZE);
  }, [sortedCandidates, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: CandidateSortKey) => {
    if (!datasetComplete) {
      return;
    }
    let direction: ClientSortDirection = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: CandidateSortKey) => {
    if (!datasetComplete || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const sortableHeaderProps = (key: CandidateSortKey) =>
    datasetComplete
      ? {
          onClick: () => handleSort(key),
          className: 'sortable-header',
          style: { cursor: 'pointer' as const },
        }
      : {
          style: { cursor: 'default' as const },
        };

  return (
    <Container fluid className="page-container">
      <LoadingOverlay show={loading} message="Yükleniyor…" />

      <div className="page-heading-wrapper">
        <PageHeading
          heading="Adaylar"
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      {!loading && incompleteReason && (
        <Alert variant="warning" className="mb-3">
          {INCOMPLETE_MESSAGES[incompleteReason]}
        </Alert>
      )}

      <Row>
        <Col lg={12}>
          <div className="table-wrapper">
            <Card className="border-0 shadow-sm position-relative">
              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th {...sortableHeaderProps('name')}>
                            Ad Soyad {getSortIcon('name')}
                          </th>
                          <th {...sortableHeaderProps('current_position')}>
                            Mevcut Pozisyon {getSortIcon('current_position')}
                          </th>
                          <th {...sortableHeaderProps('seniority')} style={{ ...sortableHeaderProps('seniority').style, width: 120 }}>
                            Kıdem {getSortIcon('seniority')}
                          </th>
                          <th {...sortableHeaderProps('interview_count')} style={{ ...sortableHeaderProps('interview_count').style, width: 130 }}>
                            Görüşme Sayısı {getSortIcon('interview_count')}
                          </th>
                          <th {...sortableHeaderProps('latest_outcome')} style={{ ...sortableHeaderProps('latest_outcome').style, width: 140 }}>
                            Son Sonuç {getSortIcon('latest_outcome')}
                          </th>
                          <th {...sortableHeaderProps('created_at')} style={{ ...sortableHeaderProps('created_at').style, width: 160 }}>
                            Eklenme Tarihi {getSortIcon('created_at')}
                          </th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageCandidates.length > 0 ? (
                          pageCandidates.map((c) => (
                            <tr key={c.id}>
                              <td className="fw-semibold">{c.name || '—'}</td>
                              <td className="text-muted small">{c.current_position || '—'}</td>
                              <td className="small">{c.seniority || '—'}</td>
                              <td className="text-center">
                                <span className="badge bg-secondary rounded-pill">
                                  {c.interview_count ?? 0}
                                </span>
                              </td>
                              <td>
                                {c.latest_outcome ? (
                                  <StatusBadge
                                    status={outcomeToStatus(c.latest_outcome)}
                                    text={outcomeLabel(c.latest_outcome)}
                                    showIcon={false}
                                    size="sm"
                                  />
                                ) : (
                                  <span className="text-muted small">—</span>
                                )}
                              </td>
                              <td className="small text-muted">
                                {c.created_at
                                  ? new Date(c.created_at).toLocaleDateString('tr-TR')
                                  : '—'}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  title="Detay"
                                  onClick={() => router.push(`/candidates/${c.id}`)}
                                >
                                  <Eye size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          !loading && (
                            <tr>
                              <td colSpan={7} className="text-center py-5 text-muted">
                                Kayıtlı aday bulunamadı.
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {total > 0 && (
            <div className="mt-3">
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
              />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CandidatesPage;
