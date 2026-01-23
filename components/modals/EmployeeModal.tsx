import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Employee } from '@/models/hr/common.types';
import { employeeService, lookupService } from '@/services';
import { CompanyLookup, DepartmentLookup, JobPositionLookup, GradeLookup } from '@/services/lookup.service';
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

const AVAILABLE_ROLES = ['ADMIN', 'EMPLOYEE', 'HR', 'FINANCE'];

interface FormData {
  email: string;
  company_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  leave_date: string;
  total_experience: string;
  marital_status: string;
  emergency_contact: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  grade_id: string;
  is_grade_up: boolean;
  contract_no: string;
  profession_start_date: string;
  note: string;
  mother_name: string;
  father_name: string;
  nationality: string;
  identity_no: string;
  roles: string[];
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  show,
  onHide,
  onSave,
  employee = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    company_email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    gender: '',
    date_of_birth: '',
    hire_date: '',
    leave_date: '',
    total_experience: '',
    marital_status: '',
    emergency_contact: '',
    emergency_contact_name: '',
    emergency_contact_relation: 'Diğer',
    grade_id: '',
    is_grade_up: false,
    contract_no: '',
    profession_start_date: '',
    note: '',
    mother_name: '',
    father_name: '',
    nationality: '',
    identity_no: '',
    roles: ['EMPLOYEE']
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
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
    if (isEdit && employee) {
      // Calculate experience if it's 0 or empty
      let experienceValue = employee.total_experience?.toString() || '';
      
      if (!experienceValue || employee.total_experience === 0) {
        // Calculate from profession_start_date if available
        const professionStartDate = (employee as any).profession_start_date;
        if (professionStartDate) {
          const calculated = calculateExperienceFromProfessionStartDate(professionStartDate);
          experienceValue = calculated.toString();
        }
      }

      setFormData({
        email: employee.email || '',
        company_email: (employee as any).company_email || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        phone: employee.phone || '',
        address: employee.address || '',
        state: employee.state || '',
        city: employee.city || '',
        gender: employee.gender || '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
        leave_date: employee.leave_date ? employee.leave_date.split('T')[0] : '',
        total_experience: experienceValue,
        marital_status: employee.marital_status || '',
        emergency_contact: employee.emergency_contact || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_relation: employee.emergency_contact_relation || 'Diğer',
        grade_id: (employee as any).grade_id?.toString() || '',
        is_grade_up: (employee as any).is_grade_up || false,
        contract_no: (employee as any).contract_no || '',
        profession_start_date: (employee as any).profession_start_date ? (employee as any).profession_start_date.split('T')[0] : '',
        note: (employee as any).note || '',
        mother_name: (employee as any).mother_name || '',
        father_name: (employee as any).father_name || '',
        nationality: (employee as any).nationality || '',
        identity_no: (employee as any).identity_no || '',
        roles: (employee as any).roles || ['EMPLOYEE']
      });
    } else {
      setFormData({
        email: '',
        company_email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        state: '',
        city: '',
        gender: '',
        date_of_birth: '',
        hire_date: '',
        leave_date: '',
        total_experience: '',
        marital_status: '',
        emergency_contact: '',
        emergency_contact_name: '',
        emergency_contact_relation: 'Diğer',
        grade_id: '',
        is_grade_up: false,
        contract_no: '',
        profession_start_date: '',
        note: '',
        mother_name: '',
        father_name: '',
        nationality: '',
        identity_no: '',
        roles: ['EMPLOYEE']
      });
    }
    setFieldErrors({});
  }, [show, employee, isEdit]);

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

  const calculateExperienceFromProfessionStartDate = (startDate: string): number => {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const today = new Date();
    
    let years = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      years--;
    }
    
    // Calculate months difference
    let months = monthDiff;
    if (months < 0) {
      months += 12;
    }
    
    // If months >= 6, add 0.5 to years
    if (months >= 6) {
      return years + 0.5;
    }
    
    return years;
  };

  const handleProfessionStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const calculatedExperience = calculateExperienceFromProfessionStartDate(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      total_experience: calculatedExperience.toString()
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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
    const errors: {[key: string]: string} = {};
    
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
    if (!formData.email.trim()) {
      errors.email = 'E-posta zorunludur';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Geçerli bir e-posta giriniz';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon zorunludur';
    }
    if (!formData.hire_date) {
      errors.hire_date = 'İşe başlama tarihi zorunludur';
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
        address: formData.address.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || undefined,
        hire_date: formData.hire_date,
        leave_date: formData.leave_date || undefined,
        total_experience: formData.total_experience ? parseFloat(formData.total_experience) : 0,
        marital_status: formData.marital_status,
        emergency_contact: formData.emergency_contact.trim(),
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_relation: formData.emergency_contact_relation,
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
        is_grade_up: formData.is_grade_up,
        contract_no: formData.contract_no.trim(),
        profession_start_date: formData.profession_start_date || undefined,
        note: formData.note.trim(),
        mother_name: formData.mother_name.trim(),
        father_name: formData.father_name.trim(),
        nationality: formData.nationality.trim(),
        identity_no: formData.identity_no.trim(),
        roles: formData.roles
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
            {isEdit ? 'Çalışan Düzenle' : 'Yeni Çalışan'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {/* Personal Information */}
            <h6 className="mb-3 text-secondary">Kişisel Bilgiler</h6>
            
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
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0555 000 0000"
                    isInvalid={!!fieldErrors.phone}
                  />
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
                  <Form.Control
                    type="date"
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
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Medeni Durum</Form.Label>
                  <Form.Select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Evli">Evli</option>
                    <option value="Bekar">Bekar</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Uyruk</Form.Label>
                  <Form.Control
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="Uyruk giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Annesi</Form.Label>
                  <Form.Control
                    type="text"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleInputChange}
                    placeholder="Anne adı giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Babası</Form.Label>
                  <Form.Control
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                    placeholder="Baba adı giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Contact Information */}
            <h6 className="mb-3 text-secondary">İletişim Bilgileri</h6>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Adres</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ev adresi giriniz"
                    rows={2}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İl</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="İl giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İlçe</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="İlçe giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Employment & Contract Information */}
            <h6 className="mb-3 text-secondary">İstihdam & Sözleşme Bilgileri</h6>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İşe Başlama Tarihi <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Meslek Başlama Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    name="profession_start_date"
                    value={formData.profession_start_date}
                    onChange={handleProfessionStartDateChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Sözleşme No</Form.Label>
                  <Form.Control
                    type="text"
                    name="contract_no"
                    value={formData.contract_no}
                    onChange={handleInputChange}
                    placeholder="Sözleşme numarasını giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İşten Ayrılma Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    name="leave_date"
                    value={formData.leave_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Toplam Deneyim (Yıl)</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_experience"
                    value={formData.total_experience}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.5"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Grade</Form.Label>
                  <Form.Select
                    name="grade_id"
                    value={formData.grade_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="is_grade_up"
                    label="Grade Yükseltildi"
                    checked={formData.is_grade_up}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_grade_up: e.target.checked
                    }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Not</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Not giriniz"
                    rows={2}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Emergency Contact */}
            <h6 className="mb-3 text-secondary">Acil Durum İletişim</h6>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    placeholder="Ad Soyad giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    placeholder="Telefon giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>İlişki</Form.Label>
                  <Form.Select
                    name="emergency_contact_relation"
                    value={formData.emergency_contact_relation}
                    onChange={handleInputChange}
                  >
                    <option value="Anne">Anne</option>
                    <option value="Baba">Baba</option>
                    <option value="Eş">Eş</option>
                    <option value="Çocuk">Çocuk</option>
                    <option value="Kardeş">Kardeş</option>
                    <option value="Diğer">Diğer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Roles */}
            <h6 className="mb-3 text-secondary">Roller <span className="text-danger">*</span></h6>
            
            <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {AVAILABLE_ROLES.map(role => (
                <Form.Check
                  key={role}
                  type="checkbox"
                  id={`role-${role}`}
                  label={role}
                  checked={formData.roles.includes(role)}
                  onChange={() => handleRoleChange(role)}
                  className="mb-2"
                />
              ))}
              {fieldErrors.roles && (
                <div className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.roles}
                </div>
              )}
            </div>
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
