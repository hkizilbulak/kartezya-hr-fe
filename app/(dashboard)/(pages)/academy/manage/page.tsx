'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { academyService, surveyService, Training, TrainingAssignment, CreateTrainingPayload, AcademySurvey, CreateSurveyPayload } from '@/services/academy.service';
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
  const [activeTab, setActiveTab] = useState<'trainings' | 'surveys'>('trainings');
  const [surveys, setSurveys] = useState<AcademySurvey[]>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyFormData, setSurveyFormData] = useState<CreateSurveyPayload>({ title: '', description: '', is_multi_select: false, is_active: true, options: [''] });
  const [showSurveyResultsModal, setShowSurveyResultsModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<AcademySurvey | null>(null);
  
  const loadSurveys = useCallback(async () => {
    try {
      const res = await surveyService.listSurveys();
      if (res.success && res.data) setSurveys(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'surveys') {
      loadSurveys();
    }
  }, [activeTab, loadSurveys]);

  const handleCreateSurvey = async () => {
    if (!surveyFormData.title.trim() || surveyFormData.options.filter(o => o.trim() !== '').length < 2) {
      setError('Lütfen anket başlığını ve en az 2 seçeneği doldurun.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = { ...surveyFormData, options: surveyFormData.options.filter(o => o.trim() !== '') };
      await surveyService.createSurvey(payload);
      setSuccess('Anket başarıyla oluşturuldu!');
      setShowSurveyModal(false);
      setSurveyFormData({ title: '', description: '', is_multi_select: false, is_active: true, options: [''] });
      loadSurveys();
    } catch (e) {
      setError('Anket oluşturulamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
    try {
      await surveyService.deleteSurvey(id);
      setSuccess('Anket silindi.');
      loadSurveys();
    } catch (e) {
      setError('Silme işlemi başarısız.');
    }
  };


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
    setFormData({ title: t.title, description: t.description, duration: t.duration, status: t.status, file: null as unknown as File, imageFile: undefined });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedTraining) return;
    setActionLoading(true);
    try {
      await academyService.updateTraining(selectedTraining.id, formData);
      setSuccess('Eğitim güncellendi!');
      setShowEditModal(false);
      await loadTrainingsAndEmployees();
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
      await loadTrainingsAndEmployees();
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
      const res = await academyService.listTrainingAssignments(t.id, { limit: 5000, offset: 0 });
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
          onClick={() => { setShowCreateModal(true); setFormData({ title: '', description: '', duration: 0, status: 'ACTIVE', file: null as unknown as File }); }}
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, fontWeight: 600, padding: '10px 20px' }}
        >
          <i className="fe fe-plus me-2" />Yeni Eğitim Ekle
        </Button>
      </div>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* TABS */}
      <div className="d-flex mb-4 gap-3 border-bottom pb-2">
        <Button 
          variant={activeTab === 'trainings' ? 'primary' : 'light'} 
          className={activeTab === 'trainings' ? 'fw-bold shadow-sm' : 'text-muted'}
          onClick={() => setActiveTab('trainings')}
        >
          <i className="fe fe-book me-2" /> Eğitimler
        </Button>
        <Button 
          variant={activeTab === 'surveys' ? 'primary' : 'light'} 
          className={activeTab === 'surveys' ? 'fw-bold shadow-sm' : 'text-muted'}
          onClick={() => setActiveTab('surveys')}
        >
          <i className="fe fe-bar-chart-2 me-2" /> Anketler
        </Button>
      </div>

      {activeTab === 'trainings' && (
        <>
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
      </>
      )}

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


      {activeTab === 'surveys' && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Akademi Anketleri</h5>
                <p className="text-muted small mb-0">Aktif ve geçmiş anketleri yönetin.</p>
              </div>
              <Button variant="primary" className="fw-medium px-4 rounded-3 shadow-sm" onClick={() => setShowSurveyModal(true)}>
                <i className="fe fe-plus me-2" /> Yeni Anket Ekle
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            <Table responsive hover className="align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th className="border-0 text-muted fw-semibold small text-uppercase" style={{ letterSpacing: '1px' }}>Anket Başlığı</th>
                  <th className="border-0 text-muted fw-semibold small text-uppercase" style={{ letterSpacing: '1px' }}>Çoklu Seçim</th>
                  <th className="border-0 text-muted fw-semibold small text-uppercase" style={{ letterSpacing: '1px' }}>Durum</th>
                  <th className="border-0 text-muted fw-semibold small text-uppercase text-end" style={{ letterSpacing: '1px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(s => (
                  <tr key={s.id} style={{ backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                    <td className="border-0 rounded-start-3 p-3">
                      <div className="fw-bold text-dark">{s.title}</div>
                      <small className="text-muted">{s.options.length} Seçenek</small>
                    </td>
                    <td className="border-0 p-3">
                      {s.is_multi_select ? <Badge bg="info">Evet</Badge> : <Badge bg="secondary">Hayır</Badge>}
                    </td>
                    <td className="border-0 p-3">
                      {s.is_active ? <Badge bg="success">Aktif</Badge> : <Badge bg="danger">Pasif</Badge>}
                    </td>
                    <td className="border-0 rounded-end-3 p-3 text-end">
                      <Button variant="light" size="sm" className="text-primary border-0 hover-lift me-2" onClick={() => { setSelectedSurvey(s); setShowSurveyResultsModal(true); }}>
                        <i className="fe fe-bar-chart-2" /> Sonuçlar
                      </Button>
                      <Button variant="light" size="sm" className="text-danger border-0 hover-lift" onClick={() => handleDeleteSurvey(s.id)}>
                        <i className="fe fe-trash-2" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {surveys.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">Hiç anket bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Survey Create Modal */}
      <Modal show={showSurveyModal} onHide={() => setShowSurveyModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold h5">Yeni Anket Oluştur</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Anket Başlığı</Form.Label>
              <Form.Control type="text" value={surveyFormData.title} onChange={e => setSurveyFormData({...surveyFormData, title: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Açıklama</Form.Label>
              <Form.Control as="textarea" rows={2} value={surveyFormData.description} onChange={e => setSurveyFormData({...surveyFormData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="switch" label="Birden fazla seçenek işaretlenebilir" checked={surveyFormData.is_multi_select} onChange={e => setSurveyFormData({...surveyFormData, is_multi_select: e.target.checked})} />
            </Form.Group>
            <hr />
            <div className="d-flex justify-content-between mb-2">
              <span className="small fw-semibold text-muted">Seçenekler (Maddeler)</span>
              <Button size="sm" variant="link" onClick={() => setSurveyFormData({...surveyFormData, options: [...surveyFormData.options, '']})}>
                + Madde Ekle
              </Button>
            </div>
            {surveyFormData.options.map((opt, i) => (
              <div key={i} className="d-flex gap-2 mb-2">
                <Form.Control 
                  type="text" 
                  placeholder={`Seçenek ${i+1}`} 
                  value={opt} 
                  onChange={e => {
                    const newOpts = [...surveyFormData.options];
                    newOpts[i] = e.target.value;
                    setSurveyFormData({...surveyFormData, options: newOpts});
                  }} 
                />
                <Button variant="outline-danger" onClick={() => {
                  const newOpts = surveyFormData.options.filter((_, index) => index !== i);
                  setSurveyFormData({...surveyFormData, options: newOpts});
                }}>
                  <i className="fe fe-x" />
                </Button>
              </div>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSurveyModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleCreateSurvey} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Survey Results Modal */}
      <SurveyResultsModal
        show={showSurveyResultsModal}
        survey={selectedSurvey}
        onClose={() => setShowSurveyResultsModal(false)}
      />

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

// ─────────────────────────────────────────────────────────────────────────────
// Survey Results Modal
// ─────────────────────────────────────────────────────────────────────────────
function SurveyResultsModal({
  show, survey, onClose,
}: {
  show: boolean;
  survey: AcademySurvey | null;
  onClose: () => void;
}) {
  if (!survey) return null;
  const totalVotes = Object.values(survey.results || {}).reduce((a, b) => a + b, 0);

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>
          Anket Sonuçları: {survey.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <p className="text-muted small mb-4">Toplam {totalVotes} oy kullanıldı.</p>
        <div className="d-flex flex-column gap-3">
          {survey.options.map((opt) => {
            const count = survey.results?.[opt.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={opt.id}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-semibold text-dark" style={{ fontSize: 14 }}>{opt.text}</span>
                  <span className="text-muted small fw-medium">{count} Oy ({percentage}%)</span>
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 4, backgroundColor: '#f1f5f9' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${percentage}%`, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 4 }}
                    aria-valuenow={percentage} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer style={{ border: 'none' }}>
        <Button variant="secondary" onClick={onClose} style={{ borderRadius: 8 }}>Kapat</Button>
      </Modal.Footer>
    </Modal>
  );
}
