"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Container, Form, Modal, Spinner
} from 'react-bootstrap';
import { cvSearchService } from '@/services';
import type {
  FusedCandidateResponse,
  HybridSearchResponse,
  SuggestionResult,
  CandidateDetail
} from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Search, ChevronDown, ChevronUp, Plus, Eye, Mail, Phone, MapPin, Briefcase, Calendar } from 'react-feather';
import { useRouter } from 'next/navigation';
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

const seniorityScore = (seniority: string): number => {
  const sen = (seniority || '').toLowerCase();
  if (sen.includes('junior') || sen.includes('yeni')) return 1;
  if (sen.includes('mid') || sen.includes('orta')) return 2;
  if (sen.includes('senior') || sen.includes('deneyimli') || sen.includes('uzman')) return 3;
  if (sen.includes('lead') || sen.includes('yönetici') || sen.includes('müdür') || sen.includes('principal') || sen.includes('director')) return 4;
  return 0;
};

const EXPERIENCE_DOMAINS = [
  {
    id: 'bankacilik',
    label: 'Bankacılık & Finans',
    keywords: ['bank', 'kredi', 'finans', 'finance', 'factoring', 'sigorta', 'bireysel emeklilik', 'investment', 'yatırım', 'portföy', 'teller', 'gişe']
  },
  {
    id: 'eticaret',
    label: 'E-Ticaret & Perakende',
    keywords: ['e-ticaret', 'ecommerce', 'e-commerce', 'perakende', 'retail', 'pazaryeri', 'trendyol', 'hepsiburada', 'n11', 'getir', 'migros']
  },
  {
    id: 'savunma',
    label: 'Savunma Sanayii',
    keywords: ['savunma', 'defense', 'aselsan', 'havelsan', 'roketsan', 'tai', 'tusaş', 'baykar', 'stm']
  },
  {
    id: 'telekom',
    label: 'Telekomünikasyon',
    keywords: ['telekom', 'telecom', 'turkcell', 'vodafone', 'türk telekom']
  },
  {
    id: 'mobil',
    label: 'Mobil Geliştirme',
    keywords: ['mobil', 'mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin']
  },
  {
    id: 'yapayzeka',
    label: 'Yapay Zeka & Veri',
    keywords: ['yapay zeka', 'ai', 'artificial intelligence', 'machine learning', 'makine öğrenmesi', 'data science', 'veri bilimi', 'deep learning', 'veri analizi']
  },
  {
    id: 'bulut',
    label: 'Bulut & DevOps',
    keywords: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'bulut']
  }
];

const hasDomainExperience = (c: FusedCandidateResponse, keywords: string[]): boolean => {
  const checkText = (text: string) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw.toLowerCase()));
  };

  if (checkText(c.current_position)) return true;

  if (c.companies && c.companies.length > 0) {
    for (const co of c.companies) {
      if (checkText(co.name) || checkText(co.position)) return true;
    }
  }

  if (c.skills && c.skills.length > 0) {
    for (const s of c.skills) {
      if (checkText(s.name)) return true;
    }
  }

  if (checkText(c.llm_reasoning)) return true;

  return false;
};

const CvSearchPage = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [meta, setMeta] = useState<Omit<HybridSearchResponse, 'candidates' | 'config'> | null>(null);
  const [results, setResults] = useState<FusedCandidateResponse[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // CV Preview Modal states
  const [previewCandidate, setPreviewCandidate] = useState<FusedCandidateResponse | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CandidateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Client-side filtering & sorting states
  const [selectedSeniorities, setSelectedSeniorities] = useState<Set<string>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(new Set());
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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
    setSelectedSeniorities(new Set());
    setSelectedSkills(new Set());
    setSelectedExperiences(new Set());
    setSelectedDomains(new Set());
    setSortConfig(null);
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
    textareaRef.current?.focus();
  };

  const handlePopularQueryClick = (q: string) => {
    suppressSuggestRef.current = true;
    setQuery(q);
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
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

  const handleOpenPreview = async (candidate: FusedCandidateResponse) => {
    setPreviewCandidate(candidate);
    setPreviewDetail(null);
    setLoadingDetail(true);
    try {
      const candidateId = candidate.id;
      if (candidateId) {
        const detail = await cvSearchService.getCandidateDetail(candidateId);
        setPreviewDetail(detail);
      }
    } catch (err) {
      console.error('Aday detayları yüklenemedi:', err);
    } finally {
      setLoadingDetail(false);
    }
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

  const toggleExperience = (key: string) => {
    setSelectedExperiences((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSeniority = (val: string) => {
    setSelectedSeniorities((prev) => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  const toggleSkill = (val: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  const toggleDomain = (val: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} className="ms-1 text-primary align-middle" />
    ) : (
      <ChevronDown size={14} className="ms-1 text-primary align-middle" />
    );
  };

  const seniorities = useMemo(() => {
    return Array.from(new Set(results.map((r) => r.seniority).filter(Boolean))) as string[];
  }, [results]);

  const topSkillsInResults = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      (r.skills || []).forEach((s) => {
        if (s.name) {
          counts[s.name] = (counts[s.name] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);
  }, [results]);

  const availableDomains = useMemo(() => {
    return EXPERIENCE_DOMAINS.filter((domain) =>
      results.some((candidate) => hasDomainExperience(candidate, domain.keywords))
    );
  }, [results]);

  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];

    // 1. Client-side filtering by buttons
    if (selectedSeniorities.size > 0) {
      list = list.filter((r) => selectedSeniorities.has(r.seniority));
    }

    if (selectedSkills.size > 0) {
      list = list.filter((r) => (r.skills || []).some((s) => selectedSkills.has(s.name)));
    }

    if (selectedExperiences.size > 0) {
      list = list.filter((r) => {
        const yrs = r.total_experience_years ?? 0;
        return Array.from(selectedExperiences).some((expKey) => {
          if (expKey === 'junior') return yrs < 2;
          if (expKey === 'mid') return yrs >= 2 && yrs <= 5;
          if (expKey === 'senior') return yrs > 5;
          return true;
        });
      });
    }

    if (selectedDomains.size > 0) {
      list = list.filter((r) => {
        return Array.from(selectedDomains).some((domId) => {
          const activeDomain = EXPERIENCE_DOMAINS.find((d) => d.id === domId);
          return activeDomain ? hasDomainExperience(r, activeDomain.keywords) : false;
        });
      });
    }

    // 2. Client-side sorting
    if (sortConfig) {
      list.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        switch (sortConfig.key) {
          case 'rank':
            valA = a.rank ?? 0;
            valB = b.rank ?? 0;
            break;
          case 'name':
            valA = a.name || '';
            valB = b.name || '';
            break;
          case 'current_position':
            valA = a.current_position || '';
            valB = b.current_position || '';
            break;
          case 'seniority':
            valA = seniorityScore(a.seniority);
            valB = seniorityScore(b.seniority);
            break;
          case 'total_experience_years':
            valA = a.total_experience_years ?? 0;
            valB = b.total_experience_years ?? 0;
            break;
          case 'company':
            valA = currentCompany(a);
            valB = currentCompany(b);
            break;
          case 'fusion_score':
            valA = a.fusion_score ?? 0;
            valB = b.fusion_score ?? 0;
            break;
          case 'llm_score':
            valA = a.llm_score ?? 0;
            valB = b.llm_score ?? 0;
            break;
          default:
            return 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          const comp = valA.localeCompare(valB, 'tr');
          return sortConfig.direction === 'asc' ? comp : -comp;
        } else {
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }

    return list;
  }, [results, selectedSeniorities, selectedSkills, selectedExperiences, selectedDomains, sortConfig]);

  const isFilterActive = selectedSeniorities.size > 0 || selectedSkills.size > 0 || selectedExperiences.size > 0 || selectedDomains.size > 0;

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
              {isFilterActive ? (
                <span className="fw-semibold text-dark">
                  Filtrelenen: <span className="text-primary fw-bold">{filteredAndSortedResults.length}</span> / {results.length} aday listeleniyor
                </span>
              ) : (
                <span className="fw-semibold text-dark">{results.length} aday bulundu</span>
              )}
              <span className="text-muted small">·</span>
              <span className="text-muted small">{meta.processing_time}</span>
              <span className="text-muted small">·</span>
              <Badge bg="secondary" className="fw-normal">{meta.method}</Badge>
            </div>

            {/* Filter Buttons Facet Card */}
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body className="p-3">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
                    <span className="fw-semibold text-dark small">Sonuçları Filtrele</span>
                    {(selectedSeniorities.size > 0 || selectedSkills.size > 0 || selectedExperiences.size > 0 || selectedDomains.size > 0) && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none text-danger small"
                        onClick={() => {
                          setSelectedSeniorities(new Set());
                          setSelectedSkills(new Set());
                          setSelectedExperiences(new Set());
                          setSelectedDomains(new Set());
                        }}
                      >
                        Filtreleri Sıfırla
                      </Button>
                    )}
                  </div>

                  {/* Experience Brackets */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="text-muted small fw-semibold" style={{ minWidth: '120px' }}>Deneyim Süresi:</span>
                    <Button
                      variant={selectedExperiences.size === 0 ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSelectedExperiences(new Set())}
                    >
                      Hepsi
                    </Button>
                    {[
                      { key: 'junior', label: '< 2 Yıl' },
                      { key: 'mid', label: '2-5 Yıl' },
                      { key: 'senior', label: '5+ Yıl' }
                    ].map((item) => (
                      <Button
                        key={item.key}
                        variant={selectedExperiences.has(item.key) ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill px-3 py-1"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => toggleExperience(item.key)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  {/* Sektör/Tecrübe (Domain) Filters */}
                  {availableDomains.length > 0 && (
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small fw-semibold" style={{ minWidth: '120px' }}>Sektör/Tecrübe:</span>
                      <Button
                        variant={selectedDomains.size === 0 ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill px-3 py-1"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => setSelectedDomains(new Set())}
                      >
                        Hepsi
                      </Button>
                      {availableDomains.map((dom) => (
                        <Button
                          key={dom.id}
                          variant={selectedDomains.has(dom.id) ? 'primary' : 'outline-secondary'}
                          size="sm"
                          className="rounded-pill px-3 py-1"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => toggleDomain(dom.id)}
                        >
                          {dom.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Seniority Levels */}
                  {seniorities.length > 0 && (
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small fw-semibold" style={{ minWidth: '120px' }}>Kıdem Seviyesi:</span>
                      <Button
                        variant={selectedSeniorities.size === 0 ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill px-3 py-1"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => setSelectedSeniorities(new Set())}
                      >
                        Hepsi
                      </Button>
                      {seniorities.map((sen) => (
                        <Button
                          key={sen}
                          variant={selectedSeniorities.has(sen) ? 'primary' : 'outline-secondary'}
                          size="sm"
                          className="rounded-pill px-3 py-1"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => toggleSeniority(sen)}
                        >
                          {sen}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Top Skills */}
                  {topSkillsInResults.length > 0 && (
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small fw-semibold" style={{ minWidth: '120px' }}>Öne Çıkan Yetenek:</span>
                      <Button
                        variant={selectedSkills.size === 0 ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill px-3 py-1"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => setSelectedSkills(new Set())}
                      >
                        Hepsi
                      </Button>
                      {topSkillsInResults.map((sk) => (
                        <Button
                          key={sk}
                          variant={selectedSkills.has(sk) ? 'primary' : 'outline-secondary'}
                          size="sm"
                          className="rounded-pill px-3 py-1"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => toggleSkill(sk)}
                        >
                          {sk}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Sıralama Seçenekleri */}
                  <div className="d-flex align-items-center gap-2 flex-wrap border-top pt-3 mt-1">
                    <span className="text-muted small fw-semibold" style={{ minWidth: '120px' }}>Sonuçları Sırala:</span>
                    
                    {/* Name Sorting */}
                    <Button
                      variant={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}
                    >
                      İsim (A-Z)
                    </Button>
                    <Button
                      variant={sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}
                    >
                      İsim (Z-A)
                    </Button>

                    {/* Experience Sorting */}
                    <Button
                      variant={sortConfig?.key === 'total_experience_years' && sortConfig.direction === 'asc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'total_experience_years', direction: 'asc' })}
                    >
                      Deneyim (Artan)
                    </Button>
                    <Button
                      variant={sortConfig?.key === 'total_experience_years' && sortConfig.direction === 'desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'total_experience_years', direction: 'desc' })}
                    >
                      Deneyim (Azalan)
                    </Button>

                    {/* Seniority Sorting */}
                    <Button
                      variant={sortConfig?.key === 'seniority' && sortConfig.direction === 'asc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'seniority', direction: 'asc' })}
                    >
                      Kıdem (Artan)
                    </Button>
                    <Button
                      variant={sortConfig?.key === 'seniority' && sortConfig.direction === 'desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 py-1"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setSortConfig({ key: 'seniority', direction: 'desc' })}
                    >
                      Kıdem (Azalan)
                    </Button>

                    {/* Clear/Reset Sort */}
                    {sortConfig && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none text-danger small ms-2"
                        onClick={() => setSortConfig(null)}
                      >
                        Sıralamayı Sıfırla
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th
                              style={{ width: 50 }}
                              className={`${styles.stickyCol1} ${styles.stickyHeader} ${styles.sortableHeader}`}
                              onClick={() => requestSort('rank')}
                            >
                              Sıra {renderSortIcon('rank')}
                            </th>
                            <th
                              className={`${styles.stickyCol2} ${styles.stickyHeader} ${styles.sortableHeader}`}
                              onClick={() => requestSort('name')}
                            >
                              Ad {renderSortIcon('name')}
                            </th>
                            <th
                              className={styles.sortableHeader}
                              onClick={() => requestSort('current_position')}
                            >
                              Mevcut Pozisyon {renderSortIcon('current_position')}
                            </th>
                            <th
                              style={{ width: 110 }}
                              className={styles.sortableHeader}
                              onClick={() => requestSort('seniority')}
                            >
                              Kıdem {renderSortIcon('seniority')}
                            </th>
                            <th
                              style={{ width: 90 }}
                              className={styles.sortableHeader}
                              onClick={() => requestSort('total_experience_years')}
                            >
                              Deneyim {renderSortIcon('total_experience_years')}
                            </th>
                            <th>Beceriler</th>
                            <th
                              className={styles.sortableHeader}
                              onClick={() => requestSort('company')}
                            >
                              Şirket {renderSortIcon('company')}
                            </th>
                            <th
                              style={{ width: 110 }}
                              className={styles.sortableHeader}
                              onClick={() => requestSort('fusion_score')}
                            >
                              Fusion Skoru {renderSortIcon('fusion_score')}
                            </th>
                            <th
                              style={{ width: 100 }}
                              className={styles.sortableHeader}
                              onClick={() => requestSort('llm_score')}
                            >
                              LLM Skoru {renderSortIcon('llm_score')}
                            </th>
                            <th style={{ width: 100 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.length > 0 ? (
                            filteredAndSortedResults.length > 0 ? (
                              filteredAndSortedResults.map((candidate) => {
                                const isExpanded = expandedRows.has(candidate.rank);
                              return (
                                <React.Fragment key={candidate.rank}>
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
                                      <div className="d-flex align-items-center gap-1 justify-content-end">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPreview(candidate);
                                          }}
                                          title="CV Görüntüle"
                                        >
                                          <Eye size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={(e) => { e.stopPropagation(); toggleRow(candidate.rank); }}
                                          title="Detayları Aç/Kapat"
                                        >
                                          {isExpanded ? (
                                            <ChevronUp size={14} />
                                          ) : (
                                            <ChevronDown size={14} />
                                          )}
                                        </Button>
                                      </div>
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
                                </React.Fragment>
                              );
                              })
                            ) : (
                              <tr>
                                <td colSpan={10} className="text-center py-5 text-muted">
                                  Filtreyle eşleşen aday bulunamadı
                                </td>
                              </tr>
                            )
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

      {/* Candidate CV Preview Modal */}
      <Modal
        show={!!previewCandidate}
        onHide={() => {
          setPreviewCandidate(null);
          setPreviewDetail(null);
        }}
        size="lg"
        centered
        dialogClassName="cv-preview-modal"
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-dark">
            {previewCandidate?.name || 'Aday Detayı'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {previewCandidate && (
            <Row className="gy-4">
              {/* Left Column: Contact & Basic Info */}
              <Col md={5} className="border-end">
                <div className="d-flex flex-column gap-3">
                  {/* Current Position & Seniority */}
                  <div>
                    <h6 className="text-secondary small fw-semibold uppercase mb-1">Mevcut Ünvan</h6>
                    <div className="fw-semibold text-dark fs-5">
                      {previewCandidate.current_position || '—'}
                    </div>
                    <Badge bg="light" text="dark" className="border mt-1">
                      {previewCandidate.seniority || '—'}
                    </Badge>
                  </div>

                  {/* Contact Info (Loaded from Detail API) */}
                  <div className="border-top pt-3 mt-1">
                    <h6 className="text-secondary small fw-semibold mb-2">İletişim & Lokasyon</h6>
                    {loadingDetail ? (
                      <div className="d-flex align-items-center gap-2 py-2">
                        <Spinner animation="border" size="sm" variant="primary" />
                        <span className="text-muted small">İletişim bilgileri yükleniyor...</span>
                      </div>
                    ) : previewDetail ? (
                      <div className="d-flex flex-column gap-2 text-muted small">
                        <div className="d-flex align-items-center gap-2">
                          <Mail size={14} className="text-primary" />
                          <span>{previewDetail.email || '—'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Phone size={14} className="text-primary" />
                          <span>{previewDetail.phone || '—'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <MapPin size={14} className="text-primary" />
                          <span>{previewDetail.location || '—'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </div>

                  {/* Search Metrics */}
                  <div className="border-top pt-3 mt-1">
                    <h6 className="text-secondary small fw-semibold mb-2">Arama Skorları</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <Badge bg="success" className="px-2 py-1">
                        Fusion: {previewCandidate.fusion_score != null ? previewCandidate.fusion_score.toFixed(3) : '—'}
                      </Badge>
                      <Badge bg="info" className="px-2 py-1">
                        LLM: {previewCandidate.llm_score != null ? previewCandidate.llm_score.toFixed(3) : '—'}
                      </Badge>
                    </div>
                  </div>

                  {/* Interviews History */}
                  <div className="border-top pt-3 mt-1">
                    <h6 className="text-secondary small fw-semibold mb-2">Görüşme Geçmişi</h6>
                    {loadingDetail ? (
                      <span className="text-muted small">Yükleniyor...</span>
                    ) : previewDetail?.interviews && previewDetail.interviews.length > 0 ? (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {previewDetail.interviews.map((iv) => (
                          <div key={iv.id} className="p-2 border rounded bg-light small">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold text-dark">{iv.interviewer_name || 'Görüşmeci'}</span>
                              <Badge bg={iv.outcome === 'passed' ? 'success' : iv.outcome === 'failed' ? 'danger' : 'warning'}>
                                {iv.outcome === 'passed' ? 'Geçti' : iv.outcome === 'failed' ? 'Geçemedi' : 'Beklemede'}
                              </Badge>
                            </div>
                            <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                              <Calendar size={12} />
                              <span>{iv.interview_date ? new Date(iv.interview_date).toLocaleDateString('tr-TR') : '—'}</span>
                              <span>·</span>
                              <span>{iv.interview_type || 'İK'}</span>
                            </div>
                            {iv.notes && <div className="text-secondary mt-1 border-top pt-1 text-truncate" style={{ fontSize: '0.72rem' }}>{iv.notes}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">Kayıtlı görüşme bulunmamaktadır.</span>
                    )}
                  </div>
                </div>
              </Col>

              {/* Right Column: Experience, Skills, Reasoning */}
              <Col md={7}>
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                  {/* LLM Reasoning */}
                  <div>
                    <h6 className="text-secondary small fw-semibold mb-2">LLM Aday Gerekçesi</h6>
                    <div className="p-3 bg-light rounded text-muted small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                      {previewCandidate.llm_reasoning || 'Gerekçe bulunmamaktadır.'}
                    </div>
                  </div>

                  {/* Experience Timeline */}
                  <div className="border-top pt-3">
                    <h6 className="text-secondary small fw-semibold mb-2">İş Deneyimleri ({previewCandidate.total_experience_years || 0} Yıl)</h6>
                    {previewCandidate.companies && previewCandidate.companies.length > 0 ? (
                      <div className="d-flex flex-column gap-3 timeline-container">
                        {previewCandidate.companies.map((co, index) => (
                          <div key={index} className="d-flex gap-2 position-relative">
                            <div className="d-flex flex-column align-items-center mt-1">
                              <div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
                              {index !== previewCandidate.companies.length - 1 && (
                                <div className="bg-secondary opacity-25 flex-grow-1" style={{ width: '2px', minHeight: '30px' }}></div>
                              )}
                            </div>
                            <div className="small pb-2">
                              <div className="fw-semibold text-dark">
                                {co.position || 'Pozisyon Belirtilmemiş'}
                              </div>
                              <div className="text-muted d-flex align-items-center gap-1">
                                <Briefcase size={12} />
                                <span>{co.name}</span>
                                {co.is_current && <Badge bg="success" className="ms-1">Güncel</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="border-top pt-3">
                    <h6 className="text-secondary small fw-semibold mb-2">Beceriler</h6>
                    {previewCandidate.skills && previewCandidate.skills.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {previewCandidate.skills.map((sk, index) => (
                          <Badge
                            key={index}
                            bg="light"
                            text="dark"
                            className="border px-2 py-1 small"
                            title={sk.years_of_experience ? `${sk.years_of_experience} yıl deneyim` : undefined}
                          >
                            {sk.name} {sk.proficiency ? `(${sk.proficiency})` : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPreviewCandidate(null);
              setPreviewDetail(null);
            }}
          >
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CvSearchPage;
