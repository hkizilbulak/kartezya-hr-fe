import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { documentService } from '@/services/document.service';
import { Image as ImageIcon } from 'react-feather';

interface InventoryDetailModalProps {
  show: boolean;
  onHide: () => void;
  item: InventoryItem | null;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ show, onHide, item }) => {
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (show && item?.id) {
      const fetchPhotos = async () => {
        setLoadingDocs(true);
        setPhotoUrls([]);
        try {
          const res = await documentService.getRelatedDocuments(8, Number(item.id));
          if (res && res.data && res.data.length > 0) {
            const urls: string[] = [];
            for (const doc of res.data) {
              if (doc.content_type.startsWith('image/')) {
                const downloadRes = await documentService.getDownloadUrl(doc.id);
                if (downloadRes && downloadRes.success && downloadRes.data?.url) {
                  urls.push(downloadRes.data.url);
                }
              }
            }
            setPhotoUrls(urls);
          }
        } catch (err) {
          console.error('Failed to load device photos:', err);
        } finally {
          setLoadingDocs(false);
        }
      };
      fetchPhotos();
    } else {
      setPhotoUrls([]);
    }
  }, [show, item]);

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
          <div className="fw-medium mb-3" style={{ whiteSpace: 'pre-wrap' }}>
            {item.notes || '-'}
          </div>
        </div>

        {loadingDocs ? (
          <div className="d-flex align-items-center gap-2 mb-2 border-top pt-3">
            <Spinner animation="border" size="sm" variant="primary" />
            <span className="text-muted small">Cihaz fotoğrafları yükleniyor...</span>
          </div>
        ) : photoUrls.length > 0 ? (
          <div className="mb-2 border-top pt-3">
            <div className="text-muted small mb-2 d-flex align-items-center gap-1">
              <ImageIcon size={14} className="text-primary" />
              <span className="fw-semibold">Cihaz Fotoğrafı</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="Büyütmek için tıklayın">
                  <img
                    src={url}
                    alt="Cihaz Resmi"
                    className="img-thumbnail"
                    style={{ width: '100%', maxWidth: '280px', maxHeight: '180px', objectFit: 'contain', cursor: 'pointer', borderRadius: '8px' }}
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Kapat</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InventoryDetailModal;
