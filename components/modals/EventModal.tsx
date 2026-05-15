import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Event } from '@/models/hr/hr-models';
import { eventService } from '@/services';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import moment from 'moment';

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
    quota: 0,
    allow_companion: false,
    max_companion: 0,
    last_change_date: '',
    last_change_time: '',
    resend_template_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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
        quota: event.quota || 0,
        allow_companion: event.allow_companion || false,
        max_companion: event.max_companion || 0,
        last_change_date: event.last_change_date ? moment(event.last_change_date).format('YYYY-MM-DD') : '',
        last_change_time: event.last_change_date ? moment(event.last_change_date).format('HH:mm') : '',
        resend_template_id: event.resend_template_id || ''
      });
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
        quota: 0,
        allow_companion: false,
        max_companion: 0,
        last_change_date: '',
        last_change_time: '',
        resend_template_id: ''
      });
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
    <Modal show={show} onHide={onHide} size="xl">
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <FormSelectField label="Kitle Filtresi" name="audience_filter" value={formData.audience_filter} onChange={handleInputChange}>
                    <option value="ALL_COMPANY">Tüm Şirket</option>
                    <option value="DEPARTMENT">Departman</option>
                    <option value="LOCATION">Lokasyon</option>
                  </FormSelectField>
                </Form.Group>
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
