import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Event } from '@/models/hr/hr-models';
import { eventService } from '@/services';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import MultiSelectField from '@/components/MultiSelectField';
import moment from 'moment';
import { lookupService, DepartmentLookup, CompanyLookup } from '@/services/lookup.service';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/models/hr/hr-models';

interface EventModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  event?: Event | null;
  isEdit?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
  show,
  onHide,
  onSave,
  event = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    type: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    audience_filter: 'ALL_COMPANY',
    status: 'DRAFT',
    quota: 0,
    allow_companion: false,
    max_companion: 0,
    last_change_date: '',
    last_change_time: '',
    resend_template_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    lookupService.getCompaniesLookup().then(res => {
      setCompanies(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setDepartments([]);
      setSelectedDepartmentIds([]);
      setEmployees([]);
      lookupService.getDepartmentsByCompanyLookup(parseInt(selectedCompany))
        .then(res => {
          setDepartments(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        })
        .catch(err => console.error('fetch departments failed', err));
    } else {
      setDepartments([]);
      setEmployees([]);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedDepartmentIds.length > 0 && selectedCompany) {
      setEmployees([]);
      employeeService.getAll({ limit: 1000, status: 'ACTIVE', department_ids: selectedDepartmentIds.join(','), company_id: selectedCompany } as any)
        .then(res => {
          setEmployees(res?.data || []);
        })
        .catch(err => console.error('fetch employees failed', err));
    } else {
      setEmployees([]);
    }
  }, [selectedDepartmentIds, selectedCompany]);

  useEffect(() => {
    if (isEdit && event) {
      setFormData({
        name: event.name || '',
        type: event.type || '',
        description: event.description || '',
        start_date: event.start_date ? moment(event.start_date).format('YYYY-MM-DD') : '',
        start_time: event.start_date ? moment(event.start_date).format('HH:mm') : '',
        end_date: event.end_date ? moment(event.end_date).format('YYYY-MM-DD') : '',
        end_time: event.end_date ? moment(event.end_date).format('HH:mm') : '',
        location: event.location || '',
        audience_filter: event.audience_filter || 'ALL_COMPANY',
        status: event.status || 'DRAFT',
        quota: event.quota || 0,
        allow_companion: event.allow_companion || false,
        max_companion: event.max_companion || 0,
        last_change_date: event.last_change_date ? moment(event.last_change_date).format('YYYY-MM-DD') : '',
        last_change_time: event.last_change_date ? moment(event.last_change_date).format('HH:mm') : '',
        resend_template_id: event.resend_template_id || ''
      });
      if (event.participants && Array.isArray(event.participants)) {
        // Find existing users
        const existingEmpIds: string[] = [];
        const namesMap: Record<string, string> = {};
        const statusMap: Record<string, string> = {};
        event.participants
          .forEach((p: any) => {
            if (p.user?.employee?.id) {
              const empIdStr = p.user.employee.id.toString();
              existingEmpIds.push(empIdStr);
              namesMap[empIdStr] = `${p.user.employee.first_name} ${p.user.employee.last_name}`;
              statusMap[empIdStr] = p.status;
            }
          });
        setSelectedEmployees(existingEmpIds);
        setParticipantNames(namesMap);
        setParticipantStatuses(statusMap);
      } else {
        setSelectedEmployees([]);
        setParticipantNames({});
        setParticipantStatuses({});
      }
    } else {
      setFormData({
        name: '',
        type: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location: '',
        audience_filter: 'ALL_COMPANY',
        status: 'DRAFT',
        quota: 0,
        allow_companion: false,
        max_companion: 0,
        last_change_date: '',
        last_change_time: '',
        resend_template_id: ''
      });
      setSelectedEmployees([]);
      setSelectedCompany('');
      setSelectedDepartmentIds([]);
      setParticipantNames({});
      setParticipantStatuses({});
    }
    setFieldErrors({});
  }, [show, event, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'quota' || name === 'max_companion' ? parseInt(value) || 0 : value)
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name?.trim()) errors.name = 'Etkinlik adı zorunludur';
    if (!formData.type?.trim()) errors.type = 'Etkinlik tipi zorunludur';
    if (!formData.start_date) errors.start_date = 'Başlangıç tarihi zorunludur';
    if (!formData.end_date) errors.end_date = 'Bitiş tarihi zorunludur';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = { ...formData };
      if (!submitData.last_change_date) {
        delete submitData.last_change_date;
      } else {
        submitData.last_change_date = new Date(`${submitData.last_change_date}T${submitData.last_change_time || '00:00'}`).toISOString();
      }
      submitData.start_date = new Date(`${submitData.start_date}T${submitData.start_time || '00:00'}`).toISOString();
      submitData.end_date = new Date(`${submitData.end_date}T${submitData.end_time || '00:00'}`).toISOString();
      
      delete submitData.start_time;
      delete submitData.end_time;
      delete submitData.last_change_time;
      submitData.target_employee_ids = selectedEmployees.map(id => parseInt(id));

      if (isEdit && event) {
        await eventService.update(event.id, submitData);
        toast.success('Etkinlik başarıyla güncellendi');
      } else {
        await eventService.create(submitData);
        toast.success('Etkinlik başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" enforceFocus={false}>
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />
        
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <h5 className="mb-3">Temel Bilgiler</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Etkinlik Adı <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} isInvalid={!!fieldErrors.name} />
                  {fieldErrors.name && <div className="text-danger mt-1">{fieldErrors.name}</div>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <FormSelectField label="Tip *" name="type" value={formData.type} onChange={handleInputChange} isInvalid={!!fieldErrors.type} errorMessage={fieldErrors.type}>
                    <option value="">Seçiniz</option>
                    <option value="Sosyal">Sosyal</option>
                    <option value="Eğitim">Eğitim</option>
                    <option value="Toplantı">Toplantı</option>
                    <option value="Diğer">Diğer</option>
                  </FormSelectField>
                </Form.Group>
              </Col>
              {isEdit && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <FormSelectField label="Durum" name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="DRAFT">Taslak</option>
                      <option value="PUBLISHED">Yayında</option>
                      <option value="CANCELLED">İptal Edildi</option>
                      <option value="COMPLETED">Tamamlandı</option>
                    </FormSelectField>
                  </Form.Group>
                </Col>
              )}
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Açıklama</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Row>
                  <Col sm={7}>
                    <FormDateField label="Başlangıç Tarihi" name="start_date" value={formData.start_date} onChange={handleInputChange} isInvalid={!!fieldErrors.start_date} errorMessage={fieldErrors.start_date} required />
                  </Col>
                  <Col sm={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Saat</Form.Label>
                      <Form.Control type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <Row>
                  <Col sm={7}>
                    <FormDateField label="Bitiş Tarihi" name="end_date" value={formData.end_date} onChange={handleInputChange} isInvalid={!!fieldErrors.end_date} errorMessage={fieldErrors.end_date} required />
                  </Col>
                  <Col sm={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Saat</Form.Label>
                      <Form.Control type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lokasyon</Form.Label>
                  <Form.Control type="text" name="location" value={formData.location} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <hr />
                <h5 className="mb-3 mt-2">Katılımcı Hedefleme (İsteğe Bağlı)</h5>
                <Form.Text className="text-muted mb-3 d-block">
                  Aşağıdan kişi seçerseniz etkinlik sadece seçtiğiniz kişilere görünür ve mail gider. Hiç kimseyi seçmezseniz etkinlik <b>Tüm Şirket</b>'e açık olur.
                </Form.Text>
                <Row className="mb-3">
                  <Col md={6}>
                    <FormSelectField
                      label="Şirket Filtresi"
                      name="selectedCompany"
                      value={selectedCompany}
                      onChange={(e: any) => {
                        setSelectedCompany(e.target.value);
                        setSelectedDepartmentIds([]); 
                      }}
                      disabled={loading}
                    >
                      <option value="">Şirket Seçiniz</option>
                      {companies.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </FormSelectField>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">Departman Filtresi</Form.Label>
                      <MultiSelectField
                        name="selectedDepartmentIds"
                        value={selectedDepartmentIds}
                        onChange={setSelectedDepartmentIds}
                        options={departments.map((dept) => ({
                          value: String(dept.id),
                          label: dept.name,
                        }))}
                        disabled={loading || (!selectedCompany && companies.length > 0)}
                        loading={loading}
                        placeholder={selectedCompany ? 'Departman seçiniz' : 'Öncelikle Şirket Seçiniz'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Label>Etkinliğe Eklenecek Çalışanlar</Form.Label>
                    <div className="d-flex align-items-stretch" style={{ height: '300px', gap: '15px' }}>
                      {/* Left Panel: Available Employees */}
                      <div className="border rounded d-flex flex-column flex-grow-1" style={{ flexBasis: '45%' }}>
                        <div className="bg-light border-bottom p-2 fw-bold text-center">Filtrelenen Çalışanlar</div>
                        <div className="overflow-auto p-2" style={{ flex: 1 }}>
                          {employees
                            .filter(emp => !selectedEmployees.includes(emp.id.toString()))
                            .map(emp => (
                              <div 
                                key={'avail-'+emp.id}
                                className="p-2 border-bottom cursor-pointer d-flex justify-content-between align-items-center"
                                onClick={() => setSelectedEmployees(prev => [...prev, emp.id.toString()])}
                                style={{ cursor: 'pointer' }}
                                title="Sağa ekle"
                              >
                                <span>{emp.first_name} {emp.last_name}</span>
                                <span className="text-primary fw-bold">+</span>
                              </div>
                          ))}
                          {employees.filter(emp => !selectedEmployees.includes(emp.id.toString())).length === 0 && (
                            <div className="text-muted text-center mt-3">Listelenecek çalışan bulunamadı. Filtreleri kullanın.</div>
                          )}
                        </div>
                      </div>

                      {/* Middle arrows */}
                      <div className="d-flex flex-column justify-content-center">
                        <Button variant="outline-secondary" size="sm" className="mb-2" onClick={(e) => { e.preventDefault(); setSelectedEmployees(prev => [...new Set([...prev, ...employees.map(e => e.id.toString())])]); }}>&gt;&gt;</Button>
                        <Button variant="outline-secondary" size="sm" onClick={(e) => { e.preventDefault(); setSelectedEmployees([]); }}>&lt;&lt;</Button>
                      </div>

                      {/* Right Panel: Selected Employees */}
                      <div className="border rounded d-flex flex-column flex-grow-1" style={{ flexBasis: '45%', borderColor: 'var(--bs-primary) !important' }}>
                        <div className="bg-primary text-white border-bottom p-2 fw-bold text-center rounded-top">Davetli Çalışanlar ({selectedEmployees.length})</div>
                        <div className="overflow-auto p-2" style={{ flex: 1 }}>
                          {selectedEmployees.map(empId => {
                            const emp = employees.find(e => e.id.toString() === empId);
                            const name = emp ? `${emp.first_name} ${emp.last_name}` : (participantNames[empId] || `Katılımcı #${empId} (Yüklü Değil)`);
                            const status = participantStatuses[empId];
                            const statusBadge = status === 'ATTENDING'
                              ? <span className="badge bg-success ms-1" style={{fontSize:'10px'}}>Katılacak</span>
                              : status === 'NOT_ATTENDING'
                              ? <span className="badge bg-danger ms-1" style={{fontSize:'10px'}}>Katılmayacak</span>
                              : status === 'PENDING'
                              ? <span className="badge bg-warning text-dark ms-1" style={{fontSize:'10px'}}>Bekliyor</span>
                              : null;
                            return (
                              <div 
                                key={'sel-'+empId}
                                className="p-2 border-bottom cursor-pointer d-flex justify-content-between align-items-center"
                                onClick={() => setSelectedEmployees(prev => prev.filter(id => id !== empId))}
                                style={{ cursor: 'pointer' }}
                                title="Kaldır"
                              >
                                <span>{name}{statusBadge}</span>
                                <span className="text-danger fw-bold">-</span>
                              </div>
                            )
                          })}
                          {selectedEmployees.length === 0 && (
                            <div className="text-muted text-center mt-3">Henüz davetli yok. (Tüm şirket olarak yayınlanacak)</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>

            <hr />
            <h5 className="mb-3 mt-2">Katılım Kuralları</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kontenjan (0: Sınırsız)</Form.Label>
                  <Form.Control type="number" name="quota" min="0" value={formData.quota} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3 mt-4">
                  <Form.Check type="switch" id="allow_companion" name="allow_companion" label="Refakatçi İzni" checked={formData.allow_companion} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              {formData.allow_companion && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Refakatçi Sayısı</Form.Label>
                    <Form.Control type="number" name="max_companion" min="0" value={formData.max_companion} onChange={handleInputChange} />
                  </Form.Group>
                </Col>
              )}
              <Col md={6}>
                <Row>
                  <Col sm={7}>
                    <FormDateField label="Katılım Son Değişiklik Tarihi" name="last_change_date" value={formData.last_change_date} onChange={handleInputChange} />
                  </Col>
                  <Col sm={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Saat</Form.Label>
                      <Form.Control type="time" name="last_change_time" value={formData.last_change_time} onChange={handleInputChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Text className="text-muted d-block" style={{ marginTop: '-10px' }}>Bu tarihten sonra çalışanlar katılım durumunu değiştiremez.</Form.Text>
              </Col>
            </Row>

            <hr />
            <h5 className="mb-3 mt-2">Bildirim Yönetimi</h5>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Resend Template ID</Form.Label>
                  <Form.Control type="text" name="resend_template_id" value={formData.resend_template_id} onChange={handleInputChange} placeholder="re_12345" />
                  <Form.Text className="text-muted">Yayınla dediğinizde bu template ID ile bildirim gönderilecektir. (Boş bırakılırsa gönderilmez)</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default EventModal;
