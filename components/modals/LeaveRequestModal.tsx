import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { LeaveRequest, Employee } from '@/models/hr/common.types';
import { leaveRequestService } from '@/services/leave-request.service';
import { leaveTypeService, LeaveType } from '@/services/leave-type.service';
import { employeeService } from '@/services/employee.service';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';

interface LeaveRequestModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  leaveRequest?: LeaveRequest | null;
  isEdit?: boolean;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  show,
  onHide,
  onSave,
  leaveRequest = null,
  isEdit = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('admin');

  useEffect(() => {
    if (show) {
      fetchLeaveTypes();
      // Her zaman çalışanları yükle (admin veya non-admin edit için)
      fetchEmployees();
    }
  }, [show]);

  useEffect(() => {
    if (isEdit && leaveRequest && leaveTypes.length > 0 && employees.length > 0) {
      // Nested objelerden ID'leri çıkar
      const empId = (leaveRequest.employee_id || leaveRequest.employeeId || leaveRequest.employee?.id)?.toString() || '';
      const leaveTypeId = (leaveRequest.leave_type_id || leaveRequest.leaveTypeId || leaveRequest.leave_type?.id)?.toString() || '';
      
      console.log('Edit mode - Full leaveRequest object:', JSON.stringify(leaveRequest, null, 2));
      console.log('Edit mode - Loading data:', {
        leaveRequest,
        leaveTypes: leaveTypes.length,
        employees: employees.length,
        empId,
        leaveTypeId,
        employee_from_nested: leaveRequest.employee?.id,
        leave_type_from_nested: leaveRequest.leave_type?.id
      });
      
      setFormData({
        employeeId: empId,
        leaveTypeId: leaveTypeId,
        startDate: (leaveRequest.start_date || leaveRequest.startDate)?.split('T')[0] || '',
        endDate: (leaveRequest.end_date || leaveRequest.endDate)?.split('T')[0] || '',
        reason: leaveRequest.reason || ''
      });
    } else if (!isEdit) {
      setFormData({
        employeeId: isAdmin ? '' : user?.id?.toString() || '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: ''
      });
    }
    setFieldErrors({});
    setCalculatedDays(0);
  }, [show, leaveRequest, isEdit, user, isAdmin, leaveTypes, employees]);

  // Gün sayısını hesapla
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate <= endDate) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
        setCalculatedDays(daysDiff);
      }
    }
  }, [formData.startDate, formData.endDate]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypeService.getAll();
      const types = response.data || [];
      setLeaveTypes(types);
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast.error('İzin türleri yüklenemedi');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response: any = await employeeService.getAll();
      
      let emps: Employee[] = [];
      
      // Response formatını kontrol et
      if (Array.isArray(response)) {
        emps = response;
      } else if (response.data && Array.isArray(response.data)) {
        emps = response.data;
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        emps = response.data.items;
      }
      
      // Eğer hala boş ise ve data property varsa kontrol et
      if (emps.length === 0 && response?.data) {
        emps = Array.isArray(response.data) ? response.data : [];
      }
      
      setEmployees(emps);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Çalışanlar yüklenemedi');
    }
  };

  const getEmployeeName = (emp: Employee): string => {
    const firstName = emp.first_name || emp.firstName || '';
    const lastName = emp.last_name || emp.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    // ADMIN ise çalışan seçmeli
    if (isAdmin && !formData.employeeId.trim()) {
      errors['employeeId'] = 'Çalışan seçiniz';
    }

    // Zorunlu alanları kontrol et
    if (!formData.leaveTypeId.trim()) {
      errors['leaveTypeId'] = 'İzin türü seçiniz';
    }
    if (!formData.startDate.trim()) {
      errors['startDate'] = 'Başlangıç tarihi seçiniz';
    }
    if (!formData.endDate.trim()) {
      errors['endDate'] = 'Bitiş tarihi seçiniz';
    }

    // Tarih validasyonu
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate > endDate) {
        errors['endDate'] = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
      }
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
      // Seçilen izin türünü bul
      const selectedLeaveType = leaveTypes.find(t => t.id.toString() === formData.leaveTypeId);

      // Tarihleri düzeltme - sadece tarih kısmını al (saat bilgisini atla)
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const endDate = new Date(formData.endDate + 'T00:00:00');

      // employee_id'yi belirle
      let employeeId: number;
      if (isAdmin) {
        employeeId = parseInt(formData.employeeId);
      } else {
        employeeId = user?.id || 0;
      }

      const submitData = {
        employee_id: employeeId,
        leave_type_id: parseInt(formData.leaveTypeId),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason: formData.reason.trim() || undefined,
        is_paid: selectedLeaveType?.is_paid || false
      };

      console.log('Submitting leave request:', submitData);

      if (isEdit && leaveRequest) {
        await leaveRequestService.update(leaveRequest.id, submitData);
        toast.success('İzin talebi başarıyla güncellendi');
      } else {
        await leaveRequestService.create(submitData);
        toast.success('İzin talebi başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';

      if (error.response?.data?.message) {
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
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />

        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? 'İzin Talebini Düzenle' : 'Yeni İzin Talebi'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {isAdmin && (
              <Form.Group className="mb-3">
                <Form.Label>Çalışan <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors.employeeId}
                >
                  <option value="">Çalışan seçiniz</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {getEmployeeName(emp)}
                    </option>
                  ))}
                </Form.Select>
                {fieldErrors.employeeId && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                    {fieldErrors.employeeId}
                  </div>
                )}
              </Form.Group>
            )}

            {!isAdmin && isEdit && (
              <Form.Group className="mb-3">
                <Form.Label>Çalışan</Form.Label>
                <Form.Control
                  type="text"
                  value={getEmployeeName(employees.find(emp => emp.id.toString() === formData.employeeId) || {} as Employee)}
                  readOnly
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>İzin Türü <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="leaveTypeId"
                value={formData.leaveTypeId}
                onChange={handleInputChange}
                isInvalid={!!fieldErrors.leaveTypeId}
              >
                <option value="">İzin türü seçiniz</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name}
                  </option>
                ))}
              </Form.Select>
              {fieldErrors.leaveTypeId && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.leaveTypeId}
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç Tarihi <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.startDate}
                  />
                  {fieldErrors.startDate && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.startDate}
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş Tarihi <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.endDate}
                  />
                  {fieldErrors.endDate && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.endDate}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {calculatedDays > 0 && (
              <Alert variant="info" className="mb-3">
                <strong>Toplam Gün:</strong> {calculatedDays} gün
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Neden (İsteğe Bağlı)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="İzin talebinizin nedenini yazınız"
              />
            </Form.Group>
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

export default LeaveRequestModal;