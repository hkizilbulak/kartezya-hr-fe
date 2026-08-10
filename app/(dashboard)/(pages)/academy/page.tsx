'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, ProgressBar } from 'react-bootstrap';
import { academyService, TrainingAssignment } from '@/services/academy.service';
import { useRouter } from 'next/navigation';

const statusConfig: Record<string, { label: string; variant: string; icon: string }> = {
  ASSIGNED: { label: 'Atandı', variant: 'secondary', icon: 'fe-inbox' },
  IN_PROGRESS: { label: 'Devam Ediyor', variant: 'warning', icon: 'fe-play-circle' },
  COMPLETED: { label: 'Tamamlandı', variant: 'success', icon: 'fe-check-circle' },
};

const progressValue: Record<string, number> = {
  ASSIGNED: 0,
  IN_PROGRESS: 50,
  COMPLETED: 100,
};

export default function AcademyPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await academyService.getMyAssignments();
        if (res.success && res.data) setAssignments(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = {
    inProgress: assignments.filter(a => a.status === 'IN_PROGRESS'),
    assigned: assignments.filter(a => a.status === 'ASSIGNED'),
    completed: assignments.filter(a => a.status === 'COMPLETED'),
  };

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
          style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
        >
          <i className="fe fe-book-open text-white fs-4" />
        </div>
        <div>
          <h3 className="mb-0 fw-bold" style={{ color: '#1e1b4b' }}>Kartezya Akademi</h3>
          <p className="mb-0 text-muted" style={{ fontSize: 14 }}>Size atanan eğitimler</p>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-5">
        {[
          { label: 'Devam Eden', count: grouped.inProgress.length, color: '#f59e0b', bg: '#fffbeb', icon: 'fe-play-circle' },
          { label: 'Atanmış', count: grouped.assigned.length, color: '#6366f1', bg: '#eef2ff', icon: 'fe-inbox' },
          { label: 'Tamamlanan', count: grouped.completed.length, color: '#10b981', bg: '#ecfdf5', icon: 'fe-award' },
        ].map((s, i) => (
          <Col key={i} xs={12} sm={4}>
            <Card className="border-0 h-100" style={{ background: s.bg, borderRadius: 16 }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 48, height: 48, background: `${s.color}22` }}>
                  <i className={`fe ${s.icon} fs-5`} style={{ color: s.color }} />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold" style={{ color: s.color, fontSize: 28 }}>{s.count}</h4>
                  <small className="text-muted">{s.label}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* No assignments */}
      {assignments.length === 0 && (
        <div className="text-center py-5">
          <i className="fe fe-book-open text-muted" style={{ fontSize: 64 }} />
          <h5 className="mt-3 text-muted">Henüz size atanmış bir eğitim yok</h5>
        </div>
      )}

      {/* In Progress */}
      {grouped.inProgress.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold mb-3" style={{ color: '#1e1b4b', letterSpacing: '-0.3px' }}>
            <i className="fe fe-play-circle me-2 text-warning" />Devam Edilen Eğitimler
          </h5>
          <Row className="g-3">
            {grouped.inProgress.map(a => (
              <Col key={a.id} xs={12} md={6} xl={4}>
                <TrainingCard assignment={a} onNavigate={() => router.push(`/academy/${a.id}`)} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Assigned */}
      {grouped.assigned.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold mb-3" style={{ color: '#1e1b4b' }}>
            <i className="fe fe-inbox me-2" style={{ color: '#6366f1' }} />Bekleyen Eğitimler
          </h5>
          <Row className="g-3">
            {grouped.assigned.map(a => (
              <Col key={a.id} xs={12} md={6} xl={4}>
                <TrainingCard assignment={a} onNavigate={() => router.push(`/academy/${a.id}`)} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Completed */}
      {grouped.completed.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold mb-3" style={{ color: '#1e1b4b' }}>
            <i className="fe fe-check-circle me-2 text-success" />Tamamlanan Eğitimler
          </h5>
          <Row className="g-3">
            {grouped.completed.map(a => (
              <Col key={a.id} xs={12} md={6} xl={4}>
                <TrainingCard assignment={a} onNavigate={() => router.push(`/academy/${a.id}`)} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}

function TrainingCard({ assignment, onNavigate }: { assignment: TrainingAssignment; onNavigate: () => void }) {
  const { training, status } = assignment;
  const cfg = statusConfig[status];
  const progress = progressValue[status];

  return (
    <Card
      className="border-0 h-100"
      style={{
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.14)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
      onClick={onNavigate}
    >
      {/* Gradient header strip */}
      <div style={{
        height: 6,
        background: status === 'COMPLETED'
          ? 'linear-gradient(90deg, #10b981, #34d399)'
          : status === 'IN_PROGRESS'
            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
            : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: '16px 16px 0 0',
      }} />

      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <Badge bg={cfg.variant} className="px-2 py-1" style={{ fontSize: 11 }}>
            <i className={`fe ${cfg.icon} me-1`} />{cfg.label}
          </Badge>
          {training.duration > 0 && (
            <small className="text-muted">
              <i className="fe fe-clock me-1" />{training.duration} dk
            </small>
          )}
        </div>

        <h6 className="fw-bold mb-2" style={{ color: '#1e1b4b', fontSize: 15, lineHeight: 1.4 }}>
          {training.title}
        </h6>

        {training.description && (
          <p className="text-muted mb-3" style={{ fontSize: 13, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {training.description}
          </p>
        )}

        <ProgressBar
          now={progress}
          variant={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'warning' : 'info'}
          style={{ height: 6, borderRadius: 4, marginBottom: 12 }}
        />

        <Button
          size="sm"
          className="w-100"
          variant={status === 'COMPLETED' ? 'outline-success' : 'primary'}
          style={{
            borderRadius: 8,
            background: status !== 'COMPLETED' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {status === 'COMPLETED' ? (
            <><i className="fe fe-eye me-1" />Sertifika Görüntüle</>
          ) : status === 'IN_PROGRESS' ? (
            <><i className="fe fe-play me-1" />Devam Et</>
          ) : (
            <><i className="fe fe-book me-1" />Eğitime Başla</>
          )}
        </Button>
      </Card.Body>
    </Card>
  );
}
