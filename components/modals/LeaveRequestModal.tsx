import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { LeaveRequest } from '@/models/hr/common.types';
import { leaveRequestService } from '@/services/leave-request.service';
import { leaveTypeService } from '@/services/leave-type.service';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
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
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    if (show) {
      fetchLeaveTypes();
    }
  }, [show]);

  useEffect(() => {
    if (isEdit && leaveRequest && leaveTypes.length > 0) {
      // Edit modunda form'u doldur
      const leaveTypeId = (leaveRequest.leave_type_id || leaveRequest.leaveTypeId || leaveRequest.leave_type?.id)?.toString() || '';
      
      const startDate = (leaveRequest.start_date || leaveRequest.startDate)?.split('T')[0] || '';
      const endDate = (leaveRequest.end_date || leaveRequest.endDate)?.split('T')[0] || '';
      
      setFormData({
        leaveTypeId: leaveTypeId,
        startDate: startDate,
        endDate: endDate,
        reason: leaveRequest.reason || ''
      });
    } else if (!isEdit) {
      // Create modunda form'u sıfırla ve günün tarihini set et
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      setFormData({
        leaveTypeId: '',
        startDate: todayString,
        endDate: todayString,
        reason: ''
      });
      
      // Calculate working days for today dynamically
      const calculateTodayDays = async () => {
        try {
          const response = await leaveRequestService.calculateWorkingDays(
            todayString + 'T00:00:00Z',
            todayString + 'T00:00:00Z'
          );
          if (response.data && response.data.working_days !== undefined) {
            setCalculatedDays(response.data.working_days);
          }
        } catch (error) {
          // Fallback to client-side calculation if backend fails
          setCalculatedDays(1);
        }
      };
      
      calculateTodayDays();
    }
    setFieldErrors({});
  }, [show, leaveRequest, isEdit, leaveTypes]);

  // Gün sayısını hesapla
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const calculateDays = async () => {
        try {
          const response = await leaveRequestService.calculateWorkingDays(
            formData.startDate + 'T00:00:00Z',
            formData.endDate + 'T00:00:00Z'
          );
          if (response.data && response.data.working_days !== undefined) {
            setCalculatedDays(response.data.working_days);
          }
        } catch (error) {
          // Fallback to client-side calculation if backend fails
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          
          if (startDate <= endDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            setCalculatedDays(daysDiff);
          }
        }
      };
      
      calculateDays();
    }
  }, [formData.startDate, formData.endDate]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypeService.getLookup();
      const types = response.data || [];
      setLeaveTypes(types);
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast.error('İzin türleri yüklenemedi');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Tarih aralığı doğrulaması
    if (name === 'startDate' && formData.endDate) {
      const startDate = new Date(value);
      const endDate = new Date(formData.endDate);
      
      // Eğer başlangıç tarihi bitiş tarihinden sonraysa, bitiş tarihini başlangıç tarihine eşitle
      if (startDate > endDate) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          endDate: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'endDate' && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(value);
      
      // Eğer bitiş tarihi başlangıç tarihinden önceyse, başlangıç tarihini bitiş tarihine eşitle
      if (endDate < startDate) {
        setFormData(prev => ({
          ...prev,
          startDate: value,
          [name]: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.leaveTypeId.trim()) {
      errors['leaveTypeId'] = 'İzin türü seçiniz';
    }
    if (!formData.startDate.trim()) {
      errors['startDate'] = 'Başlangıç tarihi seçiniz';
    }
    if (!formData.endDate.trim()) {
      errors['endDate'] = 'Bitiş tarihi seçiniz';
    }

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

      // Parse dates as UTC to avoid timezone issues
      const [startYear, startMonth, startDay] = formData.startDate.split('-');
      const startDate = new Date(Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay)));
      
      const [endYear, endMonth, endDay] = formData.endDate.split('-');
      const endDate = new Date(Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay)));

      const submitData = {
        leave_type_id: parseInt(formData.leaveTypeId),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason: formData.reason.trim() || undefined,
      };

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
              {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Talep Oluştur'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default LeaveRequestModal;