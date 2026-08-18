'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { academyService, TrainingAssignment } from '@/services/academy.service';
import { documentService } from '@/services/document.service';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  const assignmentId = useMemo(() => {
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('academy');
      if (idx !== -1 && parts[idx + 1]) {
        return parseInt(parts[idx + 1]);
      }
    }
    return parseInt(params.id as string);
  }, [params.id, pathname]);

  const [assignment, setAssignment] = useState<TrainingAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [hasViewedFullscreen, setHasViewedFullscreen] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

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
      setPdfError('');
      setPdfLoading(true);
      const res = await documentService.getRelatedDocuments(7, trainingId); // 7 = Academy
      if (res.data && res.data.length > 0) {
        const docId = res.data[0].id;
        const contentType = res.data[0].content_type || '';
        const fileName = res.data[0].file_name || '';
        
        setIsVideo(contentType.startsWith('video/') || fileName.toLowerCase().endsWith('.mp4'));
        
        // Fetch presigned URL using authenticated axios instance
        const { default: axiosInstance } = await import('@/helpers/api/axiosInstance');
        const urlRes = await axiosInstance.get(`/documents/${docId}/download`);
        
        if (urlRes.data && urlRes.data.success && urlRes.data.data.url) {
           setPdfUrl(urlRes.data.data.url);
        } else {
           setPdfError('Dosya URL alınamadı: ' + JSON.stringify(urlRes.data));
        }
      } else {
        setPdfError('Bu eğitim için herhangi bir doküman bulunamadı (ID: ' + trainingId + ')');
      }
    } catch (e: any) {
      console.error("Failed to load document URL", e);
      setPdfError('Doküman yüklenirken hata oluştu: ' + (e.response?.data?.error || e.message));
    } finally {
      setPdfLoading(false);
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
        setTimeout(() => router.push(`/academy/certificates?recentTrainingId=${assignment.training_id}`), 2500);
      }
    } catch (e) {
      setError('Eğitim tamamlanırken hata oluştu.');
    } finally {
      setActionLoading(false);
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
      <Container fluid="xl" className="py-5">
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
    ASSIGNED: 'Henüz Başlamadı',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
  };

  return (
    <Container fluid="xl" className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link 
          href="/academy" 
          className="btn btn-sm btn-light shadow-sm d-flex align-items-center hover-lift" 
          style={{ borderRadius: '10px', fontWeight: 500, color: '#475569' }}
        >
          <i className="fe fe-arrow-left me-2" />
          Eğitimlerime Dön
        </Link>
        <Badge style={{
            background: `${statusColors[status]}15`,
            color: statusColors[status],
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
            border: `1px solid ${statusColors[status]}30`,
          }}>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[status] }} />
              {statusLabels[status]}
            </div>
        </Badge>
      </div>

      {success && <Alert variant="success" className="mb-4 shadow-sm border-0" style={{ borderRadius: 12 }}>{success}</Alert>}
      {error && <Alert variant="danger" className="mb-4 shadow-sm border-0" style={{ borderRadius: 12 }}>{error}</Alert>}

      <Row className="g-4">
        {/* Left Column (Content) */}
        <Col lg={status === 'IN_PROGRESS' || status === 'COMPLETED' ? 8 : 12}>
          {/* Header Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24, overflow: 'hidden' }}>
<div style={{ height: 6, background: `linear-gradient(90deg, ${statusColors[status]}, #8b5cf6)` }} />
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-4 mb-4">
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                  style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 20, 
                    background: `linear-gradient(135deg, ${statusColors[status]}15, ${statusColors[status]}05)`,
                    border: `1px solid ${statusColors[status]}25`
                  }}
                >
                  <i className="fe fe-book-open" style={{ fontSize: 32, color: statusColors[status] }} />
                </div>
                <div>
                  <h3 className="fw-bold mb-2" style={{ color: '#0f172a', letterSpacing: '-0.5px' }}>
                    {training.title}
                  </h3>
                  <div className="d-flex flex-wrap gap-3 text-muted">
                    {training.duration > 0 && (
                      <span className="d-flex align-items-center" style={{ fontSize: 15, fontWeight: 500 }}>
                        <i className="fe fe-clock me-2" style={{ color: '#64748b' }} />
                        {training.duration} Dakika
                      </span>
                    )}
                    <span className="d-flex align-items-center" style={{ fontSize: 15, fontWeight: 500 }}>
                      <i className="fe fe-calendar me-2" style={{ color: '#64748b' }} />
                      Atanma: {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              {training.description && (
                <div className="p-4 rounded-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: 12, color: '#64748b', letterSpacing: 1 }}>Eğitim Hakkında</h6>
                  <p className="mb-0" style={{ color: '#334155', lineHeight: 1.8, fontSize: 15 }}>
                    {training.description}
                  </p>
                </div>
              )}
              {/* Action buttons (Assign state) */}
              {status === 'ASSIGNED' && (
                <div className="mt-5 text-center">
                  <Button
                    onClick={handleStart}
                    disabled={actionLoading}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none',
                      borderRadius: 14,
                      padding: '16px 40px',
                      fontWeight: 600,
                      boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover-lift"
                  >
                    {actionLoading ? <Spinner size="sm" className="me-2" /> : <i className="fe fe-play-circle me-2 fs-5" />}
                    Eğitime Başla
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* PDF Viewer - Only show when IN_PROGRESS or COMPLETED */}
          {(status === 'IN_PROGRESS' || status === 'COMPLETED') && (
            <Card className="border-0 mb-4 shadow-sm" style={{ borderRadius: 24, overflow: 'hidden' }}>
              <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4 px-md-5">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Eğitim İçeriği</h5>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (pdfUrl) {
                        setHasViewedFullscreen(true);
                        window.open(pdfUrl, '_blank');
                      }
                    }}
                    className="d-flex align-items-center gap-2 hover-lift"
                    style={{ 
                      borderRadius: 8, 
                      fontWeight: 600, 
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                    }}
                  >
                    <i className="fe fe-play-circle" />
                    Eğitime Başla
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4 p-md-5 pt-3">
                {pdfError && <Alert variant="danger" style={{ borderRadius: 12 }}>{pdfError}</Alert>}
                {pdfLoading ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: 600, background: '#f8fafc', borderRadius: 16 }}>
                    <div className="text-center">
                      <Spinner animation="border" variant="primary" className="mb-3" />
                      <div className="text-muted fw-medium">Doküman Yükleniyor...</div>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div
                    ref={pdfContainerRef}
                    className="shadow-sm d-flex justify-content-center align-items-center"
                    style={{
                      height: 750, 
                      width: '100%',
                      background: isVideo ? '#000' : '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      overflow: 'hidden'
                    }}
                  >
                    {isVideo ? (
                      <video 
                        src={pdfUrl} 
                        controls 
                        style={{ maxWidth: '100%', maxHeight: '100%', outline: 'none' }}
                        onPlay={() => setHasViewedFullscreen(true)}
                        onEnded={() => setHasViewedFullscreen(true)}
                      />
                    ) : (
                      <iframe 
                        src={pdfUrl} 
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        title="Eğitim Dokümanı"
                      />
                    )}
                  </div>
                ) : null}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Right Column (Sidebar / Timeline & Actions) */}
        {(status === 'IN_PROGRESS' || status === 'COMPLETED') && (
          <Col lg={4}>
            <div style={{ position: 'sticky', top: 24 }}>
              {/* Actions Card */}
              {status === 'IN_PROGRESS' && (
                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24, background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
                  <Card.Body className="p-4 p-md-5 text-center">
                    <div className="mb-4">
                      <div 
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                        style={{ width: 64, height: 64, background: '#10b98115' }}
                      >
                        <i className="fe fe-award fs-1" style={{ color: '#10b981' }} />
                      </div>
                      <h5 className="fw-bold mb-2" style={{ color: '#0f172a' }}>Eğitimi Bitirdiniz mi?</h5>
                      <p className="text-muted small mb-0">İçeriği tamamen okuduysanız eğitiminizi onaylayarak sertifikanızı alabilirsiniz.</p>
                    </div>
                    
                    <Button
                      onClick={handleComplete}
                      disabled={actionLoading || !hasViewedFullscreen}
                      className="w-100 mb-2 hover-lift"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: 12,
                        padding: '14px 20px',
                        fontWeight: 600,
                        fontSize: 15,
                        boxShadow: '0 4px 15px rgba(16,185,129,0.25)'
                      }}
                    >
                      <span className="me-2">
                        {actionLoading ? <Spinner size="sm" animation="border" /> : <i className="fe fe-check-circle" />}
                      </span>
                      Eğitimi Tamamla
                    </Button>
                  </Card.Body>
                </Card>
              )}

              {status === 'COMPLETED' && (
                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24, background: '#10b981' }}>
                  <Card.Body className="p-4 p-md-5 text-center text-white">
                    <i className="fe fe-check-circle mb-3" style={{ fontSize: 48, opacity: 0.9 }} />
                    <h5 className="fw-bold mb-2 text-white">Eğitim Tamamlandı</h5>
                    <p className="small mb-4" style={{ opacity: 0.85 }}>Tebrikler, bu eğitimi başarıyla tamamladınız. Sertifikanız hazır.</p>
                    <Button
                      onClick={() => router.push('/academy/certificates')}
                      variant="light"
                      className="w-100 fw-bold hover-lift"
                      style={{ borderRadius: 12, padding: '12px 20px', color: '#059669' }}
                    >
                      <i className="fe fe-file-text me-2" />
                      Sertifikamı Görüntüle
                    </Button>
                  </Card.Body>
                </Card>
              )}

              {/* Timeline Card */}
              <Card className="border-0 shadow-sm" style={{ borderRadius: 24 }}>
                <Card.Body className="p-4 p-md-5">
                  <h6 className="fw-bold mb-4 pb-2 border-bottom" style={{ color: '#0f172a' }}>İlerleme Durumu</h6>
                  <div className="timeline-stepper position-relative pt-2">
                    {[
                      { label: 'Eğitim Atandı', date: assignment.created_at, done: true, icon: 'fe-inbox', color: '#3b82f6' },
                      { label: 'Eğitime Başlandı', date: assignment.started_at, done: !!assignment.started_at, icon: 'fe-play-circle', color: '#8b5cf6' },
                      { label: 'Eğitim Tamamlandı', date: assignment.completed_at, done: !!assignment.completed_at, icon: 'fe-check-circle', color: '#10b981' },
                    ].map((step, i, arr) => (
                      <div key={i} className="d-flex gap-3 mb-4 position-relative" style={{ opacity: step.done ? 1 : 0.4 }}>
                        {/* Connecting Line */}
                        {i < arr.length - 1 && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              left: 17, 
                              top: 36, 
                              width: 2, 
                              height: 'calc(100% - 10px)', 
                              background: arr[i+1].done ? step.color : '#e2e8f0',
                              zIndex: 1
                            }} 
                          />
                        )}
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 position-relative"
                          style={{ 
                            width: 36, 
                            height: 36, 
                            background: step.done ? step.color : '#f1f5f9',
                            border: `2px solid ${step.done ? '#fff' : '#e2e8f0'}`,
                            boxShadow: step.done ? `0 0 0 2px ${step.color}40` : 'none',
                            zIndex: 2
                          }}
                        >
                          <i className={`fe ${step.icon}`} style={{ color: step.done ? 'white' : '#94a3b8', fontSize: 15 }} />
                        </div>
                        <div className="pt-1">
                          <p className="mb-1 fw-bold" style={{ fontSize: 14, color: '#0f172a' }}>{step.label}</p>
                          {step.date ? (
                            <small className="text-muted d-flex align-items-center gap-1">
                              <i className="fe fe-calendar" />
                              {new Date(step.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </small>
                          ) : (
                            <small className="text-muted">Bekleniyor...</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        )}
      </Row>
      
      {/* Add a tiny style block for hover effects since we don't have direct CSS access */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-3px); }
        .hover-lift:active { transform: translateY(0); }
      `}} />
    </Container>
  );
}
