import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { workInformationService, CreateWorkInformationRequest, lookupService } from '@/services';
import { CompanyLookup, DepartmentLookup, JobPositionLookup } from '@/services/lookup.service';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';

interface WorkInformationModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  employeeId: number;
  workInformation?: any | null;
  isEdit?: boolean;
}

interface FormData {
  employee_id: number;
  company_id: string;
  department_id: string;
  job_position_id: string;
  start_date: string;
  end_date: string;
  personnel_no: string;
  work_email: string;
}

const WorkInformationModal: React.FC<WorkInformationModalProps> = ({
  show,
  onHide,
  onSave,
  employeeId,
  workInformation = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    employee_id: employeeId,
    company_id: '',
    department_id: '',
    job_position_id: '',
    start_date: '',
    end_date: '',
    personnel_no: '',
    work_email: ''
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPositionLookup[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);

  // Lookups'ı yükle
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const [companiesRes, departmentsRes, jobPositionsRes] = await Promise.all([
          lookupService.getCompaniesLookup(),
          lookupService.getDepartmentsLookup(),
          lookupService.getJobPositionsLookup()
        ]);

        if (companiesRes.success && companiesRes.data) {
          setCompanies(companiesRes.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setAllDepartments(departmentsRes.data);
          // Başlangıçta departman combosu boş olsun
          setDepartments([]);
        }
        if (jobPositionsRes.success && jobPositionsRes.data) {
          setJobPositions(jobPositionsRes.data);
        }
      } catch (error) {
        console.error('Lookups yüklenirken hata:', error);
      } finally {
        setLoadingLookups(false);
      }
    };

    if (show) {
      fetchLookups();
    }
  }, [show]);

  // Şirket değiştiğinde departmanları filtrele
  useEffect(() => {
    if (formData.company_id) {
      const loadDepartmentsByCompany = async () => {
        try {
          const response = await lookupService.getDepartmentsByCompanyLookup(parseInt(formData.company_id));
          if (response.success && response.data) {
            setDepartments(response.data);
          }
        } catch (error) {
          console.error('Departmanlar yüklenirken hata:', error);
          setDepartments(allDepartments.filter((dept: any) => 
            dept.company_id && String(dept.company_id) === formData.company_id
          ));
        }
      };
      
      loadDepartmentsByCompany();
      
      // Yeni ekleme modunda şirket değişirse, departmanı sıfırla
      if (!isEdit) {
        setFormData(prev => ({
          ...prev,
          department_id: ''
        }));
      }
    } else {
      setDepartments([]);
    }
  }, [formData.company_id, allDepartments, isEdit]);

  // Form verilerini set et ve edit modda departmanları yükle
  useEffect(() => {
    if (isEdit && workInformation) {
      console.log('Setting form data from workInformation:', workInformation);
      
      // workInformation nested object'ten ya da direkt ID'den gelebilir
      const companyId = workInformation.company_id || workInformation.company?.id;
      const departmentId = workInformation.department_id || workInformation.department?.id;
      const jobPositionId = workInformation.job_position_id || workInformation.job_position?.id;
      
      console.log('Extracted IDs - Company:', companyId, 'Department:', departmentId, 'JobPosition:', jobPositionId);
      
      setFormData({
        employee_id: workInformation.employee_id || employeeId,
        company_id: companyId ? String(companyId) : '',
        department_id: departmentId ? String(departmentId) : '',
        job_position_id: jobPositionId ? String(jobPositionId) : '',
        start_date: workInformation.start_date ? workInformation.start_date.split('T')[0] : '',
        end_date: workInformation.end_date ? workInformation.end_date.split('T')[0] : '',
        personnel_no: workInformation.personnel_no || '',
        work_email: workInformation.work_email || ''
      });

      // Edit modda şirkete ait departmanları yükle
      if (companyId) {
        const loadDepartmentsByCompany = async () => {
          try {
            const response = await lookupService.getDepartmentsByCompanyLookup(parseInt(companyId));
            if (response.success && response.data) {
              setDepartments(response.data);
            }
          } catch (error) {
            console.error('Departmanlar yüklenirken hata:', error);
            setDepartments(allDepartments.filter((dept: any) => 
              dept.company_id && String(dept.company_id) === String(companyId)
            ));
          }
        };
        loadDepartmentsByCompany();
      }
    } else {
      setFormData({
        employee_id: employeeId,
        company_id: '',
        department_id: '',
        job_position_id: '',
        start_date: '',
        end_date: '',
        personnel_no: '',
        work_email: ''
      });
      setDepartments([]);
    }
    setFieldErrors({});
  }, [show, workInformation, isEdit, employeeId, allDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
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

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.company_id) {
      errors.company_id = 'Şirket zorunludur';
    }
    if (!formData.department_id) {
      errors.department_id = 'Departman zorunludur';
    }
    if (!formData.job_position_id) {
      errors.job_position_id = 'Pozisyon zorunludur';
    }
    if (!formData.start_date) {
      errors.start_date = 'Başlama tarihi zorunludur';
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
      const submitData: CreateWorkInformationRequest = {
        employee_id: formData.employee_id,
        company_id: parseInt(formData.company_id),
        department_id: parseInt(formData.department_id),
        job_position_id: parseInt(formData.job_position_id),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        personnel_no: formData.personnel_no || undefined,
        work_email: formData.work_email || undefined
      };

      if (isEdit && workInformation) {
        await workInformationService.updateWorkInformation(workInformation.id, submitData);
        toast.success('İş bilgisi başarıyla güncellendi');
      } else {
        await workInformationService.createWorkInformation(submitData);
        toast.success('İş bilgisi başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
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
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />

        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? 'İş Bilgisi Düzenle' : 'Yeni İş Bilgisi'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Şirket <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.company_id}
                    disabled={loadingLookups}
                    size="sm"
                  >
                    <option value="">Şirket seçiniz</option>
                    {companies.map((company) => (
                      <option key={company.id} value={String(company.id)}>
                        {company.name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.company_id && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.company_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Departman <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.department_id}
                    disabled={loadingLookups}
                    size="sm"
                  >
                    <option value="">Departman seçiniz</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.department_id && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.department_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Pozisyon <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="job_position_id"
                    value={formData.job_position_id}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.job_position_id}
                    disabled={loadingLookups}
                    size="sm"
                  >
                    <option value="">Pozisyon seçiniz</option>
                    {jobPositions.map((position) => (
                      <option key={position.id} value={String(position.id)}>
                        {position.title}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.job_position_id && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.job_position_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <FormDateField
                  label="Başlama Tarihi"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  isInvalid={!!fieldErrors.start_date}
                  errorMessage={fieldErrors.start_date}
                />
              </Col>
              <Col md={6}>
                <FormDateField
                  label="Bitiş Tarihi"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Sicil No</Form.Label>
                  <Form.Control
                    type="text"
                    name="personnel_no"
                    value={formData.personnel_no}
                    onChange={handleInputChange}
                    placeholder="Sicil No giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>İş E-postası</Form.Label>
                  <Form.Control
                    type="email"
                    name="work_email"
                    value={formData.work_email}
                    onChange={handleInputChange}
                    placeholder="E-posta giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading || loadingLookups}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading || loadingLookups}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default WorkInformationModal;
