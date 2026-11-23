import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Table } from 'react-bootstrap';
import { InventoryItem, InventoryItemStatus, InventoryAssignmentHistory } from '@/models/hr/hr-models';
import { documentService } from '@/services/document.service';
import { inventoryService } from '@/services/inventory.service';
import { Image as ImageIcon, Monitor, Calendar, Tag, Key, Info, Clock, User } from 'react-feather';

interface InventoryDetailModalProps {
  show: boolean;
  onHide: () => void;
  item: InventoryItem | null;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ show, onHide, item }) => {
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [histories, setHistories] = useState<InventoryAssignmentHistory[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);

  useEffect(() => {
    if (show && item?.id) {
      // 1. Load Photos in parallel
      const fetchPhotos = async () => {
        setLoadingDocs(true);
        setPhotoUrls([]);
        try {
          const res = await documentService.getRelatedDocuments(8, Number(item.id));
          if (res?.data && res.data.length > 0) {
            const imageDocs = res.data.filter((doc: any) => doc.content_type?.startsWith('image/'));
            const downloadPromises = imageDocs.map(async (doc: any) => {
              try {
                const downloadRes = await documentService.getDownloadUrl(doc.id);
                if (downloadRes?.success && downloadRes?.data?.url) {
                  return downloadRes.data.url;
                }
              } catch (e) {
                console.warn('Failed to load photo url for doc:', doc.id, e);
              }
              return null;
            });
            const resolvedUrls = await Promise.all(downloadPromises);
            setPhotoUrls(resolvedUrls.filter((u): u is string => u !== null));
          }
        } catch (err) {
          console.error('Failed to load device photos:', err);
        } finally {
          setLoadingDocs(false);
        }
      };

      // 2. Load Assignment History
      const fetchHistories = async () => {
        setLoadingHistories(true);
        try {
          const res = await inventoryService.getItemHistories(Number(item.id));
          if (res && res.data) {
            setHistories(res.data);
          } else if (item.histories) {
            setHistories(item.histories);
          } else {
            setHistories([]);
          }
        } catch (err) {
          console.error('Failed to load inventory histories:', err);
          if (item.histories) {
            setHistories(item.histories);
          } else {
            setHistories([]);
          }
        } finally {
          setLoadingHistories(false);
        }
      };

      fetchPhotos();
      fetchHistories();
    } else {
      setPhotoUrls([]);
      setHistories([]);
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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ASSIGNED': return <Badge bg="success">Zimmetlendi</Badge>;
      case 'RETURNED': return <Badge bg="secondary">İade Edildi</Badge>;
      case 'TRANSFERRED': return <Badge bg="info">Devredildi</Badge>;
      case 'DAMAGED': return <Badge bg="danger">Arızalandı</Badge>;
      default: return <Badge bg="light" text="dark">{action}</Badge>;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'laptop':
      case 'computer':
        return <Monitor size={22} className="text-primary animate-pulse" />;
      case 'monitor':
        return <Monitor size={22} className="text-primary" />;
      default:
        return <Tag size={22} className="text-primary" />;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="inventory-detail-modal">
      <Modal.Header closeButton className="bg-light border-0 pb-2">
        <Modal.Title className="fs-5 fw-bold text-dark d-flex align-items-center gap-2">
          {getDeviceIcon(item.device_type)}
          <span>{item.brand} {item.model}</span>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="px-4 py-3">
        {/* Device Header info */}
        <div className="d-flex align-items-center justify-content-between mb-4 bg-light p-3 rounded-3 border">
          <div>
            <div className="text-muted small fw-medium">Cihaz Türü</div>
            <div className="fw-bold text-dark fs-6 mt-1">{item.device_type}</div>
          </div>
          <div className="text-end">
            <div className="text-muted small fw-medium">Zimmet Durumu</div>
            <div className="mt-1">
              <Badge bg={getStatusBadgeVariant(item.status)} className="px-2.5 py-1.5 fs-7 fw-semibold rounded-pill">
                {getStatusText(item.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Brand & Model Grid */}
        <div className="device-info-grid mb-3">
          <Row className="g-3">
            <Col xs={6}>
              <div className="border rounded-3 p-3 bg-white h-100 shadow-sm d-flex flex-column">
                <span className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-2">
                  <Tag size={14} className="text-secondary" />
                  Marka
                </span>
                <span className="fw-semibold text-dark fs-6 mt-auto">{item.brand || '-'}</span>
              </div>
            </Col>
            
            <Col xs={6}>
              <div className="border rounded-3 p-3 bg-white h-100 shadow-sm d-flex flex-column">
                <span className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-2">
                  <Tag size={14} className="text-secondary" />
                  Model
                </span>
                <span className="fw-semibold text-dark fs-6 mt-auto">{item.model || '-'}</span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Info Grid */}
        <div className="device-info-grid mb-4">
          <Row className="g-3">
            <Col xs={6}>
              <div className="border rounded-3 p-3 bg-white h-100 shadow-sm d-flex flex-column">
                <span className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-2">
                  <Key size={14} className="text-secondary" />
                  Seri No
                </span>
                <span className="fw-semibold text-dark fs-6 mt-auto text-break">{item.serial_number || '-'}</span>
              </div>
            </Col>
            
            <Col xs={6}>
              <div className="border rounded-3 p-3 bg-white h-100 shadow-sm d-flex flex-column">
                <span className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-2">
                  <Calendar size={14} className="text-secondary" />
                  Zimmet Tarihi
                </span>
                <span className="fw-semibold text-dark fs-6 mt-auto">
                  {item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-'}
                </span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Notes Section */}
        <div className="border rounded-3 p-3 bg-light mb-4">
          <div className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-2">
            <Info size={14} className="text-secondary" />
            Notlar / Açıklama
          </div>
          <div className="text-dark small lh-base" style={{ whiteSpace: 'pre-wrap' }}>
            {item.notes || <span className="text-muted italic">Açıklama girilmemiş.</span>}
          </div>
        </div>

        {/* Assignment History Section */}
        <div className="border rounded-3 p-3 bg-white shadow-sm mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="text-dark fw-bold small d-flex align-items-center gap-1.5">
              <Clock size={16} className="text-primary" />
              <span>Zimmet ve Kullanım Geçmişi</span>
            </div>
            {histories.length > 0 && (
              <Badge bg="light" text="dark" className="border">
                {histories.length} Kayıt
              </Badge>
            )}
          </div>

          {loadingHistories ? (
            <div className="d-flex align-items-center justify-content-center gap-2 py-3">
              <Spinner animation="border" size="sm" variant="primary" />
              <span className="text-muted small">Tarihçe yükleniyor...</span>
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-3 text-muted small">
              Bu cihaza ait geçmiş kullanım kaydı bulunamadı.
            </div>
          ) : (
            <div className="table-responsive">
              <Table size="sm" hover className="align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Çalışan</th>
                    <th>İşlem</th>
                    <th>Zimmet Tarihi</th>
                    <th>İade Tarihi</th>
                    <th>Durum</th>
                    <th>Not</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {histories.map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td>
                        {h.employee ? (
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded-circle p-1 d-flex align-items-center justify-content-center text-primary fw-bold" style={{ width: 26, height: 26, fontSize: '0.75rem' }}>
                              <User size={14} />
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{h.employee.first_name} {h.employee.last_name}</div>
                              {(h.employee.work_information?.department_name || (h.employee as any).employee_work_information?.[0]?.department?.name) && (
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {h.employee.work_information?.department_name || (h.employee as any).employee_work_information?.[0]?.department?.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{getActionBadge(h.action)}</td>
                      <td>{h.assignment_date ? new Date(h.assignment_date).toLocaleDateString('tr-TR') : '-'}</td>
                      <td>
                        {h.return_date ? (
                          new Date(h.return_date).toLocaleDateString('tr-TR')
                        ) : (
                          <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">
                            Aktif Zimmet
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(h.status)}>
                          {getStatusText(h.status)}
                        </Badge>
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: 120 }} title={h.notes || ''}>
                        {h.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>

        {/* Photo Section */}
        {loadingDocs ? (
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2 p-3 border rounded-3 bg-white">
            <Spinner animation="border" size="sm" variant="primary" />
            <span className="text-muted small fw-medium">Fotoğraflar yükleniyor...</span>
          </div>
        ) : photoUrls.length > 0 ? (
          <div className="border rounded-3 p-3 bg-white shadow-sm mb-2">
            <div className="text-muted small fw-medium d-flex align-items-center gap-1.5 mb-3">
              <ImageIcon size={14} className="text-primary" />
              <span className="fw-semibold">Cihaz Görseli</span>
            </div>
            <div className="d-flex justify-content-center">
              {photoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="Büyütmek için tıklayın" className="d-block text-center w-100">
                  <img
                    src={url}
                    alt="Cihaz Resmi"
                    className="img-fluid border rounded hover-zoom transition-all"
                    style={{ maxHeight: '200px', objectFit: 'contain', cursor: 'pointer', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide} className="px-4 fw-medium">
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InventoryDetailModal;
