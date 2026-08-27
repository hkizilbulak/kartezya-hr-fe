import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';

interface InventoryDetailModalProps {
  show: boolean;
  onHide: () => void;
  item: InventoryItem | null;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ show, onHide, item }) => {
  if (!item) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case InventoryItemStatus.IN_USE: return 'success';
      case InventoryItemStatus.IN_STOCK: return 'info';
      case InventoryItemStatus.DAMAGED: return 'danger';
      case InventoryItemStatus.RETURNED: return 'secondary';
      default: return 'primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case InventoryItemStatus.IN_USE: return 'Kullanımda';
      case InventoryItemStatus.IN_STOCK: return 'Stokta';
      case InventoryItemStatus.DAMAGED: return 'Arızalı';
      case InventoryItemStatus.RETURNED: return 'İade Edildi';
      default: return status;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cihaz Detayları</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <div className="text-muted small mb-1">Cihaz Türü</div>
          <div className="fw-medium">{item.device_type}</div>
        </div>
        
        <Row className="mb-4">
          <Col md={6}>
            <div className="text-muted small mb-1">Marka</div>
            <div className="fw-medium">{item.brand}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted small mb-1">Model</div>
            <div className="fw-medium">{item.model}</div>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6}>
            <div className="text-muted small mb-1">Seri No</div>
            <div className="fw-medium">{item.serial_number || '-'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted small mb-1">Durum</div>
            <div>
              <Badge bg={getStatusBadgeVariant(item.status)}>
                {getStatusText(item.status)}
              </Badge>
            </div>
          </Col>
        </Row>

        <div className="mb-4">
          <div className="text-muted small mb-1">Zimmet Tarihi</div>
          <div className="fw-medium">
            {item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-'}
          </div>
        </div>

        <div>
          <div className="text-muted small mb-1">Notlar</div>
          <div className="fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
            {item.notes || '-'}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Kapat</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InventoryDetailModal;
