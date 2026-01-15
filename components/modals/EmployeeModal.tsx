import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Employee } from '@/models/hr/common.types';
import { employeeService } from '@/services';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';

interface EmployeeModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  employee?: Employee | null;
  isEdit?: boolean;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  show,
  onHide,
  onSave,
  employee = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    date_of_birth: '',
    gender: '',
    hire_date: '',
    leave_date: '',
    marital_status: '',
    total_experience: 0,
    emergency_contact_name: '',
    emergency_contact: '',
    emergency_contact_relation: ''
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEdit && employee) {
      setFormData({
        first_name: employee.firstName || '',
        last_name: employee.lastName || '',
        company_email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        date_of_birth: employee.birthDate || '',
        gender: employee.gender || '',
        hire_date: employee.hireDate || '',
        leave_date: employee.leaveDate || '',
        marital_status: employee.maritalStatus || '',
        total_experience: employee.totalExperience || 0,
        emergency_contact_name: employee.emergencyContactName || '',
        emergency_contact: employee.emergencyContact || '',
        emergency_contact_relation: employee.emergencyContactRelation || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        company_email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        date_of_birth: '',
        gender: '',
        hire_date: '',
        leave_date: '',
        marital_status: '',
        total_experience: 0,
        emergency_contact_name: '',
        emergency_contact: '',
        emergency_contact_relation: ''
      });
    }
    setFieldErrors({});
  }, [show, employee, isEdit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as any;
    const fieldValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Anlık validasyon - hata varsa temizle
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Zorunlu alanları kontrol et
    if (!formData.first_name?.trim()) {
      errors.first_name = 'Ad alanı zorunludur';
    }
    if (!formData.last_name?.trim()) {
      errors.last_name = 'Soyad alanı zorunludur';
    }
    if (!formData.company_email?.trim()) {
      errors.company_email = 'E-posta alanı zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      errors.company_email = 'Geçerli bir e-posta adresi giriniz';
    }
    if (!formData.hire_date?.trim()) {
      errors.hire_date = 'İşe başlama tarihi zorunludur';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        company_email: formData.company_email.trim(),
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        state: formData.state?.trim() || '',
        date_of_birth: formData.date_of_birth || '',
        gender: formData.gender || '',
        hire_date: formData.hire_date,
        leave_date: formData.leave_date || '',
        marital_status: formData.marital_status || '',
        total_experience: formData.total_experience || 0,
        emergency_contact_name: formData.emergency_contact_name?.trim() || '',
        emergency_contact: formData.emergency_contact?.trim() || '',
        emergency_contact_relation: formData.emergency_contact_relation?.trim() || ''
      };

      if (isEdit && employee) {
        await employeeService.update(employee.id, submitData);
        toast.success('Çalışan başarıyla güncellendi');
      } else {
        await employeeService.create(submitData);
        toast.success('Çalışan başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';

      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = isEdit 
          ? 'Çalışan güncellenirken bir hata oluştu'
          : 'Çalışan oluşturulurken bir hata oluştu';
      }

      const translatedError = translateErrorMessage(errorMessage);
      toast.error(translatedError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFieldErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleCancel} size="lg" centered>
      <LoadingOverlay show={loading} />
      <Modal.Header closeButton>
        <Modal.Title>
          {isEdit ? 'Çalışanı Düzenle' : 'Yeni Çalışan Oluştur'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Kişisel Bilgiler Section */}
          <h5 className="mb-3 mt-3">Kişisel Bilgiler</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ad *</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors.first_name}
                  disabled={loading}
                  placeholder="Ad"
                />
                {fieldErrors.first_name && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {fieldErrors.first_name}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Soyad *</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors.last_name}
                  disabled={loading}
                  placeholder="Soyad"
                />
                {fieldErrors.last_name && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {fieldErrors.last_name}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Cinsiyet</Form.Label>
                <Form.Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seçiniz</option>
                  <option value="MALE">Erkek</option>
                  <option value="FEMALE">Kadın</option>
                  <option value="OTHER">Diğer</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Medeni Durum</Form.Label>
                <Form.Select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seçiniz</option>
                  <option value="SINGLE">Bekâr</option>
                  <option value="MARRIED">Evli</option>
                  <option value="DIVORCED">Boşanmış</option>
                  <option value="WIDOWED">Dul</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Doğum Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Toplam Deneyim (Yıl)</Form.Label>
                <Form.Control
                  type="number"
                  name="total_experience"
                  value={formData.total_experience}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* İletişim Bilgileri Section */}
          <h5 className="mb-3 mt-3">İletişim Bilgileri</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Şirket E-postası *</Form.Label>
                <Form.Control
                  type="email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors.company_email}
                  disabled={loading}
                  placeholder="ornek@firma.com"
                />
                {fieldErrors.company_email && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {fieldErrors.company_email}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Telefon</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Adres Bilgileri Section */}
          <h5 className="mb-3 mt-3">Adres Bilgileri</h5>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Adres</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Sokak, bina, daire vs."
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Şehir</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Şehir"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>İl</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="İl"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* İş Bilgileri Section */}
          <h5 className="mb-3 mt-3">İş Bilgileri</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>İşe Başlama Tarihi *</Form.Label>
                <Form.Control
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors.hire_date}
                  disabled={loading}
                />
                {fieldErrors.hire_date && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {fieldErrors.hire_date}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ayrılma Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  name="leave_date"
                  value={formData.leave_date}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Acil İletişim Bilgileri Section */}
          <h5 className="mb-3 mt-3">Acil İletişim Bilgileri</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Acil İletişim Adı</Form.Label>
                <Form.Control
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Adı Soyadı"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Acil İletişim Telefonu</Form.Label>
                <Form.Control
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Acil İletişim İlişkisi</Form.Label>
                <Form.Select
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seçiniz</option>
                  <option value="SPOUSE">Eş</option>
                  <option value="PARENT">Ebeveyn</option>
                  <option value="CHILD">Çocuk</option>
                  <option value="SIBLING">Kardeş</option>
                  <option value="RELATIVE">Akraba</option>
                  <option value="FRIEND">Arkadaş</option>
                  <option value="OTHER">Diğer</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          İptal
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {isEdit ? 'Güncelle' : 'Oluştur'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeeModal;
