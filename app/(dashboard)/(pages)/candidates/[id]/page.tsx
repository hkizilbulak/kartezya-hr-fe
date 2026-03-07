"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Container,
} from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import { cvSearchService } from '@/services/cv-search.service';
import type { CandidateDetail, Interview } from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import StatusBadge from '@/components/StatusBadge';
import DeleteModal from '@/components/DeleteModal';
import InterviewModal from '@/components/modals/InterviewModal';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'react-feather';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

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

const interviewTypeLabel = (type: string): string => {
  switch (type) {
    case 'technical':
      return 'Teknik';
    case 'hr':
      return 'İK';
    case 'case_study':
      return 'Vaka Çalışması';
    case 'other':
      return 'Diğer';
    default:
      return type || '—';
  }
};

const CandidateDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params?.id);

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Interview modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  // Delete modal state
  const [deletingInterview, setDeletingInterview] = useState<Interview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCandidate = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const data = await cvSearchService.getCandidateDetail(candidateId);
      setCandidate(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Aday yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleOpenCreate = () => {
    setEditingInterview(null);
    setShowInterviewModal(true);
  };

  const handleOpenEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setShowInterviewModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInterview || !candidate) return;
    setDeleteLoading(true);
    try {
      await cvSearchService.deleteInterview(candidate.id, deletingInterview.id);
      toast.success('Görüşme silindi.');
      setDeletingInterview(null);
      fetchCandidate();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Silme işlemi başarısız.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container fluid className="page-container">
      <LoadingOverlay show={loading} message="Yükleniyor…" />

      <div className="page-heading-wrapper d-flex align-items-center gap-2 mb-3">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => router.push('/candidates')}
          className="me-2"
        >
          <ArrowLeft size={14} />
        </Button>
        <PageHeading
          heading={candidate?.name || 'Aday Detay'}
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      {candidate && (
        <>
          {/* Profile Card */}
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Row>
                    <Col md={3}>
                      <div className="mb-1 text-muted small">Ad Soyad</div>
                      <div className="fw-semibold">{candidate.name || '—'}</div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-1 text-muted small">Mevcut Pozisyon</div>
                      <div>{candidate.current_position || '—'}</div>
                    </Col>
                    <Col md={2}>
                      <div className="mb-1 text-muted small">Kıdem</div>
                      <div>{candidate.seniority || '—'}</div>
                    </Col>
                    <Col md={2}>
                      <div className="mb-1 text-muted small">Lokasyon</div>
                      <div>{candidate.location || '—'}</div>
                    </Col>
                    <Col md={2}>
                      <div className="mb-1 text-muted small">E-posta</div>
                      <div className="small">{candidate.email || '—'}</div>
                    </Col>
                  </Row>
                  {candidate.phone && (
                    <Row className="mt-2">
                      <Col md={3}>
                        <div className="mb-1 text-muted small">Telefon</div>
                        <div>{candidate.phone}</div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Interviews */}
          <Row>
            <Col lg={12}>
              <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                <h6 className="fw-semibold mb-0">
                  Görüşmeler
                  <Badge bg="secondary" className="ms-2 fw-normal">
                    {candidate.interviews?.length ?? 0}
                  </Badge>
                </h6>
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  <Plus size={14} className="me-1" />
                  Görüşme Ekle
                </Button>
              </div>

              <div className="table-wrapper">
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <div className="table-box">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: 130 }}>Tarih</th>
                              <th style={{ width: 140 }}>Tür</th>
                              <th>Görüşmeci</th>
                              <th>Ekip</th>
                              <th style={{ width: 130 }}>Sonuç</th>
                              <th>Notlar</th>
                              <th style={{ width: 90 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {candidate.interviews && candidate.interviews.length > 0 ? (
                              candidate.interviews.map((iv) => (
                                <tr key={iv.id}>
                                  <td className="small">
                                    {iv.interview_date
                                      ? new Date(iv.interview_date).toLocaleDateString('tr-TR')
                                      : '—'}
                                  </td>
                                  <td className="small">{interviewTypeLabel(iv.interview_type)}</td>
                                  <td className="small">{iv.interviewer_name || '—'}</td>
                                  <td className="small text-muted">{iv.team || '—'}</td>
                                  <td>
                                    {iv.outcome ? (
                                      <StatusBadge
                                        status={outcomeToStatus(iv.outcome)}
                                        text={outcomeLabel(iv.outcome)}
                                        showIcon={false}
                                        size="sm"
                                      />
                                    ) : (
                                      <span className="text-muted small">—</span>
                                    )}
                                  </td>
                                  <td
                                    className="small text-muted"
                                    style={{
                                      maxWidth: 300,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={iv.notes}
                                  >
                                    {iv.notes || '—'}
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        title="Düzenle"
                                        onClick={() => handleOpenEdit(iv)}
                                      >
                                        <Edit2 size={13} />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        title="Sil"
                                        onClick={() => setDeletingInterview(iv)}
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="text-center py-4 text-muted">
                                  Henüz görüşme kaydı yok.
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
        </>
      )}

      {/* Interview Modal */}
      {showInterviewModal && candidate && (
        <InterviewModal
          show={showInterviewModal}
          onHide={() => setShowInterviewModal(false)}
          onSave={() => fetchCandidate()}
          candidateId={candidate.id}
          interviewToEdit={editingInterview}
        />
      )}

      {/* Delete Confirmation */}
      {deletingInterview && (
        <DeleteModal
          onClose={() => setDeletingInterview(null)}
          onHandleDelete={handleDeleteConfirm}
          loading={deleteLoading}
          title="Görüşmeyi Sil"
          message="Bu görüşme kaydını silmek istediğinize emin misiniz?"
        />
      )}
    </Container>
  );
};

export default CandidateDetailPage;
