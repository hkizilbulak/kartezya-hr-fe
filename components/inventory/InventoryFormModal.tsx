import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import BarcodeScannerModal from '@/components/modals/BarcodeScannerModal';
import { Camera, CheckCircle } from 'react-feather';

interface InventoryFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  employeeId?: string;
  item?: InventoryItem | null;
  isEmployeeView?: boolean;
}

const InventoryFormModal: React.FC<InventoryFormModalProps> = ({
  show,
  onHide,
  onSuccess,
  employeeId,
  item,
  isEmployeeView
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [uploadedPhotoId, setUploadedPhotoId] = useState<string | null>(null);
  const [scannedFileName, setScannedFileName] = useState<string | null>(null);
  const [isManualInput, setIsManualInput] = useState(!!item);
  
  const [formData, setFormData] = useState({
    device_type: item?.device_type || '',
    brand: item?.brand || '',
    model: item?.model || '',
    serial_number: item?.serial_number || '',
    status: item?.status || InventoryItemStatus.IN_USE,
    assignment_date: item?.assignment_date ? item.assignment_date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: item?.notes || '',
    specifications: item?.specifications || {},
  });

  useEffect(() => {
    if (show) {
      setFormData({
        device_type: item?.device_type || '',
        brand: item?.brand || '',
        model: item?.model || '',
        serial_number: item?.serial_number || '',
        status: item?.status || InventoryItemStatus.IN_USE,
        assignment_date: item?.assignment_date ? item.assignment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: item?.notes || '',
        specifications: item?.specifications || {},
      });
      setIsManualInput(!!item);
      setErrors({});
      setUploadedPhotoId(null);
      setScannedFileName(null);
      setShowScanner(false);
    }
  }, [show, item]);

  const handleClose = () => {
    setShowScanner(false);
    setIsManualInput(!!item);
    setScannedFileName(null);
    setUploadedPhotoId(null);
    onHide();
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(e.target.name, e.target.value);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.device_type) newErrors.device_type = 'Cihaz türü zorunludur';
    if (!formData.brand) newErrors.brand = 'Marka zorunludur';
    if (!formData.model) newErrors.model = 'Model zorunludur';
    if (!formData.serial_number) newErrors.serial_number = 'Seri numarası zorunludur';
    if (!formData.status) newErrors.status = 'Durum zorunludur';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        employee_id: employeeId || undefined,
        document_id: uploadedPhotoId || null,
      };

      if (item?.id) {
        if (employeeId) {
           await inventoryService.updateMyItem(item.id, payload);
        } else {
           await inventoryService.updateMyItem(item.id, payload);
        }
        toast.success('Cihaz başarıyla güncellendi');
      } else {
        if (employeeId) {
          await inventoryService.createEmployeeInventory(employeeId, payload);
        } else {
          await inventoryService.createMyItem(payload);
        }
        toast.success('Cihaz başarıyla eklendi');
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(translateErrorMessage(error?.response?.data?.error || 'İşlem başarısız'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSuccess = (result: {
    serialNumber: string;
    brand: string;
    model: string;
    deviceType: string;
    documentId?: string;
    fileName?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      serial_number: result.serialNumber,
      brand: result.brand || prev.brand,
      model: result.model || prev.model,
      device_type: result.deviceType || prev.device_type,
    }));
    
    if (result.documentId) {
      setUploadedPhotoId(result.documentId);
    }
    if (result.fileName) {
      setScannedFileName(result.fileName);
    }
    setIsManualInput(true); // Automatically show brand/model details when scanned successfully
  };

  const hideStatusField = isEmployeeView;

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{item ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {!isManualInput ? (
            <div className="text-center py-5 my-3 border border-2 border-dashed rounded-3 bg-light px-4">
              <div className="icon-shape bg-light-primary text-primary rounded-circle p-3 d-inline-flex mb-3" style={{ fontSize: '2rem' }}>
                <Camera size={36} className="text-primary" />
              </div>
              <h5 className="text-dark fw-bold mb-2">Cihaz Ekleme Yöntemi</h5>
              <p className="text-muted mb-4 small mx-auto" style={{ maxWidth: '420px' }}>
                Cihazınızı hızlıca kaydetmek için barkod etiketini kamerayla okutabilir/fotoğraf yükleyebilir veya bilgileri kendiniz girmek için manuel girişi seçebilirsiniz.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Button
                  variant="primary"
                  onClick={() => setShowScanner(true)}
                  className="d-flex align-items-center gap-2 px-4 py-2.5 fw-semibold"
                >
                  <Camera size={18} />
                  <span>Barkod Okut / Fotoğraf Seç</span>
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setIsManualInput(true)}
                  className="px-4 py-2.5 fw-semibold"
                >
                  Manuel Giriş Yap
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!item && (
                <Button
                  variant="link"
                  className="p-0 mb-3 text-decoration-none small d-flex align-items-center gap-1 text-secondary"
                  onClick={() => {
                    setIsManualInput(false);
                    setScannedFileName(null);
                    setUploadedPhotoId(null);
                  }}
                >
                  &larr; Giriş Seçeneklerine Dön
                </Button>
              )}

              {/* Row 1: Cihaz Türü & Seri No (Side-by-side) */}
              <Row>
                <Col md={6}>
                  <FormSelectField
                    name="device_type"
                    label="Cihaz Türü *"
                    value={formData.device_type}
                    onChange={handleSelectChange}
                    error={errors.device_type}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Laptop">Laptop / Bilgisayar</option>
                    <option value="Monitor">Monitör</option>
                    <option value="Phone">Cep Telefonu</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Keyboard">Klavye</option>
                    <option value="Other">Diğer</option>
                  </FormSelectField>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="serial_number">
                    <Form.Label>Seri No *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        name="serial_number"
                        value={formData.serial_number}
                        onChange={handleSelectChange}
                        disabled={isEmployeeView && !!item}
                        isInvalid={!!errors.serial_number}
                        placeholder="Seri no girin veya taratın"
                      />
                      <Button
                        variant="outline-primary"
                        type="button"
                        onClick={() => setShowScanner(true)}
                        disabled={isEmployeeView && !!item}
                        title="Kameradan Tarat veya Fotoğraf Yükle"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Camera size={16} />
                      </Button>
                      {errors.serial_number && (
                        <Form.Control.Feedback type="invalid">
                          {errors.serial_number}
                        </Form.Control.Feedback>
                      )}
                    </InputGroup>
                    {scannedFileName && (
                      <div className="text-success small mt-1 d-flex align-items-center gap-1">
                        <CheckCircle size={12} />
                        <span>Fotoğraf hazır: {scannedFileName}</span>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 2: Marka & Model (Side-by-side) */}
              <Row>
                <Col md={6}>
                  <FormTextField
                    controlId="brand"
                    name="brand"
                    label="Marka *"
                    value={formData.brand}
                    onChange={handleChange}
                    error={errors.brand}
                  />
                </Col>
                <Col md={6}>
                  <FormTextField
                    controlId="model"
                    name="model"
                    label="Model *"
                    value={formData.model}
                    onChange={handleChange}
                    error={errors.model}
                  />
                </Col>
              </Row>

              {/* Row 3: Zimmet Tarihi & Durum (Always visible in form mode) */}
              <Row>
                <Col md={hideStatusField ? 12 : 6}>
                  <FormDateField
                    name="assignment_date"
                    label="Zimmet Tarihi"
                    value={formData.assignment_date}
                    onChange={handleSelectChange}
                    error={errors.assignment_date}
                    disabled={isEmployeeView && !!item}
                  />
                </Col>
                {!hideStatusField && (
                  <Col md={6}>
                    <FormSelectField
                      name="status"
                      label="Durum *"
                      value={formData.status}
                      onChange={handleSelectChange}
                      error={errors.status}
                    >
                      <option value={InventoryItemStatus.IN_USE}>Kullanımda</option>
                      <option value={InventoryItemStatus.IN_STOCK}>Stokta</option>
                      <option value={InventoryItemStatus.DAMAGED}>Arızalı</option>
                      <option value={InventoryItemStatus.RETURNED}>İade Edildi</option>
                    </FormSelectField>
                  </Col>
                )}
              </Row>

              {/* Row 4: Notes (Always visible in form mode) */}
              <Row>
                <Col md={12}>
                  <FormTextField
                    controlId="notes"
                    name="notes"
                    label="Notlar"
                    type="textarea"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !isManualInput}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
      {showScanner && (
        <BarcodeScannerModal
          show={showScanner}
          onHide={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </>
  );
};

export default InventoryFormModal;
