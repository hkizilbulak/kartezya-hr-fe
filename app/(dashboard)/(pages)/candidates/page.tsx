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
  Badge,
  Form,
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { cvSearchService } from '@/services/cv-search.service';
import type {
  CandidateListItem,
  DuplicateCandidateGroup,
  CandidateDetail,
} from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import CustomPagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { Eye, ChevronUp, ChevronDown, GitMerge, Plus } from 'react-feather';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import DuplicatesOffcanvas from '@/components/modals/DuplicatesOffcanvas';
import InterviewModal from '@/components/modals/InterviewModal';
import CandidatePreviewModal from '@/components/modals/CandidatePreviewModal';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const DEFAULT_PAGE_SIZE = 20;

const outcomeToStatus = (
  outcome: string
): React.ComponentProps<typeof StatusBadge>['status'] => {
  return outcome as any;
};

const outcomeLabel = (outcome: string): string => {
  switch (outcome) {
    case 'pre_interview': return 'Ön Görüşme';
    case 'interview': return 'Görüşme';
    case 'decision_pending': return 'Karar bekleniyor';
    case 'hired': return 'İşe alım';
    case 'rejected_pre_interview': return 'Elendi (Ön Görüşme)';
    case 'rejected_interview': return 'Elendi (Görüşme)';
    case 'withdrawn': return 'Süreçten Çekildi';
    case 'pending': return 'Reserve edildi';
    case 'reserved': return 'Reserve edildi';
    case 'reserved_future_hire': return 'Reserve edildi';
    case 'different_account': return 'Farklı ekipte değerlendirilebilir';
    case 'rejected_other_team_possible': return 'Farklı ekipte değerlendirilebilir';
    case 'contact_for_slot': return 'Slot için İletişim';
    
    // Legacy maps
    case 'passed': return 'Olumlu';
    case 'failed': return 'Olumsuz';
    case 'rejected': return 'Reddedildi';
    default:
      return outcome || '—';
  }
};

const interviewTypeLabel = (type: string): string => {
  switch (type) {
    case 'hr': return 'İK';
    case 'technical': return 'Teknik';
    case 'case_study': return 'Kurum Görüşmesi';
    case 'other': return 'Diğer';
    default: return type || 'Belirtilmemiş';
  }
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const trMatch = digits.match(/(5\d{2})(\d{3})(\d{4})$/);
  if (trMatch) {
    return `0${trMatch[1]} ${trMatch[2]} ${trMatch[3]}`;
  }
  return phone;
};

const renderNotesWithLinks = (notes?: string) => {
  if (!notes) return '—';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = notes.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const CandidatesPage = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ASC' | 'DESC';
  }>({ key: null, direction: 'DESC' });

  // Expanded Row states
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [candidateDetailsMap, setCandidateDetailsMap] = useState<Record<number, CandidateDetail>>({});
  const [loadingDetailsMap, setLoadingDetailsMap] = useState<Record<number, boolean>>({});

  // Interview Modal states
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidateIdForInterview, setSelectedCandidateIdForInterview] = useState<number | null>(null);

  // Preview Modal states
  const [previewCandidate, setPreviewCandidate] = useState<CandidateListItem | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CandidateDetail | null>(null);
  const [loadingPreviewDetail, setLoadingPreviewDetail] = useState(false);

  const handleOpenPreview = async (candidate: CandidateListItem) => {
    let finalCandidate: any = candidate;
    setPreviewCandidate(finalCandidate);
    setPreviewDetail(null);
    setLoadingPreviewDetail(true);
    try {
      if (candidate.id) {
        // Fetch detail (contact info, interviews)
        const detailPromise = cvSearchService.getCandidateDetail(candidate.id);
        
        // Fetch graph enriched data (skills, companies) via hybrid search fallback
        const searchPromise = cvSearchService.hybridSearch(candidate.name).catch(() => null);

        const [detail, searchRes] = await Promise.all([detailPromise, searchPromise]);
        setPreviewDetail(detail);

        if (searchRes && searchRes.candidates) {
          const found = searchRes.candidates.find((c: any) => c.id === candidate.id);
          if (found) {
            finalCandidate = found;
            setPreviewCandidate(finalCandidate);
          }
        }
      }
    } catch (err) {
      console.error('Aday detayları yüklenemedi:', err);
    } finally {
      setLoadingPreviewDetail(false);
    }
  };

  const toggleRow = async (e: React.MouseEvent, candidate: CandidateListItem) => {
    e.stopPropagation();
    const candidateId = candidate.id;
    if (!candidateId) return;

    if (expandedRow === candidateId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(candidateId);
    
    if (!candidateDetailsMap[candidateId] && !loadingDetailsMap[candidateId]) {
      setLoadingDetailsMap(prev => ({ ...prev, [candidateId]: true }));
      try {
        const detail = await cvSearchService.getCandidateDetail(candidateId);
        setCandidateDetailsMap(prev => ({ ...prev, [candidateId]: detail }));
      } catch (err) {
        console.error('Aday detayları yüklenemedi:', err);
      } finally {
        setLoadingDetailsMap(prev => ({ ...prev, [candidateId]: false }));
      }
    }
  };

  // ── Duplicate detection ────────────────────────────────────────────────────
  const [dupGroups, setDupGroups] = useState<DuplicateCandidateGroup[]>([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);

  const fetchDuplicates = useCallback(async () => {
    setDupLoading(true);
    try {
      const data = await cvSearchService.getDuplicateCandidates();
      setDupGroups(data.groups ?? []);
    } catch {
      // Sessizce geç — badge gösterilmez
    } finally {
      setDupLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const fetchCandidates = useCallback(async (
    page: number,
    size: number,
    searchQuery: string,
    sortKey: string | null,
    direction: 'ASC' | 'DESC',
    outcomeFilter: string[]
  ) => {
    setLoading(true);
    try {
      const data = await cvSearchService.listCandidates({
        page,
        pageSize: size,
        search: searchQuery || undefined,
        sort: sortKey || undefined,
        direction: direction || undefined,
        outcome: outcomeFilter.length > 0 ? outcomeFilter.join(',') : undefined,
      });
      setCandidates(data.candidates ?? []);
      setTotalCount(data.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Adaylar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(currentPage, pageSize, appliedSearch, sortConfig.key, sortConfig.direction, outcomeFilter);
  }, [currentPage, pageSize, appliedSearch, sortConfig, outcomeFilter, fetchCandidates]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.length >= 3 || search.length === 0) {
        if (search !== appliedSearch) {
          setAppliedSearch(search);
          setCurrentPage(1);
        }
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [search, appliedSearch]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setOutcomeFilter([]);
    setSortConfig({ key: null, direction: 'DESC' });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isInitialLoading = loading && candidates.length === 0;
  const isRefetching = loading && candidates.length > 0;

  return (
    <Container fluid className="page-container">
      <div className="page-heading-wrapper d-flex align-items-center justify-content-between">
        <PageHeading
          heading="Adaylar"
          showCreateButton={false}
          showFilterButton={false}
        />
        <Button
          variant={dupGroups.length > 0 ? 'outline-danger' : 'outline-secondary'}
          size="sm"
          className="d-flex align-items-center gap-2"
          onClick={() => setDupOpen(true)}
          disabled={dupLoading}
          title="Duplikasyon tespiti"
        >
          {dupLoading
            ? <Spinner animation="border" size="sm" />
            : <GitMerge size={14} />
          }
          Duplikasyonlar
          {dupGroups.length > 0 && (
            <Badge bg="danger" pill style={{ fontSize: 10 }}>
              {dupGroups.length}
            </Badge>
          )}
        </Button>
      </div>

      <DuplicatesOffcanvas
        show={dupOpen}
        onHide={() => setDupOpen(false)}
        groups={dupGroups}
        loading={dupLoading}
        onRefresh={fetchDuplicates}
        onMerged={() => {
          fetchCandidates(currentPage, pageSize, appliedSearch, sortConfig.key, sortConfig.direction, outcomeFilter);
        }}
      />

      {/* Arama Kartı */}
      <Row className="mb-3">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <Row className="g-3 align-items-end">
                  <Col lg={4} md={6} sm={12}>
                    <FormTextField
                      as="div"
                      controlId="candidate-search"
                      label="Arama"
                      name="search"
                      type="text"
                      value={search}
                      onChange={(_name, value) => setSearch(value)}
                      placeholder="Ad soyad, pozisyon veya kıdem ara..."
                    />
                  </Col>
                  <Col lg={3} md={6} sm={12}>
                    <FormSelectField
                      label="Son Durum"
                      isMultiSelect
                      name="outcomeFilter"
                      value={outcomeFilter}
                      onChange={(e: any) => {
                        let val = e.target.value as string[];
                        if (val.includes('')) {
                          val = [];
                        }
                        setOutcomeFilter(val);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tüm Durumlar</option>
                      <option value="pre_interview">Ön Görüşme</option>
                      <option value="interview">Görüşme</option>
                      <option value="decision_pending">Karar bekleniyor</option>
                      <option value="hired">İşe alım</option>
                      <option value="rejected_pre_interview">Elendi(Ön Görüşme)</option>
                      <option value="rejected_interview">Elendi(Görüşme)</option>
                      <option value="withdrawn">Süreçten Çekildi</option>
                      <option value="reserved">Reserve edildi</option>
                      <option value="different_account">Farklı ekipte değerlendirilebilir</option>
                      <option value="contact_for_slot">Slot için İletişim</option>
                    </FormSelectField>
                  </Col>
                  <Col lg={3} md={6} sm={12} className="mb-3 pb-1 d-flex align-items-end">
                    <Form.Check
                      type="checkbox"
                      id="preset-in-process"
                      label="Görüşme sürecindekiler"
                      className="mb-0 text-primary"
                      style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      checked={outcomeFilter.join(',') === 'pre_interview,interview,decision_pending,reserved,different_account,contact_for_slot'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOutcomeFilter(['pre_interview', 'interview', 'decision_pending', 'reserved', 'different_account', 'contact_for_slot']);
                        } else {
                          setOutcomeFilter([]);
                        }
                        setCurrentPage(1);
                      }}
                    />
                  </Col>
                  <Col lg={2} md={12} sm={12} className="text-end mb-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="me-2"
                      onClick={handleClearFilters}
                    >
                      Temizle
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                    >
                      Ara
                    </Button>
                  </Col>
                </Row>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                          <th
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 220 }}
                          >
                            Ad Soyad {getSortIcon('name')}
                          </th>
                          <th style={{ width: 300 }}>Pozisyon</th>
                          <th
                            onClick={() => handleSort('seniority')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 140 }}
                          >
                            Tecrübe / Kıdem {getSortIcon('seniority')}
                          </th>
                          <th style={{ width: 150 }}>Son Durum</th>
                          <th
                            onClick={() => handleSort('interview_count')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 130 }}
                          >
                            Görüşme Sayısı {getSortIcon('interview_count')}
                          </th>

                          <th
                            onClick={() => handleSort('created_at')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 160 }}
                          >
                            Eklenme Tarihi {getSortIcon('created_at')}
                          </th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isInitialLoading ? (
                          Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={idx}>
                              <td><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                              <td className="text-center"><div className="placeholder-glow"><span className="placeholder col-3 rounded-pill"></span></div></td>

                              <td><div className="placeholder-glow"><span className="placeholder col-4 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div></td>
                            </tr>
                          ))
                        ) : candidates.length > 0 ? (
                          candidates.map((c) => (
                            <React.Fragment key={c.id}>
                              <tr key={`row-${c.id}`}>
                                <td className="fw-semibold">
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="p-1 me-2"
                                      onClick={(e) => toggleRow(e, c)}
                                      title="Görüşme Geçmişi"
                                      style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}
                                    >
                                      {expandedRow === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </Button>
                                    <span>{c.name || '—'}</span>
                                  </div>
                                </td>
                                <td className="small text-dark text-truncate" style={{ maxWidth: '300px' }} title={c.current_position || '—'}>
                                  {c.current_position || '—'}
                                </td>
                                <td className="small">
                                  {c.experience_years !== undefined && c.experience_years !== null
                                    ? `${c.experience_years} Yıl`
                                    : (c.seniority || '—')}
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
                                <td className="text-center">
                                  <span className="badge bg-secondary rounded-pill">
                                    {c.interview_count ?? 0}
                                  </span>
                                </td>

                                <td className="small text-muted">
                                  {c.created_at
                                    ? new Date(c.created_at).toLocaleDateString('tr-TR')
                                    : '—'}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-1 justify-content-end">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      title="Detay"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPreview(c);
                                      }}
                                    >
                                      <Eye size={14} />
                                    </Button>
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      title="Görüşme Ekle"
                                      onClick={() => {
                                        if (c.id) {
                                          setSelectedCandidateIdForInterview(c.id);
                                          setShowInterviewModal(true);
                                        }
                                      }}
                                    >
                                      <Plus size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              {expandedRow === c.id && (
                                <tr style={{ background: '#f4f7fb', boxShadow: 'inset 0 4px 6px -4px rgba(0,0,0,0.05)' }}>
                                  <td colSpan={8} className="p-3" style={{ borderTop: 'none' }}>
                                    {loadingDetailsMap[c.id] ? (
                                      <div className="d-flex justify-content-center py-3">
                                        <Spinner animation="border" variant="primary" size="sm" />
                                      </div>
                                    ) : candidateDetailsMap[c.id] ? (
                                      <div className="bg-white rounded p-2 shadow-sm mx-1" style={{ border: '1px solid #e9ecef', borderLeft: '4px solid var(--bs-primary)' }}>
                                        <div className="d-flex gap-4 p-2 mb-2 bg-light rounded" style={{ fontSize: '0.85rem' }}>
                                          <div>
                                            <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>E-Posta</span>
                                            <span className="fw-medium">{c.email?.toLowerCase() || '—'}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Telefon</span>
                                            <span className="fw-medium">{c.phone ? formatPhone(c.phone) : '—'}</span>
                                          </div>
                                          {c.experience_years !== undefined && c.experience_years !== null && (
                                            <div>
                                              <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Kıdem</span>
                                              <span className="fw-medium">{c.seniority || '—'}</span>
                                            </div>
                                          )}
                                        </div>

                                        {candidateDetailsMap[c.id].interviews && candidateDetailsMap[c.id].interviews.length > 0 ? (
                                          <div className="position-relative py-3 px-2">
                                            <div 
                                              className="position-absolute" 
                                              style={{ left: '128px', top: '24px', bottom: '24px', width: '2px', background: '#e9ecef', zIndex: 0 }}
                                            />
                                            {candidateDetailsMap[c.id].interviews.map((inv, idx) => (
                                              <div key={inv.id} className="d-flex position-relative align-items-start" style={{ zIndex: 1 }}>
                                                <div style={{ width: '115px', textAlign: 'right' }} className="pe-3 pt-1">
                                                  <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                                    {new Date(inv.interview_date).toLocaleDateString('tr-TR')}
                                                  </div>
                                                  <div className="text-muted text-capitalize mb-1" style={{ fontSize: '0.75rem' }}>
                                                    {interviewTypeLabel(inv.interview_type)}
                                                  </div>
                                                  <div className="text-dark fw-bold mt-1" style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                                    {inv.interviewer_name ? (
                                                      inv.interviewer_name.split(',').map((name, i) => (
                                                        <div key={i}>{name.trim()}</div>
                                                      ))
                                                    ) : (
                                                      'Görüşmeci Yok'
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="d-flex justify-content-center" style={{ width: '12px', paddingTop: '6px' }}>
                                                  <div 
                                                    className="rounded-circle border border-2 border-primary bg-white" 
                                                    style={{ width: '12px', height: '12px' }}
                                                  />
                                                </div>
                                                <div className="ps-4 w-100" style={{ flex: 1 }}>
                                                  <div className="d-flex flex-column align-items-start gap-1">
                                                    <div className="mb-1">
                                                      <StatusBadge
                                                        status={inv.outcome}
                                                        text={outcomeLabel(inv.outcome)}
                                                        showIcon={false}
                                                        size="sm"
                                                      />
                                                    </div>
                                                    <div className="text-secondary fw-medium mt-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#495057' }}>
                                                      {inv.team ? inv.team.toUpperCase() : 'EKİP BİLGİSİ YOK'}
                                                    </div>
                                                    <div className="text-secondary mt-1" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                      {inv.notes ? (
                                                        <span className="fst-italic">{renderNotesWithLinks(inv.notes)}</span>
                                                      ) : (
                                                        <span className="text-muted" style={{ opacity: 0.7 }}>Not bulunmuyor.</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {idx !== candidateDetailsMap[c.id].interviews.length - 1 && (
                                                    <div className="border-bottom my-4" style={{ borderColor: '#e9ecef' }} />
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-muted small text-center py-2">Bu aday için henüz görüşme kaydı bulunmuyor.</div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-danger small text-center py-2">Detaylar yüklenemedi.</div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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

      {/* Interview Modal */}
      {showInterviewModal && selectedCandidateIdForInterview && (
        <InterviewModal
          show={showInterviewModal}
          onHide={() => {
            setShowInterviewModal(false);
            setSelectedCandidateIdForInterview(null);
          }}
          onSave={() => {
            fetchCandidates(currentPage, pageSize, appliedSearch, sortConfig.key, sortConfig.direction, outcomeFilter);
            if (expandedRow === selectedCandidateIdForInterview) {
              setLoadingDetailsMap(prev => ({ ...prev, [selectedCandidateIdForInterview]: true }));
              cvSearchService.getCandidateDetail(selectedCandidateIdForInterview).then(detail => {
                setCandidateDetailsMap(prev => ({ ...prev, [selectedCandidateIdForInterview]: detail }));
                setLoadingDetailsMap(prev => ({ ...prev, [selectedCandidateIdForInterview]: false }));
              }).catch(() => {
                setLoadingDetailsMap(prev => ({ ...prev, [selectedCandidateIdForInterview]: false }));
              });
            }
          }}
          candidateId={selectedCandidateIdForInterview}
        />
      )}

      {/* Candidate Preview Modal */}
      <CandidatePreviewModal
        show={!!previewCandidate}
        onHide={() => {
          setPreviewCandidate(null);
          setPreviewDetail(null);
        }}
        candidate={previewCandidate}
        detail={previewDetail}
        loadingDetail={loadingPreviewDetail}
        hideSearchMetrics={true}
      />
    </Container>
  );
};

export default CandidatesPage;
