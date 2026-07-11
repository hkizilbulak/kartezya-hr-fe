"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Container,
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
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const PAGE_SIZE = 20;

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
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Sıralama State
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchCandidates = useCallback(async (page: number, sortKey: string | null, sortDir: 'ASC' | 'DESC') => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const data = await cvSearchService.listCandidates(PAGE_SIZE, offset, sortKey || undefined, sortDir);
      setCandidates(data.candidates ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Adaylar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(currentPage, sortConfig.key, sortConfig.direction);
  }, [fetchCandidates, currentPage, sortConfig]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ? 
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> : 
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = (a as any)[sortConfig.key] || '';
    const valB = (b as any)[sortConfig.key] || '';
    if (valA < valB) return sortConfig.direction === 'ASC' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'ASC' ? 1 : -1;
    return 0;
  });

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
                          <th onClick={() => handleSort('name')} className="sortable-header" style={{ cursor: 'pointer' }}>
                            Ad Soyad {getSortIcon('name')}
                          </th>
                          <th onClick={() => handleSort('current_position')} className="sortable-header" style={{ cursor: 'pointer' }}>
                            Mevcut Pozisyon {getSortIcon('current_position')}
                          </th>
                          <th onClick={() => handleSort('seniority')} className="sortable-header" style={{ cursor: 'pointer', width: 120 }}>
                            Kıdem {getSortIcon('seniority')}
                          </th>
                          <th style={{ width: 130 }}>Görüşme Sayısı</th>
                          <th style={{ width: 140 }}>Son Sonuç</th>
                          <th onClick={() => handleSort('created_at')} className="sortable-header" style={{ cursor: 'pointer', width: 160 }}>
                            Eklenme Tarihi {getSortIcon('created_at')}
                          </th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCandidates.length > 0 ? (
                          sortedCandidates.map((c) => (
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