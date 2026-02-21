import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import InputMask from 'react-input-mask';
import { Employee } from '@/models/hr/common.types';
import { UserRole } from '@/models/enums/hr.enum';
import { employeeService, lookupService } from '@/services';
import { GradeLookup } from '@/services/lookup.service';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions, statusOptions } from '@/contants/options';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';

interface EmployeeModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  employee?: Employee | null;
}

interface FormData {
  email: string;
  company_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  profession_start_date: string;
  hire_date: string;
  total_gap: number | string;
  marital_status: string;
  identity_no: string;
  roles: string[];
  status: string;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  show,
  onHide,
  onSave,
  employee = null,
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    company_email: '',
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    profession_start_date: '',
    hire_date: '',
    total_gap: '',
    marital_status: '',
    identity_no: '',
    roles: ['EMPLOYEE'],
    status: 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [grades, setGrades] = useState<GradeLookup[]>([]);

  useEffect(() => {
    // Fetch grades when modal opens
    if (show) {
      fetchGrades();
    }
  }, [show]);

  const fetchGrades = async () => {
    try {
      const response = await lookupService.getGradesLookup();
      if (response.success && response.data) {
        setGrades(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      // Silent fail - grades list will be empty
    }
  };

  useEffect(() => {
    setFormData({
      email: '',
      company_email: '',
      first_name: '',
      last_name: '',
      phone: '',
      gender: '',
      date_of_birth: '',
      profession_start_date: '',
      hire_date: '',
      total_gap: '',
      marital_status: '',
      identity_no: '',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE'
    });
    setFieldErrors({});
  }, [show, employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProfessionStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const calculatedExperience = calculateExperienceFromProfessionStartDate(value);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLeaveDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      status: value ? 'PASSIVE' : prev.status // Set status to PASSIVE if leave_date is filled
    }));
  };

  const calculateExperienceFromProfessionStartDate = (startDate: string): number => {
    if (!startDate) return 0;

    const start = new Date(startDate);
    const today = new Date();

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    // Adjust if day hasn't occurred yet this month
    if (today.getDate() < start.getDate()) {
      months--;
    }

    // Adjust if months are negative
    if (months < 0) {
      years--;
      months += 12;
    }

    // Return total years as a decimal number (e.g., 2.25 for 2 years 3 months)
    return parseFloat((years + months / 12).toFixed(2));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'Ad zorunludur';
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Soyad zorunludur';
    }
    if (!formData.company_email.trim()) {
      errors.company_email = 'Şirket e-posta zorunludur';
    } else if (!formData.company_email.includes('@')) {
      errors.company_email = 'Geçerli bir şirket e-posta giriniz';
    }
    if (formData.email.trim() && !formData.email.includes('@')) {
      errors.email = 'Geçerli bir e-posta giriniz';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon zorunludur';
    }
    if (!formData.hire_date) {
      errors.hire_date = 'İşe başlama tarihi zorunludur';
    }
    if (!formData.profession_start_date) {
      errors.profession_start_date = 'Meslek başlama tarihi zorunludur';
    }
    if (formData.roles.length === 0) {
      errors.roles = 'En az bir rol seçiniz';
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
      const submitData: any = {
        email: formData.email.trim(),
        company_email: formData.company_email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        profession_start_date: formData.profession_start_date || undefined,
        hire_date: formData.hire_date,
        total_gap: parseFloat(formData.total_gap as string),
        marital_status: formData.marital_status || undefined,
        identity_no: formData.identity_no.trim(),
        roles: formData.roles,
        status: formData.status
      };

      await employeeService.create(submitData);
      toast.success('Çalışan başarıyla oluşturuldu');
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
        errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Bir hata oluştu';
      }

      const translatedError = translateErrorMessage(errorMessage);
      toast.error(translatedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable className="employee-modal">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />

        <Modal.Header closeButton>
          <Modal.Title>
            Çalışan Ekle
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ad <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Ad giriniz"
                    isInvalid={!!fieldErrors.first_name}
                  />
                  {fieldErrors.first_name && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.first_name}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Soyad <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Soyad giriniz"
                    isInvalid={!!fieldErrors.last_name}
                  />
                  {fieldErrors.last_name && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.last_name}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Şirket E-posta <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    placeholder="companyemail@company.com"
                    isInvalid={!!fieldErrors.company_email}
                  />
                  {fieldErrors.company_email && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.company_email}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    isInvalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.email}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Telefon <span className="text-danger">*</span></Form.Label>
                  <InputMask
                    mask="(999) 999 9999"
                    value={formData.phone}
                    onChange={handleInputChange}
                  >
                    {(inputProps: any) => (
                      <Form.Control
                        {...inputProps}
                        type="tel"
                        name="phone"
                        placeholder="(123) 111 1111"
                        isInvalid={!!fieldErrors.phone}
                      />
                    )}
                  </InputMask>
                  {fieldErrors.phone && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.phone}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Doğum Tarihi</Form.Label>
                  <FormDateField
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.date_of_birth}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cinsiyet</Form.Label>
                  <FormSelectField
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Cinsiyet seçiniz</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelectField>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Kimlik No</Form.Label>
                  <Form.Control
                    type="text"
                    name="identity_no"
                    value={formData.identity_no}
                    onChange={handleInputChange}
                    placeholder="Kimlik numarasını giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Meslek Başlama Tarihi <span className="text-danger">*</span></Form.Label>
                  <FormDateField
                    name="profession_start_date"
                    value={formData.profession_start_date}
                    onChange={handleProfessionStartDateChange}
                    isInvalid={!!fieldErrors.profession_start_date}
                  />
                  {fieldErrors.profession_start_date && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.profession_start_date}
                    </div>
                  )}
                </Form.Group>

              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İşe Başlama Tarihi <span className="text-danger">*</span></Form.Label>
                  <FormDateField
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.hire_date}
                  />
                  {fieldErrors.hire_date && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.hire_date}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Toplam Boşluk (Yıl)</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_gap"
                    value={formData.total_gap}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default EmployeeModal;
