import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Contract, ContractRequest, ContractStatus } from '@/models/hr/contract';
import { contractService } from '@/services';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import MultiSelectField from '@/components/MultiSelectField';
import { lookupService, DepartmentLookup, CompanyLookup } from '@/services/lookup.service';
import { employeeService } from '@/services/employee.service';
import { employeeContractService } from '@/services/employee-contract.service';
import { Employee } from '@/models/hr/hr-models';

interface ContractModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  contract?: Contract | null;
  isEdit?: boolean;
  companies?: CompanyLookup[];
}

const ContractModal: React.FC<ContractModalProps> = ({
  show,
  onHide,
  onSave,
  contract = null,
  isEdit = false,
  companies = []
}) => {
  const [formData, setFormData] = useState<ContractRequest>({
    customer_contact_name: '',
    customer_contact_phone: '',
    customer_contact_email: '',
    project_name: '',
    contract_no: '',
    start_date: '',
    end_date: '',
    status: ContractStatus.PendingProposal
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
          const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  useEffect(() => {
    if (selectedCompany) {
      setDepartments([]);
      setSelectedDepartment('');
      setEmployees([]);
      setSelectedEmployees([]);
      setLoading(true);
      lookupService.getDepartmentsByCompanyLookup(parseInt(selectedCompany))
        .then(res => {
          setDepartments(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        })
        .catch(err => console.error('fetch departments failed', err))
        .finally(() => setLoading(false));
    } else {
      setDepartments([]);
      setEmployees([]);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedDepartment && selectedCompany) {
      setEmployees([]);
      setLoading(true);
      employeeService.getAll({ limit: 1000, status: 'ACTIVE', department_id: selectedDepartment, company_id: selectedCompany } as any)
        .then(res => {
          setEmployees(res?.data || []);
        })
        .catch(err => console.error('fetch employees failed', err))
        .finally(() => setLoading(false));
    } else {
      setEmployees([]);
    }
  }, [selectedDepartment, selectedCompany]);

  
  
  useEffect(() => {
    if (show) {
      if (!selectedCompany) {
        setDepartments([]);
        setEmployees([]);
      }
    }
  }, [show]);

  useEffect(() => {
    if (isEdit && contract) {
      setFormData({
        customer_contact_name: contract.customer_contact_name || '',
        customer_contact_phone: contract.customer_contact_phone || '',
        customer_contact_email: contract.customer_contact_email || '',
        project_name: contract.project_name || '',
        contract_no: contract.contract_no || '',
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        status: contract.status || ContractStatus.PendingProposal
      });
      
    } else {
      setFormData({
        customer_contact_name: '',
        customer_contact_phone: '',
        customer_contact_email: '',
        project_name: '',
        contract_no: '',
        start_date: '',
        end_date: '',
        status: ContractStatus.PendingProposal
      });
      setSelectedEmployees([]);
      setSelectedDepartment('');
      setSelectedCompany('');
      setSelectedCompany('');
    }
    setFieldErrors({});
  }, [show, contract, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    let contractId = contract?.id;

    try {
      if (isEdit && contract) {
        await contractService.update(contract.id, formData);
      } else {
        const res = await contractService.create(formData);
        contractId = res.data?.id;
      }
      
      if (contractId && selectedEmployees.length > 0) {
        let successCount = 0;
        for (const empIdStr of selectedEmployees) {
          try {
            await employeeContractService.create({
              employee_id: parseInt(empIdStr),
              contract_id: contractId
            });
            successCount++;
          } catch(err) {
            // Probably already assigned, ignore silently
          }
        }
        if (successCount > 0) {
          toast.success(`${successCount} çalışan başarıyla sözleşmeye eklendi.`);
        }
      }
      
      onSave();
      onHide();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setFieldErrors(error.response.data.errors);
      } else {
        toast.error(translateErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Employees array length:", employees?.length);
    console.log("Departments array length:", departments?.length);
  }, [employees, departments]);

  
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Yükleniyor..." />
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Sözleşmeyi Düzenle' : 'Yeni Ana Sözleşme'}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Sözleşme No *</Form.Label>
                  <Form.Control
                    type="text"
                    name="contract_no"
                    value={formData.contract_no}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.contract_no}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Proje Adı *</Form.Label>
                  <Form.Control
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.project_name}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Müşteri Yetkili *</Form.Label>
                  <Form.Control
                    type="text"
                    name="customer_contact_name"
                    value={formData.customer_contact_name}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.customer_contact_name}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="text"
                    name="customer_contact_phone"
                    value={formData.customer_contact_phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="customer_contact_email"
                    value={formData.customer_contact_email}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <FormDateField
                  label="Başlangıç Tarihi"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col md={4}>
                <FormDateField
                  label="Bitiş Tarihi"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                />
              </Col>
              <Col md={4}>
                <FormSelectField
                  label="Durum"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleInputChange}
                >
                  <option value={ContractStatus.PendingProposal}>Teklif Bekliyor</option>
                  <option value={ContractStatus.Approved}>Onaylandı</option>
                  <option value={ContractStatus.Active}>Aktif</option>
                  <option value={ContractStatus.Completed}>Tamamlandı</option>
                  <option value={ContractStatus.Rejected}>Reddedildi</option>
                  <option value={ContractStatus.Cancelled}>İptal Edildi</option>
                </FormSelectField>
              </Col>
            </Row>

                        <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Şirket Filtresi</Form.Label>
                  <Form.Select
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedDepartment(''); // reset department when company changes
                    }}
                    disabled={loading}
                    className="mb-3"
                  >
                    <option value="">Tüm Şirketler</option>
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Departman Filtresi</Form.Label>
                  <Form.Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={loading || (!selectedCompany && companies.length > 0)}
                    className="mb-3"
                  >
                    <option value="">{selectedCompany ? 'Tüm Departmanlar' : 'Önce Şirket Seçiniz'}</option>
                    {departments
                      .map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Label>Sözleşmeye Eklenecek Çalışanlar</Form.Label>
                <div className="d-flex align-items-stretch" style={{ height: '300px', gap: '15px' }}>
                  {/* Left Panel: Available Employees */}
                  <div className="border rounded d-flex flex-column flex-grow-1" style={{ flexBasis: '45%' }}>
                    <div className="bg-light border-bottom p-2 fw-bold text-center">Tüm Çalışanlar</div>
                    <div className="overflow-auto p-2" style={{ flex: 1 }}>
                      {employees
                        .filter(emp => !selectedEmployees.includes(emp.id.toString()))
                        .filter(emp => !selectedDepartment || emp.work_information?.department_name === departments.find(d => d.id.toString() === selectedDepartment)?.name)
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
                        <div className="text-muted text-center mt-3">Seçilecek çalışan kalmadı</div>
                      )}
                    </div>
                  </div>

                  {/* Middle arrows */}
                  <div className="d-flex flex-column justify-content-center">
                    <Button variant="outline-secondary" size="sm" className="mb-2" onClick={(e) => { e.preventDefault(); setSelectedEmployees(employees.filter(emp => !selectedDepartment || emp.work_information?.department_name === departments.find(d => d.id.toString() === selectedDepartment)?.name).map(e => e.id.toString())); }}>&gt;&gt;</Button>
                    <Button variant="outline-secondary" size="sm" onClick={(e) => { e.preventDefault(); setSelectedEmployees([]); }}>&lt;&lt;</Button>
                  </div>

                  {/* Right Panel: Selected Employees */}
                  <div className="border rounded d-flex flex-column flex-grow-1" style={{ flexBasis: '45%', borderColor: 'var(--bs-primary) !important' }}>
                    <div className="bg-primary text-white border-bottom p-2 fw-bold text-center rounded-top">Seçili Çalışanlar ({selectedEmployees.length})</div>
                    <div className="overflow-auto p-2" style={{ flex: 1 }}>
                      {employees
                        .filter(emp => selectedEmployees.includes(emp.id.toString()))
                        .map(emp => (
                          <div 
                            key={'sel-'+emp.id}
                            className="p-2 border-bottom cursor-pointer d-flex justify-content-between align-items-center"
                            onClick={() => setSelectedEmployees(prev => prev.filter(id => id !== emp.id.toString()))}
                            style={{ cursor: 'pointer' }}
                            title="Kaldır"
                          >
                            <span>{emp.first_name} {emp.last_name}</span>
                            <span className="text-danger fw-bold">-</span>
                          </div>
                      ))}
                      {selectedEmployees.length === 0 && (
                        <div className="text-muted text-center mt-3">Henüz seçilen kimse yok</div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>Kaydet</Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default ContractModal;