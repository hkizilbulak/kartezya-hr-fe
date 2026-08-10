'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { academyService, Training, TrainingAssignment, CreateTrainingPayload } from '@/services/academy.service';
import { lookupService } from '@/services/lookup.service';
import { EmployeeLookup } from '@/services/lookup.service';
import MultiSelectField from '@/components/MultiSelectField';

export default function AcademyManagePage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignListModal, setShowAssignListModal] = useState(false);

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState<CreateTrainingPayload>({ title: '', description: '', duration: 0, status: 'ACTIVE', file: null as unknown as File });
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTrainingsAndEmployees = useCallback(async () => {
    try {
      const [resTrainings, resEmployees] = await Promise.all([
        academyService.listTrainings(),
        lookupService.getEmployees()
      ]);
      if (resTrainings.success && resTrainings.data) setTrainings(resTrainings.data);
      if (resEmployees.success && resEmployees.data) setEmployees(resEmployees.data);
    } catch (e) {
      setError('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrainingsAndEmployees(); }, [loadTrainingsAndEmployees]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.file) return;
    setActionLoading(true);
    try {
      await academyService.createTraining(formData);
      setSuccess('Eğitim oluşturuldu!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', duration: 0, status: 'ACTIVE', file: null as unknown as File });
      await loadTrainingsAndEmployees();
    } catch (e) {
      setError('Eğitim oluşturulamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const openEdit = (t: Training) => {
    setSelectedTraining(t);
    setFormData({ title: t.title, description: t.description, duration: t.duration, status: t.status, file: null as unknown as File });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedTraining) return;
    setActionLoading(true);
    try {
      await academyService.updateTraining(selectedTraining.id, formData);
      setSuccess('Eğitim güncellendi!');
      setShowEditModal(false);
      await loadTrainings();
    } catch (e) {
      setError('Güncelleme başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Bu eğitimi silmek istediğinize emin misiniz?')) return;
    try {
      await academyService.deleteTraining(id);
      setSuccess('Eğitim silindi.');
      await loadTrainings();
    } catch (e) {
      setError('Silme işlemi başarısız.');
    }
  };

  // ── Assign ────────────────────────────────────────────────────────────────
  const openAssign = (t: Training) => {
    setSelectedTraining(t);
    setAssignEmployeeIds([]);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedTraining || assignEmployeeIds.length === 0) return;
    setActionLoading(true);
    try {
      await academyService.assignEmployee(selectedTraining.id, assignEmployeeIds.map(Number));
      setSuccess('Eğitim çalışanlara atandı!');
      setShowAssignModal(false);
      setAssignEmployeeIds([]);
    } catch (e) {
      setError('Atama yapılırken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Assignment List ───────────────────────────────────────────────────────
  const openAssignList = async (t: Training) => {
    setSelectedTraining(t);
    setShowAssignListModal(true);
    try {
      const res = await academyService.listTrainingAssignments(t.id);
      if (res.success && res.data) setAssignments(res.data);
    } catch (e) {
      setError('Atamalar yüklenemedi.');
    }
  };

  const statusColors: Record<string, string> = {
    ASSIGNED: 'secondary', IN_PROGRESS: 'warning', COMPLETED: 'success',
  };
  const statusLabels: Record<string, string> = {
    ASSIGNED: 'Atandı', IN_PROGRESS: 'Devam Ediyor', COMPLETED: 'Tamamlandı',
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
      <div className="d-flex align-items-center justify-content-between mb-5">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            <i className="fe fe-settings text-white fs-4" />
          </div>
          <div>
            <h3 className="mb-0 fw-bold" style={{ color: '#1e1b4b' }}>Eğitim Yönetimi</h3>
            <p className="mb-0 text-muted" style={{ fontSize: 14 }}>Eğitimleri tanımlayın ve çalışanlara atayın</p>
          </div>
        </div>
        <Button
          onClick={() => { setShowCreateModal(true); setFormData({ title: '', description: '', duration: 0, status: 'ACTIVE' }); }}
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, fontWeight: 600, padding: '10px 20px' }}
        >
          <i className="fe fe-plus me-2" />Yeni Eğitim Ekle
        </Button>
      </div>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Row className="g-3 mb-5">
        {[
          { label: 'Toplam Eğitim', count: trainings.length, color: '#6366f1', icon: 'fe-book-open' },
          { label: 'Aktif Eğitim', count: trainings.filter(t => t.status === 'ACTIVE').length, color: '#10b981', icon: 'fe-check-circle' },
          { label: 'Pasif Eğitim', count: trainings.filter(t => t.status === 'INACTIVE').length, color: '#f59e0b', icon: 'fe-pause-circle' },
        ].map((s, i) => (
          <Col key={i} xs={12} sm={4}>
            <Card className="border-0" style={{ background: `${s.color}0D`, borderRadius: 14 }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div style={{ width: 44, height: 44, background: `${s.color}22`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fe ${s.icon} fs-5`} style={{ color: s.color }} />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold" style={{ color: s.color, fontSize: 26 }}>{s.count}</h4>
                  <small className="text-muted">{s.label}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Trainings table */}
      <Card className="border-0" style={{ borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <Card.Body className="p-0">
          {trainings.length === 0 ? (
            <div className="text-center py-5">
              <i className="fe fe-book-open text-muted" style={{ fontSize: 56 }} />
              <h6 className="mt-3 text-muted">Henüz eğitim tanımlanmamış</h6>
              <p className="text-muted" style={{ fontSize: 14 }}>Yeni Eğitim Ekle butonunu kullanarak başlayın.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ borderRadius: 18 }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="ps-4 py-3" style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>Eğitim</th>
                    <th className="py-3" style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Süre</th>
                    <th className="py-3" style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Durum</th>
                    <th className="py-3" style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Oluşturulma</th>
                    <th className="pe-4 py-3 text-end" style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fe fe-book text-white" style={{ fontSize: 14 }} />
                          </div>
                          <div>
                            <p className="mb-0 fw-semibold" style={{ color: '#1e1b4b', fontSize: 14 }}>{t.title}</p>
                            {t.description && <small className="text-muted" style={{ maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</small>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 align-middle">
                        <small className="text-muted">{t.duration > 0 ? `${t.duration} dk` : '—'}</small>
                      </td>
                      <td className="py-3 align-middle">
                        <Badge bg={t.status === 'ACTIVE' ? 'success' : 'secondary'} style={{ fontSize: 11, padding: '4px 10px' }}>
                          {t.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="py-3 align-middle">
                        <small className="text-muted">{new Date(t.created_at).toLocaleDateString('tr-TR')}</small>
                      </td>
                      <td className="pe-4 py-3 align-middle text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button size="sm" variant="outline-info" style={{ borderRadius: 7, fontSize: 12 }} onClick={() => openAssignList(t)}>
                            <i className="fe fe-users me-1" />Atamalar
                          </Button>
                          <Button size="sm" variant="outline-primary" style={{ borderRadius: 7, fontSize: 12 }} onClick={() => openAssign(t)}>
                            <i className="fe fe-user-plus me-1" />Ata
                          </Button>
                          <Button size="sm" variant="outline-secondary" style={{ borderRadius: 7, fontSize: 12 }} onClick={() => openEdit(t)}>
                            <i className="fe fe-edit-2" />
                          </Button>
                          <Button size="sm" variant="outline-danger" style={{ borderRadius: 7, fontSize: 12 }} onClick={() => handleDelete(t.id)}>
                            <i className="fe fe-trash-2" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ── Create Modal ── */}
      <TrainingFormModal
        show={showCreateModal}
        title="Yeni Eğitim Ekle"
        formData={formData}
        onChange={setFormData}
        onSave={handleCreate}
        onClose={() => setShowCreateModal(false)}
        loading={actionLoading}
      />

      {/* ── Edit Modal ── */}
      <TrainingFormModal
        show={showEditModal}
        title="Eğitimi Düzenle"
        formData={formData}
        onChange={setFormData}
        onSave={handleUpdate}
        onClose={() => setShowEditModal(false)}
        loading={actionLoading}
      />

      {/* ── Assign Modal ── */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9' }}>
          <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>
            Çalışan Ata — {selectedTraining?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ minHeight: '300px' }}>
          <Form.Group>
            <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Çalışan Seçin</Form.Label>
            <MultiSelectField
              name="assignEmployeeIds"
              value={assignEmployeeIds}
              onChange={setAssignEmployeeIds}
              options={employees.map(emp => ({
                value: emp.id.toString(),
                label: `${emp.first_name} ${emp.last_name} ${emp.company_email ? `(${emp.company_email})` : ''}`
              }))}
              placeholder="Çalışan Ara..."
              showSelectAll={true}
            />
            <Form.Text className="text-muted d-block mt-2">
              Atamak istediğiniz çalışanları seçin (birden fazla seçim yapabilirsiniz).
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none' }}>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)} style={{ borderRadius: 8 }}>İptal</Button>
          <Button
            disabled={actionLoading || assignEmployeeIds.length === 0}
            onClick={handleAssign}
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8 }}
          >
            {actionLoading ? <Spinner size="sm" animation="border" /> : 'Ata'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Assignment List Modal ── */}
      <Modal show={showAssignListModal} onHide={() => setShowAssignListModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>
            {selectedTraining?.title} — Atamalar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {assignments.length === 0 ? (
            <p className="text-center text-muted py-3">Bu eğitim için henüz atama yapılmamış.</p>
          ) : (
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Durum</th>
                  <th>Başlama</th>
                  <th>Bitiş</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>
                      {a.employee
                        ? `${a.employee.first_name} ${a.employee.last_name}`
                        : `#${a.employee_id}`}
                    </td>
                    <td><Badge bg={statusColors[a.status]}>{statusLabels[a.status]}</Badge></td>
                    <td>{a.started_at ? new Date(a.started_at).toLocaleDateString('tr-TR') : '—'}</td>
                    <td>{a.completed_at ? new Date(a.completed_at).toLocaleDateString('tr-TR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable form modal
// ─────────────────────────────────────────────────────────────────────────────
function TrainingFormModal({
  show, title, formData, onChange, onSave, onClose, loading,
}: {
  show: boolean;
  title: string;
  formData: CreateTrainingPayload;
  onChange: (d: CreateTrainingPayload) => void;
  onSave: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Eğitim Adı *</Form.Label>
          <Form.Control
            placeholder="Eğitim başlığı"
            value={formData.title}
            onChange={e => onChange({ ...formData, title: e.target.value })}
            style={{ borderRadius: 8 }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Açıklama</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Eğitim açıklaması"
            value={formData.description}
            onChange={e => onChange({ ...formData, description: e.target.value })}
            style={{ borderRadius: 8 }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Eğitim Dosyası (PDF) *</Form.Label>
          <Form.Control
            type="file"
            accept="application/pdf"
            onChange={(e: any) => {
              if (e.target.files && e.target.files[0]) {
                onChange({ ...formData, file: e.target.files[0] });
              }
            }}
            style={{ borderRadius: 8 }}
          />
        </Form.Group>
        <Row>
          <Col xs={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Süre (dakika)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={formData.duration}
                onChange={e => onChange({ ...formData, duration: parseInt(e.target.value) || 0 })}
                style={{ borderRadius: 8 }}
              />
            </Form.Group>
          </Col>
          <Col xs={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: 14 }}>Durum</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={e => onChange({ ...formData, status: e.target.value as any })}
                style={{ borderRadius: 8 }}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer style={{ border: 'none' }}>
        <Button variant="secondary" onClick={onClose} style={{ borderRadius: 8 }}>İptal</Button>
        <Button
          disabled={loading || !formData.title.trim() || (!formData.file && title === 'Yeni Eğitim Ekle')}
          onClick={onSave}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8, fontWeight: 600 }}
        >
          {loading ? <Spinner size="sm" animation="border" className="me-1" /> : null}
          Kaydet
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
