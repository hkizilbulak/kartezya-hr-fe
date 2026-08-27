import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';

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
      const payload = {
        ...formData,
        employee_id: employeeId || undefined,
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

  const hideStatusField = isEmployeeView;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{item ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={hideStatusField ? 12 : 6}>
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

          <Row>
            <Col md={6}>
              <FormTextField
                controlId="serial_number"
                name="serial_number"
                label="Seri No *"
                value={formData.serial_number}
                onChange={handleChange}
                error={errors.serial_number}
                disabled={isEmployeeView && !!item}
              />
            </Col>
            <Col md={6}>
              <FormDateField
                name="assignment_date"
                label="Zimmet Tarihi"
                value={formData.assignment_date}
                onChange={handleSelectChange}
                error={errors.assignment_date}
                disabled={isEmployeeView && !!item}
              />
            </Col>
          </Row>

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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            İptal
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InventoryFormModal;
