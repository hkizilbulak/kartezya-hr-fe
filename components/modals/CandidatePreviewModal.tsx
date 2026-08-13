import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Spinner, Button, ListGroup } from 'react-bootstrap';
import { Mail, Phone, MapPin, Calendar, Briefcase, Star, User, BookOpen, FileText } from 'react-feather';
import type { FusedCandidateResponse, CandidateDetail, DuplicateCandidateItem } from '@/models/cv-search/cv-search.models';

const scoreColor = (score: number): string => {
  if (score == null) return '#6c757d';
  const norm = score > 1 ? score / 100 : score;
  if (norm >= 0.7) return '#198754';
  if (norm >= 0.4) return '#fd7e14';
  return '#6c757d';
};

const formatLlmScore = (score: number | null | undefined): string => {
  if (score == null) return '—';
  const val = score > 1 ? score : score * 100;
  return `%${val.toFixed(0)}`;
};

interface CandidatePreviewModalProps {
  show: boolean;
  onHide: () => void;
  // Use FusedCandidateResponse for search results, DuplicateCandidateItem for duplicates
  candidate: FusedCandidateResponse | DuplicateCandidateItem | null;
  detail: CandidateDetail | null;
  loadingDetail: boolean;
  isDuplicateView?: boolean; // Flag to render duplicate-specific elements if needed
  footerActions?: React.ReactNode; // Custom buttons for the footer
}

export default function CandidatePreviewModal({
  show,
  onHide,
  candidate,
  detail,
  loadingDetail,
  isDuplicateView = false,
  footerActions,
}: CandidatePreviewModalProps) {
  const searchCandidate = !isDuplicateView ? (candidate as FusedCandidateResponse) : null;
  const duplicateCandidate = isDuplicateView ? (candidate as DuplicateCandidateItem) : null;

  const candidateName = candidate?.name || 'Aday Detayı';
  const rank = searchCandidate?.rank;
  const currentPosition = searchCandidate?.current_position || duplicateCandidate?.current_position;
  const seniority = searchCandidate?.seniority || duplicateCandidate?.seniority;
  const totalExp = searchCandidate?.total_experience_years || duplicateCandidate?.experience_years;

  // Calculate career start year for search candidates
  const careerStartYear = useMemo(() => {
    if (!searchCandidate?.companies || searchCandidate.companies.length === 0) return null;
    const years = searchCandidate.companies
      .map(co => typeof co.start_year === 'number' ? co.start_year : parseInt(String(co.start_year), 10))
      .filter(yr => !isNaN(yr) && yr > 1900);
    if (years.length === 0) return null;
    return Math.min(...years);
  }, [searchCandidate]);

  // Sort companies: Current first, then by start_date descending
  const sortedCompanies = useMemo(() => {
    if (!searchCandidate?.companies) return [];
    return [...searchCandidate.companies].sort((a, b) => {
      if (a.is_current && !b.is_current) return -1;
      if (!a.is_current && b.is_current) return 1;
      
      const aStart = typeof a.start_year === 'number' ? a.start_year : parseInt(String(a.start_year || 0), 10) || 0;
      const bStart = typeof b.start_year === 'number' ? b.start_year : parseInt(String(b.start_year || 0), 10) || 0;
      
      return bStart - aStart;
    });
  }, [searchCandidate]);

  if (!candidate) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      dialogClassName="cv-preview-modal"
    >
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
          {isDuplicateView && <User size={18} />}
          <span>{candidateName}</span>
          {rank && (
            <Badge bg="secondary" className="fs-6 py-1 px-2">
              Sıra #{rank}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-2">
        <Row className="gy-4">
          {/* Left Column: Contact & Basic Info */}
          <Col md={5} className="border-end">
            <div className="d-flex flex-column gap-3">
              {/* Current Position & Seniority */}
              <div>
                <h6 className="text-secondary small fw-semibold uppercase mb-1">Mevcut Ünvan</h6>
                <div className="fw-semibold text-dark fs-5 mb-1">
                  {currentPosition || '—'}
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
                  <Badge bg="light" text="dark" className="border">
                    {seniority || '—'}
                  </Badge>
                  <Badge bg="secondary" text="white" className="border">
                    {totalExp || 0} Yıl Tecrübe
                  </Badge>
                  {careerStartYear && (
                    <Badge bg="info" className="text-white border">
                      Başlangıç: {careerStartYear}
                    </Badge>
                  )}
                  {duplicateCandidate?.candidate_id && (
                     <Badge bg="light" text="muted" className="border">
                       ID: {duplicateCandidate.candidate_id}
                     </Badge>
                  )}
                </div>
              </div>

              {/* Contact Info (Loaded from Detail API) */}
              <div className="border-top pt-3 mt-1">
                <h6 className="text-secondary small fw-semibold mb-2">İletişim & Lokasyon</h6>
                {loadingDetail ? (
                  <div className="d-flex align-items-center gap-2 py-2">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span className="text-muted small">İletişim bilgileri yükleniyor...</span>
                  </div>
                ) : detail ? (
                  <div className="d-flex flex-column gap-2 text-muted small">
                    <div className="d-flex align-items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      <span>{detail.email || '—'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Phone size={14} className="text-primary" />
                      <span>{detail.phone || '—'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span>{detail.location || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted small">—</span>
                )}
              </div>

              {/* Search Metrics (Only for Search) */}
              {!isDuplicateView && searchCandidate && (
                <div className="border-top pt-3 mt-1">
                  <h6 className="text-secondary small fw-semibold mb-2">Arama Skorları</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <Badge bg="success" className="px-2 py-1">
                      Fusion: {searchCandidate.fusion_score != null ? searchCandidate.fusion_score.toFixed(3) : '—'}
                    </Badge>
                    <Badge bg="info" className="px-2 py-1">
                      LLM: {formatLlmScore(searchCandidate.llm_score)}
                    </Badge>
                    <Badge bg="secondary" className="px-2 py-1">
                      Vektör: {searchCandidate.vector_score != null ? searchCandidate.vector_score.toFixed(3) : '—'}
                    </Badge>
                    <Badge bg="secondary" className="px-2 py-1">
                      BM25: {searchCandidate.bm25_score != null ? searchCandidate.bm25_score.toFixed(3) : '—'}
                    </Badge>
                    <Badge bg="secondary" className="px-2 py-1">
                      Graf: {searchCandidate.graph_score != null ? searchCandidate.graph_score.toFixed(3) : '—'}
                    </Badge>
                  </div>
                  <div className="mt-3 p-2 bg-light rounded text-muted" style={{ fontSize: '0.72rem', border: '1px dashed #dee2e6' }}>
                    <div className="fw-semibold mb-1 text-dark">Skor Açıklamaları:</div>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-1" style={{ paddingLeft: 0 }}>
                      <li>• <strong className="text-dark">Fusion Score:</strong> Tüm skorların (Vektör + Graf + LLM) ağırlıklandırılmış nihai kombinasyonu.</li>
                      <li>• <strong className="text-dark">LLM Eşleşmesi:</strong> Büyük Dil Modelinin adayın uygunluğunu kıdem ve pozisyon bazlı inceleme puanı.</li>
                      <li>• <strong className="text-dark">Vektör (Semantik):</strong> Özgeçmiş metni ile arama sorgusu arasındaki anlamsal yakınlık düzeyi.</li>
                      <li>• <strong className="text-dark">BM25 (Kelime):</strong> Arama terimlerinin metinsel geçiş sıklığına dayalı istatistiksel skor.</li>
                      <li>• <strong className="text-dark">Graf (İlişkisel):</strong> Adayın bilgi grafiğindeki (şirketler, beceriler vb.) ilişkisel eşleşme puanı.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Interviews History */}
              <div className="border-top pt-3 mt-1">
                <h6 className="text-secondary small fw-semibold mb-2">Görüşme Geçmişi</h6>
                {loadingDetail ? (
                  <span className="text-muted small">Yükleniyor...</span>
                ) : detail?.interviews && detail.interviews.length > 0 ? (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {detail.interviews.map((iv) => (
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
              
              {/* Education & Files (Only for Duplicates) */}
              {isDuplicateView && duplicateCandidate && (
                <>
                  {duplicateCandidate.education?.length > 0 && (
                    <div className="border-top pt-3 mt-1">
                       <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2"><BookOpen size={14}/>Eğitim</h6>
                       <ListGroup variant="flush">
                         {duplicateCandidate.education.map((e, i) => (
                           <ListGroup.Item key={i} className="px-0 py-1 border-0 text-muted" style={{ fontSize: 13 }}>
                             {e}
                           </ListGroup.Item>
                         ))}
                       </ListGroup>
                    </div>
                  )}
                  {duplicateCandidate.cv_files?.length > 0 && (
                     <div className="border-top pt-3 mt-1">
                        <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2"><FileText size={14}/>CV Dosyaları</h6>
                        <ListGroup variant="flush">
                          {duplicateCandidate.cv_files.map((f, i) => (
                            <ListGroup.Item key={i} className="px-0 py-1 border-0" style={{ fontSize: 13, color: '#0d6efd' }}>
                              {f}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                     </div>
                  )}
                </>
              )}
            </div>
          </Col>

          {/* Right Column: Experience, Skills, Reasoning */}
          <Col md={7}>
            <div className="d-flex flex-column gap-3" style={{ paddingRight: '5px' }}>
              {/* LLM Reasoning (Only for Search) */}
              {!isDuplicateView && searchCandidate && (
                <div>
                  <h6 className="text-secondary small fw-semibold mb-2">LLM Aday Gerekçesi</h6>
                  <div className="p-3 bg-light rounded text-muted small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                    {searchCandidate.llm_reasoning || 'Gerekçe bulunmamaktadır.'}
                  </div>
                </div>
              )}

              {/* Experience Timeline */}
              <div className={!isDuplicateView ? "border-top pt-3" : ""}>
                <h6 className="text-secondary small fw-semibold mb-2">İş Deneyimleri ({totalExp || 0} Yıl)</h6>
                {!isDuplicateView && sortedCompanies.length > 0 ? (
                  <div className="d-flex flex-column gap-3 timeline-container">
                    {sortedCompanies.map((co, index) => (
                      <div key={index} className="d-flex gap-2 position-relative">
                        <div className="d-flex flex-column align-items-center mt-1">
                          <div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
                          {index !== sortedCompanies.length - 1 && (
                            <div className="bg-secondary opacity-25 flex-grow-1" style={{ width: '2px', minHeight: '30px' }}></div>
                          )}
                        </div>
                        <div className="small pb-2">
                          <div className="fw-semibold text-dark">
                            {co.position || 'Pozisyon Belirtilmemiş'}
                          </div>
                          <div className="text-muted d-flex align-items-center gap-1 flex-wrap">
                            <Briefcase size={12} />
                            <span className="fw-medium">{co.name}</span>
                            {(co.start_year || co.end_year) && (
                              <span className="text-secondary small ms-1">
                                ({co.start_year || '—'} - {co.is_current ? 'Günümüz' : (co.end_year || '—')})
                                {co.duration_years ? ` · ${co.duration_years} Yıl` : ''}
                              </span>
                            )}
                            {co.is_current && <Badge bg="success" className="ms-1">Güncel</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isDuplicateView && duplicateCandidate && duplicateCandidate.companies && duplicateCandidate.companies.length > 0 ? (
                   <ListGroup variant="flush">
                     {duplicateCandidate.companies.map((c, i) => (
                       <ListGroup.Item key={i} className="px-0 py-1 border-0 d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                         <Briefcase size={13} className="text-secondary" />
                         {c}
                       </ListGroup.Item>
                     ))}
                   </ListGroup>
                ) : (
                  <span className="text-muted small">—</span>
                )}
              </div>

              {/* Skills tags */}
              <div className="border-top pt-3">
                <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2">
                  {isDuplicateView && <Star size={14} />} Beceriler
                </h6>
                {!isDuplicateView && searchCandidate?.skills && searchCandidate.skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {searchCandidate.skills.map((sk, index) => (
                      <Badge
                        key={index}
                        bg="light"
                        text="dark"
                        className="border px-2 py-1 small d-inline-flex align-items-center gap-1"
                        title={sk.years_of_experience ? `${sk.years_of_experience} Yıl deneyim` : undefined}
                      >
                        <span className="fw-medium">{sk.name}</span>
                        {(sk.proficiency || sk.years_of_experience != null) && (
                          <span className="text-muted text-lowercase" style={{ fontSize: '0.72rem', opacity: 0.75 }}>
                            ({[
                              sk.proficiency,
                              sk.years_of_experience ? `${sk.years_of_experience} Yıl` : ''
                            ].filter(Boolean).join(', ')})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : isDuplicateView && duplicateCandidate && duplicateCandidate.top_skills && duplicateCandidate.top_skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {duplicateCandidate.top_skills.map((s) => (
                      <Badge
                        key={s}
                        bg="light"
                        text="primary"
                        className="border border-primary px-2 py-1 small"
                        style={{ backgroundColor: '#e7f1ff', fontWeight: 500 }}
                      >
                        {s}
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
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0 d-flex justify-content-between">
        <div className="d-flex align-items-center gap-2">
          {footerActions}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onHide}
        >
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
