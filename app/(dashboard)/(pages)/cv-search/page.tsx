"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Container, Form,
} from 'react-bootstrap';
import { cvSearchService } from '@/services';
import type {
  FusedCandidateResponse,
  HybridSearchResponse,
  SuggestionResult,
} from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Search, ChevronDown, ChevronUp, Plus } from 'react-feather';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';
import styles from './cv-search.module.scss';

const scoreColor = (score: number): string => {
  if (score >= 0.7) return '#198754';
  if (score >= 0.4) return '#fd7e14';
  return '#6c757d';
};

const suggestionTypeLabel = (type: string) => {
  switch (type) {
    case 'skill': return 'Beceri';
    case 'company': return 'Şirket';
    case 'position': return 'Pozisyon';
    default: return type;
  }
};

const CvSearchPage = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [meta, setMeta] = useState<Omit<HybridSearchResponse, 'candidates' | 'config'> | null>(null);
  const [results, setResults] = useState<FusedCandidateResponse[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Popular queries
  const [popularQueries, setPopularQueries] = useState<string[]>([]);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  // When true, the next suggestions effect run is skipped (programmatic query set)
  const suppressSuggestRef = useRef(false);

  // Load popular queries on mount
  useEffect(() => {
    cvSearchService.getPopularQueries().then((data) => {
      setPopularQueries((data ?? []).slice(0, 10));
    }).catch(() => {
      // silently ignore
    });
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    // Skip if the query was set programmatically (popular query / suggestion click)
    if (suppressSuggestRef.current) {
      suppressSuggestRef.current = false;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const data = await cvSearchService.getSuggestions(trimmed, 5);
        setSuggestions(data ?? []);
        setShowSuggestions((data ?? []).length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const executeSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      toast.warning('Lütfen bir arama sorgusu girin.');
      return;
    }
    setIsSearching(true);
    setResults([]);
    setExpandedRows(new Set());
    setMeta(null);
    setShowSuggestions(false);
    try {
      const response = await cvSearchService.hybridSearch(trimmed);
      setResults(response.candidates || []);
      setMeta({
        total_found: response.total_found,
        processing_time: response.processing_time,
        method: response.method,
        query: response.query,
      });
      if ((response.candidates || []).length === 0) {
        toast.info('Arama kriterlerine uygun aday bulunamadı.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Arama sırasında bir hata oluştu.';
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = () => executeSearch(query);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  const handleSuggestionClick = (s: SuggestionResult) => {
    suppressSuggestRef.current = true;
    setQuery(s.text);
    setShowSuggestions(false);
    setSuggestions([]);
    executeSearch(s.text);
  };

  const handlePopularQueryClick = (q: string) => {
    suppressSuggestRef.current = true;
    setQuery(q);
    setShowSuggestions(false);
    setSuggestions([]);
    executeSearch(q);
  };

  const toggleRow = (rank: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const currentCompany = (c: FusedCandidateResponse) =>
    c.companies?.find((co) => co.is_current)?.name ||
    c.companies?.[0]?.name ||
    '—';

  const topSkills = (c: FusedCandidateResponse) =>
    c.skills
      ?.slice(0, 5)
      .map((s) => s.name)
      .join(', ') || '—';

  return (
    <Container fluid className="page-container">
      <LoadingOverlay show={isSearching} message="Aranıyor…" />

      <div className="page-heading-wrapper">
        <PageHeading
          heading="CV Arama"
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      {/* Search input */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form.Group>
                <Form.Label className="fw-semibold mb-2">
                  Arama Sorgusu
                  <span className="text-muted fw-normal small ms-2">
                    (Enter ile arayın)
                  </span>
                </Form.Label>

                {/* Textarea + Suggestions wrapper */}
                <div style={{ position: 'relative' }}>
                  <Form.Control
                    ref={textareaRef}
                    type="text"
                    placeholder="Örn: 5 yıl deneyimli backend geliştirici, Python ve PostgreSQL bilen, tercihen İstanbul'da"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    disabled={isSearching}
                  />

                  {/* Autocomplete dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1050,
                        background: '#fff',
                        border: '1px solid #dee2e6',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        maxHeight: 220,
                        overflowY: 'auto',
                      }}
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                          style={{ cursor: 'pointer' }}
                          className="d-flex align-items-center justify-content-between px-3 py-2"
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <span className="fw-semibold small">{s.text}</span>
                          <Badge
                            bg="light"
                            text="secondary"
                            className="border small ms-2"
                            style={{ fontSize: '0.68rem' }}
                          >
                            {suggestionTypeLabel(s.type)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Form.Group>

              <div className="mt-3">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                >
                  <Search size={16} className="me-1" />
                  Ara
                </Button>
              </div>

              {/* Popular Queries */}
              {popularQueries.length > 0 && (
                <div className="mt-3">
                  <div className="text-muted small mb-2">Popüler Aramalar:</div>
                  <div className="d-flex flex-wrap gap-2">
                    {popularQueries.map((q, i) => (
                      <div
                        key={i}
                        className="d-inline-flex align-items-center border rounded-pill px-2 py-1 gap-1"
                        style={{ background: '#f8f9fa', fontSize: '0.8rem', maxWidth: 300 }}
                      >
                        <span
                          className="text-truncate"
                          style={{ maxWidth: 240, cursor: 'default' }}
                          title={q}
                        >
                          {q}
                        </span>
                        <button
                          type="button"
                          className="btn btn-link p-0 ms-1 text-primary"
                          style={{ lineHeight: 1, fontSize: '0.8rem' }}
                          title="Bu sorguyla ara"
                          disabled={isSearching}
                          onClick={() => handlePopularQueryClick(q)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results */}
      {meta && (
        <Row>
          <Col lg={12}>
            {/* Meta row */}
            <div className="d-flex align-items-center gap-3 mb-2 px-1">
              <span className="fw-semibold">{meta.total_found} aday bulundu</span>
              <span className="text-muted small">·</span>
              <span className="text-muted small">{meta.processing_time}</span>
              <span className="text-muted small">·</span>
              <Badge bg="secondary" className="fw-normal">{meta.method}</Badge>
            </div>

            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 50 }} className={`${styles.stickyCol1} ${styles.stickyHeader}`}>Sıra</th>
                            <th className={`${styles.stickyCol2} ${styles.stickyHeader}`}>Ad</th>
                            <th>Mevcut Pozisyon</th>
                            <th style={{ width: 110 }}>Kıdem</th>
                            <th style={{ width: 90 }}>Deneyim</th>
                            <th>Beceriler</th>
                            <th>Şirket</th>
                            <th style={{ width: 110 }}>Fusion Skoru</th>
                            <th style={{ width: 100 }}>LLM Skoru</th>
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.length > 0 ? (
                            results.map((candidate) => {
                              const isExpanded = expandedRows.has(candidate.rank);
                              return (
                                <>
                                  <tr
                                    key={`row-${candidate.rank}`}
                                    className={`${styles.clickableRow}${isExpanded ? ` ${styles.selectedRow}` : ''}`}
                                    onClick={() => toggleRow(candidate.rank)}
                                  >
                                    <td className={`text-center fw-semibold ${styles.stickyCol1}`}>
                                      {candidate.rank}
                                    </td>
                                    <td className={`fw-semibold ${styles.stickyCol2}`}>
                                      {candidate.name || '—'}
                                    </td>
                                    <td className="text-muted small">
                                      {candidate.current_position || '—'}
                                    </td>
                                    <td className="small">
                                      {candidate.seniority || '—'}
                                    </td>
                                    <td className="text-center small">
                                      {candidate.total_experience_years != null
                                        ? `${candidate.total_experience_years} yıl`
                                        : '—'}
                                    </td>
                                    <td className="small text-muted">
                                      {topSkills(candidate)}
                                    </td>
                                    <td className="small">
                                      {currentCompany(candidate)}
                                    </td>
                                    <td>
                                      <span
                                        className="fw-semibold"
                                        style={{
                                          color: scoreColor(candidate.fusion_score),
                                        }}
                                      >
                                        {candidate.fusion_score != null
                                          ? candidate.fusion_score.toFixed(3)
                                          : '—'}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        style={{
                                          color: scoreColor(candidate.llm_score),
                                        }}
                                      >
                                        {candidate.llm_score != null
                                          ? candidate.llm_score.toFixed(3)
                                          : '—'}
                                      </span>
                                    </td>
                                    <td>
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); toggleRow(candidate.rank); }}
                                        title="Detay"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp size={14} />
                                        ) : (
                                          <ChevronDown size={14} />
                                        )}
                                      </Button>
                                    </td>
                                  </tr>

                                  {isExpanded && (
                                    <tr key={`detail-${candidate.rank}`} className={styles.detailRow}>
                                      <td colSpan={10} className="p-3">
                                        <Row>
                                          {/* LLM Reasoning */}
                                          <Col md={6}>
                                            <p className="fw-semibold mb-1 small">LLM Gerekçesi</p>
                                            <p
                                              className="small text-muted mb-0"
                                              style={{ whiteSpace: 'pre-wrap' }}
                                            >
                                              {candidate.llm_reasoning || 'Gerekçe mevcut değil.'}
                                            </p>
                                          </Col>

                                          {/* Company history */}
                                          <Col md={3}>
                                            <p className="fw-semibold mb-1 small">Şirket Geçmişi</p>
                                            {candidate.companies && candidate.companies.length > 0 ? (
                                              <ul className="list-unstyled mb-0">
                                                {candidate.companies.map((co, ci) => (
                                                  <li key={ci} className="small text-muted mb-1">
                                                    <span
                                                      className={co.is_current ? 'fw-semibold text-dark' : ''}
                                                    >
                                                      {co.name}
                                                    </span>
                                                    {co.position && (
                                                      <span className="ms-1 text-secondary">
                                                        — {co.position}
                                                      </span>
                                                    )}
                                                    {co.is_current && (
                                                      <Badge bg="success" className="ms-1 small">
                                                        Güncel
                                                      </Badge>
                                                    )}
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <span className="small text-muted">—</span>
                                            )}
                                          </Col>

                                          {/* All skills */}
                                          <Col md={3}>
                                            <p className="fw-semibold mb-1 small">Tüm Beceriler</p>
                                            {candidate.skills && candidate.skills.length > 0 ? (
                                              <div className="d-flex flex-wrap gap-1">
                                                {candidate.skills.map((sk, si) => (
                                                  <Badge
                                                    key={si}
                                                    bg="light"
                                                    text="dark"
                                                    className="border small"
                                                    title={
                                                      sk.years_of_experience
                                                        ? `${sk.years_of_experience} yıl deneyim`
                                                        : undefined
                                                    }
                                                  >
                                                    {sk.name}
                                                    {sk.proficiency && (
                                                      <span className="text-muted ms-1">
                                                        · {sk.proficiency}
                                                      </span>
                                                    )}
                                                  </Badge>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="small text-muted">—</span>
                                            )}
                                          </Col>
                                        </Row>

                                        {/* Score breakdown */}
                                        <Row className="mt-3">
                                          <Col>
                                            <div className="d-flex flex-wrap gap-3">
                                              {[
                                                { label: 'Vektör', value: candidate.vector_score },
                                                { label: 'BM25', value: candidate.bm25_score },
                                                { label: 'Graf', value: candidate.graph_score },
                                                { label: 'LLM', value: candidate.llm_score },
                                                { label: 'Fusion', value: candidate.fusion_score },
                                              ].map((sc) => (
                                                <div key={sc.label} className="text-center">
                                                  <div
                                                    className="small fw-semibold"
                                                    style={{ color: scoreColor(sc.value) }}
                                                  >
                                                    {sc.value != null ? sc.value.toFixed(3) : '—'}
                                                  </div>
                                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                    {sc.label}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </Col>
                                        </Row>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center py-5 text-muted">
                                Arama sonucu bulunamadı
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
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CvSearchPage;
