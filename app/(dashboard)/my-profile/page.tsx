'use client'
import { useState, useEffect } from 'react';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/models/hr/common.types';
import { Container, Row, Col, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { PageHeading } from '@/widgets';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions } from '@/contants/options';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  first_name: Yup.string().required('Adı zorunludur'),
  last_name: Yup.string().required('Soyadı zorunludur'),
  email: Yup.string(),
  company_email: Yup.string(),
  phone: Yup.string().required('Telefon No zorunludur'),
  address: Yup.string(),
  state: Yup.string(),
  city: Yup.string(),
  gender: Yup.string(),
  date_of_birth: Yup.string(),
  hire_date: Yup.string(),
  profession_start_date: Yup.string(),
  marital_status: Yup.string(),
  emergency_contact: Yup.string(),
  emergency_contact_name: Yup.string(),
  emergency_contact_relation: Yup.string(),
  mother_name: Yup.string(),
  father_name: Yup.string(),
  nationality: Yup.string(),
  identity_no: Yup.string()
});

const Profile = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeService.getMyProfile();
      if (response.success && response.data) {
        setEmployee(response.data);
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Personel bilgileri yüklenirken bir hata oluştu');
      toast.error('Personel bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!employee?.id) {
        throw new Error('Employee ID bulunamadı');
      }

      const updateData = {
        email: values.email || '',
        phone: values.phone || '',
        address: values.address || '',
        state: values.state || '',
        city: values.city || '',
        gender: values.gender || '',
        date_of_birth: values.date_of_birth ? new Date(values.date_of_birth).toISOString() : '',
        profession_start_date: values.profession_start_date ? new Date(values.profession_start_date).toISOString() : '',
        marital_status: values.marital_status || '',
        emergency_contact: values.emergency_contact || '',
        emergency_contact_name: values.emergency_contact_name || '',
        emergency_contact_relation: values.emergency_contact_relation || '',
        mother_name: values.mother_name || '',
        father_name: values.father_name || '',
        nationality: values.nationality || '',
        identity_no: values.identity_no || ''
      };

      const response = await employeeService.updateMyProfile(updateData);
      
      if (response.success) {
        toast.success('Personel bilgileri başarıyla güncellendi');
        setEmployee(response.data);
      } else {
        setError(response.error || 'Güncelleme başarısız oldu');
        toast.error(response.error || 'Güncelleme başarısız oldu');
      }
    } catch (err: any) {
      console.error('Error updating employee data:', err);
      const errorMsg = err.response?.data?.error || 'Personel bilgileri güncellenirken bir hata oluştu';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="ps-6 pe-6 pt-6">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container fluid className="ps-6 pe-6 pt-6">
        <Alert variant="danger">Personel bilgileri yüklenemedi</Alert>
      </Container>
    );
  }

  const initialValues = {
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    company_email: employee.user?.email || '',
    phone: employee.phone || '',
    address: employee.address || '',
    state: employee.state || '',
    city: employee.city || '',
    gender: employee.gender || '',
    date_of_birth: formatDateForInput(employee.date_of_birth),
    hire_date: formatDateForInput(employee.hire_date),
    profession_start_date: formatDateForInput((employee as any).profession_start_date),
    marital_status: employee.marital_status || '',
    emergency_contact: employee.emergency_contact || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_relation: employee.emergency_contact_relation || '',
    mother_name: employee.mother_name || '',
    father_name: employee.father_name || '',
    nationality: employee.nationality || '',
    identity_no: employee.identity_no || ''
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
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Personel Bilgilerim"
            showCreateButton={false}
            showFilterButton={false}
          />
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="card-wrapper card-wrapper-standard">
              <Card className="profile-form-card">
                <Card.Body className="card-body-standard">
                  <div className="position-relative">
                    <LoadingOverlay show={isSubmitting} message="Kaydediliyor..." />

                    <Formik
                      initialValues={initialValues}
                      validationSchema={validationSchema}
                      onSubmit={handleSubmit}
                    >
                      {({ isSubmitting: formIsSubmitting, values, setFieldValue, errors, touched }) => (
                        <FormikForm>
                          {/* Name Section */}
                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="first_name"
                              label="Ad"
                              name="first_name"
                              type="text"
                              disabled
                            />
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="last_name"
                              label="Soyad"
                              name="last_name"
                              type="text"
                              disabled
                            />
                          </Row>

                          {/* Company Email Section */}
                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="company_email"
                              label="Şirket E-posta Adresi"
                              name="company_email"
                              type="email"
                              disabled
                            />
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="email"
                              label="Kişisel E-posta Adresi"
                              name="email"
                              type="email"
                            />
                          </Row>

                          {/* Contact Section */}
                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="phone"
                              label="Telefon No"
                              name="phone"
                              type="tel"
                              mask="(999) 999 9999"
                              maskChar=""
                            />
                            <FormSelectField
                              as={Col}
                              md={6}
                              controlId="gender"
                              label="Cinsiyet"
                              name="gender"
                            >
                              <>
                                <option value="">Seçiniz</option>
                                {genderOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </>
                            </FormSelectField>
                          </Row>

                          {/* Address Section */}
                          <Row className="mb-4">
                            <Col md={12}>
                              <FormTextField
                                controlId="address"
                                label="Adres"
                                name="address"
                                type="text"
                              />
                            </Col>
                          </Row>

                          {/* City and State Section */}
                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="city"
                              label="İl"
                              name="city"
                              type="text"
                            />
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="state"
                              label="İlçe"
                              name="state"
                              type="text"
                            />
                          </Row>

                          {/* Date Section - Using FormDateField */}
                          <Row className="mb-4">
                            <Col md={6}>
                              <FormDateField
                                label="Doğum Tarihi"
                                name="date_of_birth"
                                value={values.date_of_birth}
                                onChange={(e) => setFieldValue('date_of_birth', e.target.value)}
                                isInvalid={touched.date_of_birth && !!errors.date_of_birth}
                                errorMessage={touched.date_of_birth ? errors.date_of_birth : undefined}
                              />
                            </Col>
                            <FormSelectField
                              as={Col}
                              md={6}
                              controlId="marital_status"
                              label="Medeni Durum"
                              name="marital_status"
                            >
                              <>
                                <option value="">Seçiniz</option>
                                {maritalStatusOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </>
                            </FormSelectField>
                          </Row>

                          <Row className="mb-4">
                            <Col md={6}>
                              <FormDateField
                                label="İşe Giriş Tarihi"
                                name="hire_date"
                                value={values.hire_date}
                                onChange={(e) => setFieldValue('hire_date', e.target.value)}
                                disabled
                                isInvalid={touched.hire_date && !!errors.hire_date}
                                errorMessage={touched.hire_date ? errors.hire_date : undefined}
                              />
                            </Col>
                            <Col md={6}>
                              <FormDateField
                                label="Meslek Başlangıç Tarihi"
                                name="profession_start_date"
                                value={values.profession_start_date}
                                onChange={(e) => setFieldValue('profession_start_date', e.target.value)}
                                isInvalid={touched.profession_start_date && !!errors.profession_start_date}
                                errorMessage={touched.profession_start_date ? errors.profession_start_date : undefined}
                              />
                            </Col>
                          </Row>

                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="identity_no"
                              label="Kimlik No"
                              name="identity_no"
                              type="text"
                            />
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="nationality"
                              label="Uyruk"
                              name="nationality"
                              type="text"
                            />
                          </Row>

                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="mother_name"
                              label="Annesi"
                              name="mother_name"
                              type="text"
                            />
                            <FormTextField
                              as={Col}
                              md={6}
                              controlId="father_name"
                              label="Babası"
                              name="father_name"
                              type="text"
                            />
                          </Row>

                          <Row className="mb-4">
                            <Col md={12}>
                              <div className="section-divider">
                                <h6 className="section-title">Acil Durum İletişim</h6>
                              </div>
                            </Col>
                          </Row>

                          <Row className="mb-4">
                            <FormTextField
                              as={Col}
                              md={4}
                              controlId="emergency_contact_name"
                              label="Ad Soyad"
                              name="emergency_contact_name"
                              type="text"
                            />
                            <FormTextField
                              as={Col}
                              md={4}
                              controlId="emergency_contact"
                              label="Telefon No"
                              name="emergency_contact"
                              type="tel"
                              mask="(999) 999 9999"
                              maskChar=""
                            />
                            <FormSelectField
                              as={Col}
                              md={4}
                              controlId="emergency_contact_relation"
                              label="İlişkisi"
                              name="emergency_contact_relation"
                            >
                              <>
                                <option value="">Seçiniz</option>
                                {emergencyContactRelationOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </>
                            </FormSelectField>
                          </Row>

                          <Row className="mt-6">
                            <Col md={12}>
                              <Button
                                variant="primary"
                                type="submit"
                                disabled={formIsSubmitting}
                              >
                                Kaydet
                              </Button>
                            </Col>
                          </Row>
                        </FormikForm>
                      )}
                    </Formik>
                  </div>
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