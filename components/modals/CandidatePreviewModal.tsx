import React, { useMemo, useState } from 'react';
import { Modal, Row, Col, Badge, Spinner, Button, ListGroup } from 'react-bootstrap';
import { Mail, Phone, MapPin, Calendar, Briefcase, Star, User, BookOpen, FileText, Edit, Trash2, Download, Globe } from 'react-feather';
import { toast } from 'react-toastify';
import type {
  FusedCandidateResponse,
  CandidateDetail,
  DuplicateCandidateItem,
  CandidateListItem,
  CandidateCV,
  CompanyNode,
  SkillNode,
} from '@/models/cv-search/cv-search.models';
import { cvSearchService } from '@/services/cv-search.service';
import StatusBadge from '@/components/StatusBadge';
import { outcomeLabel, outcomeToStatus } from '@/helpers/interviewOutcome';

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
  // FusedCandidateResponse for search results, DuplicateCandidateItem for duplicates, CandidateListItem for the candidates list
  candidate: FusedCandidateResponse | DuplicateCandidateItem | CandidateListItem | null;
  detail: CandidateDetail | null;
  loadingDetail: boolean;
  /** Structured CV from GET /candidates/{id}/cv. When present it feeds experience, skills, education, contact and interviews. */
  cv?: CandidateCV | null;
  isDuplicateView?: boolean; // Flag to render duplicate-specific elements if needed
  hideSearchMetrics?: boolean; // NEW PROP to hide search metrics
  footerActions?: React.ReactNode; // Custom buttons for the footer
  onEditInterview?: (interview: any) => void;
  onDeleteInterview?: (interviewId: number) => void;
}

export default function CandidatePreviewModal({
  show,
  onHide,
  candidate,
  detail,
  loadingDetail,
  isDuplicateView = false,
  hideSearchMetrics = false,
  cv = null,
  footerActions,
  onEditInterview,
  onDeleteInterview,
}: CandidatePreviewModalProps) {
  const searchCandidate = !isDuplicateView ? (candidate as Partial<FusedCandidateResponse> | null) : null;
  const duplicateCandidate = isDuplicateView ? (candidate as DuplicateCandidateItem) : null;

  const candidateId =
    cv?.candidate_id ??
    (candidate && 'candidate_id' in candidate ? candidate.candidate_id : undefined) ??
    (candidate && 'id' in candidate ? candidate.id : undefined);
  const candidateName = cv?.name || candidate?.name || 'Aday Detayı';
  const rank = searchCandidate?.rank;
  const currentPosition = cv?.summary?.current_position || searchCandidate?.current_position || duplicateCandidate?.current_position;
  const seniority = cv?.summary?.seniority || searchCandidate?.seniority || duplicateCandidate?.seniority;
  const totalExp = cv?.summary?.total_experience_years ?? searchCandidate?.total_experience_years ?? duplicateCandidate?.experience_years;

  // Contact + interviews come from the CV response when available, otherwise from the detail response.
  const contact = cv ?? detail;
  const interviews = cv?.interviews ?? detail?.interviews ?? [];

  // Normalise CV experience/skills into the node shapes the existing markup renders.
  const companies = useMemo<CompanyNode[] | undefined>(() => {
    if (cv) {
      return cv.experience.map((e) => ({
        name: e.company,
        position: e.position || '',
        is_current: e.is_current,
        start_year: e.start_year ?? undefined,
        end_year: e.end_year ?? undefined,
        duration_years: e.duration_years,
      }));
    }
    return searchCandidate?.companies;
  }, [cv, searchCandidate]);

  const skills = useMemo<SkillNode[] | undefined>(() => {
    if (cv) {
      return cv.skills.map((s) => ({
        name: s.name,
        proficiency: s.proficiency || '',
        years_of_experience: s.years ?? (undefined as unknown as number),
      }));
    }
    return searchCandidate?.skills;
  }, [cv, searchCandidate]);

  // Calculate career start year
  const careerStartYear = useMemo(() => {
    if (!companies || companies.length === 0) return null;
    const years = companies
      .map(co => typeof co.start_year === 'number' ? co.start_year : parseInt(String(co.start_year), 10))
      .filter(yr => !isNaN(yr) && yr > 1900);
    if (years.length === 0) return null;
    return Math.min(...years);
  }, [companies]);

  // Sort companies: Current first, then by start_date descending
  const sortedCompanies = useMemo(() => {
    if (!companies) return [];
    return [...companies].sort((a, b) => {
      if (a.is_current && !b.is_current) return -1;
      if (!a.is_current && b.is_current) return 1;
      
      const aStart = typeof a.start_year === 'number' ? a.start_year : parseInt(String(a.start_year || 0), 10) || 0;
      const bStart = typeof b.start_year === 'number' ? b.start_year : parseInt(String(b.start_year || 0), 10) || 0;
      
      return bStart - aStart;
    });
  }, [companies]);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const handleDownloadPdf = async () => {
    if (!candidateId) return;
    setDownloadingPdf(true);
    try {
      await cvSearchService.downloadCandidateCVPdf(candidateId, candidateName);
    } catch (err) {
      console.error('CV PDF indirilemedi:', err);
      toast.error('CV PDF indirilemedi.');
    } finally {
      setDownloadingPdf(false);
    }
  };

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
                ) : contact ? (
                  <div className="d-flex flex-column gap-2 text-muted small">
                    <div className="d-flex align-items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      <span>{contact.email || '—'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Phone size={14} className="text-primary" />
                      <span>{contact.phone || '—'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span>{contact.location || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted small">—</span>
                )}
              </div>

              {/* Search Metrics (Only for Search) */}
              {!isDuplicateView && !hideSearchMetrics && searchCandidate && (
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
                ) : interviews.length > 0 ? (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {interviews.map((iv) => (
                      <div key={iv.id} className="p-2 border rounded bg-light small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold text-dark">{iv.interviewer_name || 'Görüşmeci'}</span>
                          <div className="d-flex align-items-center gap-1">
                            <StatusBadge
                              status={outcomeToStatus(iv.outcome)}
                              text={outcomeLabel(iv.outcome)}
                              showIcon={false}
                              size="sm"
                            />
                            {onEditInterview && (
                              <Button
                                variant="link"
                                className="p-0 text-primary border-0 ms-1"
                                onClick={() => onEditInterview(iv)}
                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                title="Düzenle"
                              >
                                <Edit size={12} />
                              </Button>
                            )}
                            {onDeleteInterview && (
                              <Button
                                variant="link"
                                className="p-0 text-danger border-0 ms-1"
                                onClick={() => onDeleteInterview(iv.id)}
                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                title="Sil"
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </div>
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
              
              {/* Education, Languages & Source file (from CV response) */}
              {cv && !isDuplicateView && (
                <>
                  <div className="border-top pt-3 mt-1">
                    <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2"><BookOpen size={14}/>Eğitim</h6>
                    {cv.education.length > 0 ? (
                      <ListGroup variant="flush">
                        {cv.education.map((e, i) => (
                          <ListGroup.Item key={i} className="px-0 py-1 border-0" style={{ fontSize: 13 }}>
                            <div className="fw-semibold text-dark">
                              {[e.degree, e.field].filter(Boolean).join(', ') || e.institution}
                            </div>
                            <div className="text-muted">
                              {e.institution}{e.graduation_year ? ` · ${e.graduation_year}` : ''}
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </div>
                  {cv.languages.length > 0 && (
                    <div className="border-top pt-3 mt-1">
                      <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2"><Globe size={14}/>Diller</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {cv.languages.map((l) => (
                          <Badge key={l} bg="light" text="dark" className="border px-2 py-1 small">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {cv.cv_file && (
                    <div className="border-top pt-3 mt-1">
                      <h6 className="text-secondary small fw-semibold mb-2 d-flex align-items-center gap-2"><FileText size={14}/>Kaynak CV</h6>
                      <div className="small text-muted">
                        <div className="text-dark">{cv.cv_file.filename}</div>
                        <div>Yüklendi {new Date(cv.cv_file.uploaded_at).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                  )}
                </>
              )}

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
              {!isDuplicateView && !hideSearchMetrics && searchCandidate && (
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
                {!isDuplicateView && skills && skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {skills.map((sk, index) => (
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
        <div className="d-flex align-items-center gap-2">
          {candidateId && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="d-inline-flex align-items-center gap-1"
            >
              {downloadingPdf ? <Spinner animation="border" size="sm" /> : <Download size={14} />}
              PDF indir
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onHide}
          >
            Kapat
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
