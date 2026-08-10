'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { academyService, TrainingCertificate } from '@/services/academy.service';
import dynamic from 'next/dynamic';

// Lazy-load the certificate generator (uses jsPDF, not SSR-safe)
const CertificateModal = dynamic(
  () => import('@/components/academy/CertificateModal'),
  { ssr: false }
);

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<TrainingCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrainingCertificate | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await academyService.getMyCertificates();
        if (res.success && res.data) setCertificates(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="px-4 py-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
          }}
        >
          <i className="fe fe-award text-white fs-4" />
        </div>
        <div>
          <h3 className="mb-0 fw-bold" style={{ color: '#1e1b4b' }}>Sertifikalarım</h3>
          <p className="mb-0 text-muted" style={{ fontSize: 14 }}>Tamamladığınız eğitimlerin sertifikaları</p>
        </div>
      </div>

      {/* Empty state */}
      {certificates.length === 0 && (
        <div className="text-center py-5">
          <div className="d-flex align-items-center justify-content-center mx-auto rounded-circle mb-4"
            style={{ width: 100, height: 100, background: '#f1f5f9' }}>
            <i className="fe fe-award text-muted" style={{ fontSize: 44 }} />
          </div>
          <h5 className="text-muted">Henüz sertifikanız yok</h5>
          <p className="text-muted" style={{ fontSize: 14 }}>Bir eğitimi tamamladığınızda sertifikanız burada görünecek.</p>
          <Button href="/academy" variant="outline-primary" style={{ borderRadius: 8 }}>
            <i className="fe fe-book-open me-2" />Eğitimlerime Git
          </Button>
        </div>
      )}

      {/* Certificate grid */}
      <Row className="g-4">
        {certificates.map((cert) => (
          <Col key={cert.id} xs={12} sm={6} xl={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 20,
                boxShadow: '0 4px 20px rgba(16,185,129,0.10)',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = '0 12px 32px rgba(16,185,129,0.18)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 4px 20px rgba(16,185,129,0.10)';
              }}
              onClick={() => setSelected(cert)}
            >
              {/* Certificate preview strip */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                padding: '28px 24px 22px',
                textAlign: 'center',
              }}>
                <div className="d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                  <i className="fe fe-award text-white" style={{ fontSize: 28 }} />
                </div>
                <small style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Başarı Sertifikası
                </small>
              </div>

              <Card.Body className="p-4">
                <h6 className="fw-bold mb-1" style={{ color: '#1e1b4b', fontSize: 15 }}>
                  {cert.training.title}
                </h6>
                <p className="text-muted mb-3" style={{ fontSize: 12 }}>
                  <i className="fe fe-calendar me-1" />
                  {new Date(cert.issued_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>

                <div className="d-flex align-items-center justify-content-between">
                  <code style={{ fontSize: 11, color: '#6366f1', background: '#eef2ff', padding: '3px 8px', borderRadius: 6 }}>
                    {cert.certificate_code}
                  </code>
                  <Button
                    size="sm"
                    onClick={e => { e.stopPropagation(); setSelected(cert); }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <i className="fe fe-download me-1" />PDF
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Certificate Modal/PDF */}
      {selected && (
        <CertificateModal
          certificate={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Container>
  );
}
