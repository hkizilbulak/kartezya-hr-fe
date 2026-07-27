"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Container,
  Spinner,
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { cvSearchService } from '@/services/cv-search.service';
import type { CandidateListItem } from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import CustomPagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { Eye } from 'react-feather';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const DEFAULT_PAGE_SIZE = 20;

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

const CandidatesPage = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const data = await cvSearchService.listCandidates({ page, pageSize: size });
      setCandidates(data.candidates ?? []);
      setTotalCount(data.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Adaylar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(currentPage, pageSize);
  }, [currentPage, pageSize, fetchCandidates]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isInitialLoading = loading && candidates.length === 0;
  const isRefetching = loading && candidates.length > 0;

  return (
    <Container fluid className="page-container">
      <div className="page-heading-wrapper">
        <PageHeading
          heading="Adaylar"
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      <Row>
        <Col lg={12}>
          <div className="table-wrapper">
            <Card className="border-0 shadow-sm position-relative overflow-hidden">
              {/* Refetching Overlay Indicator */}
              {isRefetching && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 10,
                    transition: 'opacity 0.2s ease-in-out',
                  }}
                >
                  <div className="bg-white shadow-sm border px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <span className="small text-secondary fw-semibold">Yükleniyor…</span>
                  </div>
                </div>
              )}

              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="table-responsive">
                    <Table hover className="mb-0" style={{ opacity: isRefetching ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
                      <thead>
                        <tr>
                          <th>Ad Soyad</th>
                          <th>Mevcut Pozisyon</th>
                          <th style={{ width: 120 }}>Kıdem</th>
                          <th style={{ width: 130 }}>Görüşme Sayısı</th>
                          <th style={{ width: 140 }}>Son Sonuç</th>
                          <th style={{ width: 160 }}>Eklenme Tarihi</th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isInitialLoading ? (
                          Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={idx}>
                              <td><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-4 rounded"></span></div></td>
                              <td className="text-center"><div className="placeholder-glow"><span className="placeholder col-3 rounded-pill"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-5 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-4 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div></td>
                            </tr>
                          ))
                        ) : candidates.length > 0 ? (
                          candidates.map((c) => (
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
                          <tr>
                            <td colSpan={7} className="text-center py-5 text-muted">
                              Kayıtlı aday bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="mt-3">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              totalItems={totalCount}
              itemsPerPage={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CandidatesPage;
