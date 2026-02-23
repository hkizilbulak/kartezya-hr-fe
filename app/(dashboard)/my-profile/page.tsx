'use client'
import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/models/hr/hr-models';
import { Container, Row, Col, Button, Alert, Card, Form } from 'react-bootstrap';
import InputMask from 'react-input-mask';
import { PageHeading } from '@/widgets';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions } from '@/contants/options';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';
import '@/styles/components/table-common.scss';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  company_email: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  profession_start_date: string;
  marital_status: string;
  emergency_contact: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  mother_name: string;
  father_name: string;
  nationality: string;
  identity_no: string;
}

const Profile = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    company_email: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    gender: '',
    date_of_birth: '',
    hire_date: '',
    profession_start_date: '',
    marital_status: '',
    emergency_contact: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    mother_name: '',
    father_name: '',
    nationality: '',
    identity_no: ''
  });

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Employee bilgilerini al (work information da buradan gelir)
      const response = await employeeService.getMyProfile();
      
      if (response.success && response.data) {
        setEmployee(response.data);
        const newFormData = {
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          company_email: response.data.user?.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          state: response.data.state || '',
          city: response.data.city || '',
          gender: response.data.gender || '',
          date_of_birth: formatDateForInput(response.data.date_of_birth),
          hire_date: formatDateForInput(response.data.hire_date),
          profession_start_date: formatDateForInput((response.data as any).profession_start_date),
          marital_status: response.data.marital_status || '',
          emergency_contact: response.data.emergency_contact || '',
          emergency_contact_name: response.data.emergency_contact_name || '',
          emergency_contact_relation: response.data.emergency_contact_relation || '',
          mother_name: response.data.mother_name || '',
          father_name: response.data.father_name || '',
          nationality: response.data.nationality || '',
          identity_no: response.data.identity_no || ''
        };
        
        setFormData(newFormData);
      }
      
    } catch (err) {
      toast.error('Personel bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (!employee?.id) {
        throw new Error('Employee ID bulunamadı');
      }

      const updateData = {
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || '',
        state: formData.state || '',
        city: formData.city || '',
        gender: formData.gender || '',
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : '',
        profession_start_date: formData.profession_start_date ? new Date(formData.profession_start_date).toISOString() : '',
        marital_status: formData.marital_status || '',
        emergency_contact: formData.emergency_contact || '',
        emergency_contact_name: formData.emergency_contact_name || '',
        emergency_contact_relation: formData.emergency_contact_relation || '',
        mother_name: formData.mother_name || '',
        father_name: formData.father_name || '',
        nationality: formData.nationality || '',
        identity_no: formData.identity_no || ''
      };

      const response = await employeeService.updateMyProfile(updateData);
      
      if (response.success) {
        toast.success('Personel bilgileri başarıyla güncellendi');
        setEmployee(response.data);
      } else {
        toast.error(response.error || 'Güncelleme başarısız oldu');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Personel bilgileri güncellenirken bir hata oluştu';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <style jsx global>{`
        #page-content {
          background-color: #f5f7fa;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .page-container {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }
        @media (max-width: 768px) {
          .page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        }
        .page-heading-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .page-heading-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .card-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .card-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .profile-form-card {
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .profile-info-card {
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .profile-header {
          text-align: center;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #007bff;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto;
        }
        .info-card {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
        }
        .info-card:last-child {
          border-bottom: none;
        }
        .info-label {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
        }
        .section-divider {
          border-top: 2px solid #e9ecef;
          padding-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .section-title {
          color: #495057;
          font-weight: 700;
          font-size: 16px;
          margin: 0;
          margin-bottom: 1rem;
        }
      `}</style>

      <Container fluid className="page-container">
        <LoadingOverlay show={loading || isSubmitting} message={loading ? "Profil bilgileri yükleniyor..." : "Kaydediliyor..."} />
        
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Personel Bilgilerim"
            showCreateButton={false}
            showFilterButton={false}
          />
        </div>

        <Row>
          {/* Left Sidebar - Profile Info */}
          <Col lg={3} md={3} className="mb-4">
            <div className="card-wrapper">
              <Card className="profile-info-card h-100">
                <Card.Body className="p-4">
                  {/* Profile Header */}
                  <div className="profile-header text-center mb-4">
                    <div className="profile-avatar mb-3">
                      {formData.first_name && formData.last_name 
                        ? `${formData.first_name.charAt(0)}${formData.last_name.charAt(0)}`
                        : 'AA'
                      }
                    </div>
                    <h4 className="profile-name mb-1">
                      {formData.first_name && formData.last_name 
                        ? `${formData.first_name} ${formData.last_name}`
                        : ''
                      }
                    </h4>
                  </div>

                  {/* Basic Info Cards */}
                  <div className="info-cards">
                    <div className="info-card mb-3">
                      <div className="info-label">ŞİRKET E-POSTA</div>
                      <div className="info-value">
                        {formData.company_email || ''}
                      </div>
                    </div>

                    <div className="info-card mb-3">
                      <div className="info-label">İŞE BAŞLAMA TARİHİ</div>
                      <div className="info-value">
                        {formData.hire_date 
                          ? new Date(formData.hire_date).toLocaleDateString('tr-TR')
                          : ''
                        }
                      </div>
                    </div>

                    <div className="info-card mb-3">
                      <div className="info-label">TELEFON</div>
                      <div className="info-value">{formData.phone}</div>
                    </div>

                    <div className="info-card mb-3">
                      <div className="info-label">KİŞİSEL E-POSTA ADRESİ</div>
                      <div className="info-value">{formData.email}</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>

          {/* Main Form Content */}
          <Col lg={7} md={7}>
            <div className="card-wrapper">
              <Card className="profile-form-card">
                <Card.Body className="card-body-standard">
                  <Form onSubmit={handleSubmit}>
                    {/* Personal Email */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kişisel E-posta Adresi</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Telefon No</Form.Label>
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
                              />
                            )}
                          </InputMask>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Gender and Marital Status */}
                    <Row className="mb-4">
                      <FormSelectField
                        as={Col}
                        md={6}
                        controlId="gender"
                        label="Cinsiyet"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Seçiniz</option>
                        {genderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </FormSelectField>
                      
                      <FormSelectField
                        as={Col}
                        md={6}
                        controlId="marital_status"
                        label="Medeni Durum"
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleInputChange}
                      >
                        <option value="">Seçiniz</option>
                        {maritalStatusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </FormSelectField>
                    </Row>

                    {/* Address Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Adres</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* City and State */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>İl</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>İlçe</Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Date Fields */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <FormDateField
                          label="Doğum Tarihi"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData(prev => ({...prev, date_of_birth: e.target.value}))}
                          disabled={isSubmitting}
                        />
                      </Col>
                      <Col md={6}>
                        <FormDateField
                          label="Meslek Başlangıç Tarihi"
                          name="profession_start_date"
                          value={formData.profession_start_date}
                          onChange={(e) => setFormData(prev => ({...prev, profession_start_date: e.target.value}))}
                          disabled={isSubmitting}
                        />
                      </Col>
                    </Row>

                    {/* Identity Info */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kimlik No</Form.Label>
                          <Form.Control
                            type="text"
                            name="identity_no"
                            value={formData.identity_no}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Uyruk</Form.Label>
                          <Form.Control
                            type="text"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Parent Names */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Anne Adı</Form.Label>
                          <Form.Control
                            type="text"
                            name="mother_name"
                            value={formData.mother_name}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Baba Adı</Form.Label>
                          <Form.Control
                            type="text"
                            name="father_name"
                            value={formData.father_name}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Emergency Contact Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <div className="section-divider">
                          <h6 className="section-title">Acil Durum İletişim</h6>
                        </div>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ad Soyad</Form.Label>
                          <Form.Control
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Telefon No</Form.Label>
                          <InputMask
                            mask="(999) 999 9999"
                            value={formData.emergency_contact}
                            onChange={handleInputChange}
                          >
                            {(inputProps: any) => (
                              <Form.Control
                                {...inputProps}
                                type="tel"
                                name="emergency_contact"
                                placeholder="(123) 111 1111"
                              />
                            )}
                          </InputMask>
                        </Form.Group>
                      </Col>
                      <FormSelectField
                        as={Col}
                        md={4}
                        controlId="emergency_contact_relation"
                        label="İlişkisi"
                        name="emergency_contact_relation"
                        value={formData.emergency_contact_relation}
                        onChange={handleInputChange}
                      >
                        <option value="">Seçiniz</option>
                        {emergencyContactRelationOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </FormSelectField>
                    </Row>

                    {/* Submit Button */}
                    <Row className="mt-6">
                      <Col md={12}>
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Profile;