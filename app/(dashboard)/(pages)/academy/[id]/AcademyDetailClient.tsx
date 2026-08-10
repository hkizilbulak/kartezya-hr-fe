'use client';
import { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { academyService, TrainingAssignment, Training } from '@/services/academy.service';
import { documentService } from '@/services/document.service';
import { HR_API_BASE_URL } from '@/contants/urls';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  params: { id: string };
}

export default function TrainingDetailPage({ params }: Props) {
  const router = useRouter();
  const assignmentId = parseInt(params.id);

  const [assignment, setAssignment] = useState<TrainingAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await academyService.getMyAssignments();
        if (res.success && res.data) {
          const found = res.data.find(a => a.id === assignmentId);
          if (found) {
            setAssignment(found);
            if (found.status === 'IN_PROGRESS' || found.status === 'COMPLETED') {
              fetchPdf(found.training_id);
            }
          } else {
            setError('Bu eğitime erişim izniniz yok.');
          }
        }
      } catch (e) {
        setError('Eğitim yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId]);

  const fetchPdf = async (trainingId: number) => {
    try {
      const res = await documentService.getRelatedDocuments(7, trainingId); // 7 = Academy
      if (res.data && res.data.length > 0) {
        const docId = res.data[0].id;
        setPdfUrl(`${HR_API_BASE_URL}/documents/${docId}/download`);
      }
    } catch (e) {
      console.error("Failed to load PDF URL", e);
    }
  };

  const handleStart = async () => {
    if (!assignment) return;
    setActionLoading(true);
    try {
      await academyService.startTraining(assignment.id);
      setAssignment(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : prev);
      setSuccess('Eğitim başlatıldı!');
      fetchPdf(assignment.training_id);
    } catch (e) {
      setError('Eğitim başlatılırken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!assignment) return;
    setActionLoading(true);
    try {
      const res = await academyService.completeTraining(assignment.id);
      if (res.success) {
        setSuccess('Tebrikler! Eğitimi başarıyla tamamladınız. Sertifikanız oluşturuldu.');
        setTimeout(() => router.push('/academy/certificates'), 2500);
      }
    } catch (e) {
      setError('Eğitim tamamlanırken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (numPages === 1) {
      setHasReachedBottom(true);
    }
  }

  const handleScroll = (e: any) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom) {
      setHasReachedBottom(true);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Link href="/academy" className="btn btn-outline-primary">← Eğitimlerime Dön</Link>
      </Container>
    );
  }

  if (!assignment) return null;
  const { training, status } = assignment;

  const statusColors: Record<string, string> = {
    ASSIGNED: '#6366f1',
    IN_PROGRESS: '#f59e0b',
    COMPLETED: '#10b981',
  };
  const statusLabels: Record<string, string> = {
    ASSIGNED: 'Atandı',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
  };

  return (
    <Container className="py-5" style={{ maxWidth: 800 }}>
      <Link href="/academy" className="btn btn-sm btn-outline-secondary mb-4" style={{ borderRadius: 8 }}>
        <i className="fe fe-arrow-left me-1" />Eğitimlerime Dön
      </Link>

      {success && <Alert variant="success" className="mb-4">{success}</Alert>}
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Card className="border-0 mb-4" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(99,102,241,0.12)' }}>
        <div style={{ height: 8, background: `linear-gradient(90deg, ${statusColors[status]}, ${statusColors[status]}88)` }} />

        <Card.Body className="p-5">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: 56, height: 56, background: `${statusColors[status]}1A` }}>
                <i className="fe fe-book-open fs-3" style={{ color: statusColors[status] }} />
              </div>
              <div>
                <h4 className="fw-bold mb-1" style={{ color: '#1e1b4b' }}>{training.title}</h4>
                {training.duration > 0 && (
                  <small className="text-muted"><i className="fe fe-clock me-1" />{training.duration} dakika</small>
                )}
              </div>
            </div>
            <Badge style={{
              background: `${statusColors[status]}22`,
              color: statusColors[status],
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${statusColors[status]}44`,
            }}>
              {statusLabels[status]}
            </Badge>
          </div>

          {training.description && (
            <div className="mb-4">
              <h6 className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>Eğitim Hakkında</h6>
              <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 15 }}>{training.description}</p>
            </div>
          )}

          {/* Action buttons (Assign state) */}
          {status === 'ASSIGNED' && (
            <>
              <hr className="my-4" style={{ borderColor: '#f1f5f9' }} />
              <Button
                onClick={handleStart}
                disabled={actionLoading}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 28px',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {actionLoading ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="fe fe-play-circle me-2" />}
                Eğitime Başla
              </Button>
            </>
          )}
        </Card.Body>
      </Card>

      {/* PDF Viewer */}
      {(status === 'IN_PROGRESS' || status === 'COMPLETED') && pdfUrl && (
        <Card className="border-0 mb-4" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(99,102,241,0.12)' }}>
          <Card.Body className="p-4" style={{ background: '#f8fafc' }}>
            <h6 className="fw-bold mb-3" style={{ color: '#1e1b4b' }}>Eğitim Dokümanı</h6>
            <div
              onScroll={handleScroll}
              style={{
                height: 600,
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="d-flex justify-content-center p-5"><Spinner animation="border" variant="primary" /></div>}
                error={<div className="text-danger p-4">PDF yüklenirken hata oluştu. Lütfen bağlantınızı kontrol edin.</div>}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={700}
                    className="mb-4 shadow-sm"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            </div>
            
            {status === 'IN_PROGRESS' && (
              <div className="mt-4 text-center">
                {!hasReachedBottom ? (
                  <Alert variant="warning" className="d-inline-block px-4 py-2 mb-0" style={{ borderRadius: 10, fontSize: 14 }}>
                    <i className="fe fe-info me-2" /> Eğitimi tamamlamak için dokümanı sonuna kadar okumalısınız.
                  </Alert>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 32px',
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {actionLoading ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="fe fe-check-circle me-2" />}
                    Eğitimi Tamamladım
                  </Button>
                )}
              </div>
            )}
            
            {status === 'COMPLETED' && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => router.push('/academy/certificates')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 28px',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <i className="fe fe-award me-2" />
                  Sertifikamı Görüntüle
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-0" style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-4" style={{ color: '#1e1b4b' }}>Eğitim Zaman Çizelgesi</h6>
          {[
            { label: 'Eğitim Atandı', date: assignment.created_at, done: true, icon: 'fe-inbox' },
            { label: 'Eğitime Başlandı', date: assignment.started_at, done: !!assignment.started_at, icon: 'fe-play-circle' },
            { label: 'Eğitim Tamamlandı', date: assignment.completed_at, done: !!assignment.completed_at, icon: 'fe-check-circle' },
          ].map((step, i) => (
            <div key={i} className="d-flex gap-3 mb-3" style={{ opacity: step.done ? 1 : 0.4 }}>
              <div className="d-flex flex-column align-items-center">
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 36, height: 36, background: step.done ? '#6366f1' : '#e5e7eb' }}>
                  <i className={`fe ${step.icon}`} style={{ color: step.done ? 'white' : '#9ca3af', fontSize: 14 }} />
                </div>
                {i < 2 && <div style={{ width: 2, height: 24, background: step.done ? '#6366f1' : '#e5e7eb', margin: '4px 0' }} />}
              </div>
              <div className="pt-1">
                <p className="mb-0 fw-semibold" style={{ fontSize: 14, color: '#1e1b4b' }}>{step.label}</p>
                {step.date && (
                  <small className="text-muted">{new Date(step.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                )}
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>
    </Container>
  );
}
