'use client'
import { useState, useEffect } from 'react';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/models/hr/common.types';
import styles from './profile.module.scss';
import { Container, Row, Col, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { PageHeading } from '@/widgets';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions } from '@/contants/options';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  first_name: Yup.string().required('Adı zorunludur'),
  last_name: Yup.string().required('Soyadı zorunludur'),
  email: Yup.string(),
  company_email: Yup.string(),
  phone: Yup.string(),
  address: Yup.string(),
  state: Yup.string(),
  city: Yup.string(),
  gender: Yup.string(),
  date_of_birth: Yup.string(),
  hire_date: Yup.string(),
  total_experience: Yup.number(),
  marital_status: Yup.string(),
  emergency_contact: Yup.string(),
  emergency_contact_name: Yup.string(),
  emergency_contact_relation: Yup.string()
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
        total_experience: values.total_experience || 0,
        marital_status: values.marital_status || '',
        emergency_contact: values.emergency_contact || '',
        emergency_contact_name: values.emergency_contact_name || '',
        emergency_contact_relation: values.emergency_contact_relation || ''
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
    total_experience: employee.total_experience || 0,
    marital_status: employee.marital_status || '',
    emergency_contact: employee.emergency_contact || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_relation: employee.emergency_contact_relation || ''
  };

  return (
    <Container fluid className="ps-6 pe-6 pt-6 pb-6">
      {/* Page Heading - Sadece başlık, buton yok */}
      <div className="mb-6">
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

      {/* Profile Form Card */}
      <Card className={styles.profileFormCard}>
        <Card.Body className={styles.cardBody}>
          <div className="position-relative">
            <LoadingOverlay show={isSubmitting} message="Kaydediliyor..." />

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting: formIsSubmitting, values, setFieldValue }) => (
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
                      controlId="state"
                      label="İl"
                      name="state"
                      type="text"
                    />
                    <FormTextField
                      as={Col}
                      md={6}
                      controlId="city"
                      label="İlçe"
                      name="city"
                      type="text"
                    />
                  </Row>

                  {/* Date Section */}
                  <Row className="mb-4">
                    <FormTextField
                      as={Col}
                      md={6}
                      controlId="date_of_birth"
                      label="Doğum Tarihi"
                      name="date_of_birth"
                      type="date"
                    />
                    <FormTextField
                      as={Col}
                      md={6}
                      controlId="hire_date"
                      label="İşe Giriş Tarihi"
                      name="hire_date"
                      type="date"
                      disabled
                    />
                  </Row>

                  {/* Experience and Marital Status Section */}
                  <Row className="mb-4">
                    <FormTextField
                      as={Col}
                      md={6}
                      controlId="total_experience"
                      label="Toplam Deneyim (Yıl)"
                      name="total_experience"
                      type="number"
                    />
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

                  {/* Emergency Contact Section Title */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <div className={styles.sectionDivider}>
                        <h6 className={styles.sectionTitle}>Acil Durum İletişim</h6>
                      </div>
                    </Col>
                  </Row>

                  {/* Emergency Contact Fields */}
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

                  {/* Submit Buttons */}
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
    </Container>
  );
};

export default Profile;