import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { Edit, Trash2, Plus, Info } from 'react-feather';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-toastify';
import InventoryFormModal from './InventoryFormModal';
import DeleteModal from '../DeleteModal';
import InventoryDetailModal from './InventoryDetailModal';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

interface EmployeeInventoryProps {
  employeeId: string;
  canEdit: boolean;
}

const EmployeeInventory: React.FC<EmployeeInventoryProps> = ({ employeeId, canEdit }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryService.getEmployeeInventory(employeeId);
      setItems(response.data || []);
    } catch (error: any) {
      toast.error('Envanter bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchItems();
    }
  }, [employeeId]);

  const handleAddClick = () => {
    setSelectedItem(null);
    setShowFormModal(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowFormModal(true);
  };

  const handleDetailClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await inventoryService.deleteMyItem(selectedItem.id); 
      toast.success('Cihaz başarıyla silindi');
      setShowDeleteModal(false);
      fetchItems();
    } catch (error: any) {
      toast.error(translateErrorMessage(error?.response?.data?.error || 'Silme işlemi başarısız'));
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Zimmetli Cihazlar</h6>
        {canEdit && (
          <Button variant="primary" size="sm" onClick={handleAddClick} className="d-flex align-items-center">
            <Plus size={16} className="me-1" />
            Cihaz Ata
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-5 text-center">
            <p className="text-muted mb-0">Çalışana zimmetli cihaz bulunmamaktadır.</p>
          </Card.Body>
        </Card>
      ) : (
        <Table responsive className="table-list">
          <thead>
            <tr>
              <th>Cihaz Türü</th>
              <th>Marka / Model</th>
              <th>Seri No</th>
              <th>Zimmet Tarihi</th>
              <th>Durum</th>
              <th className="text-end">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.device_type}</td>
                <td>{item.brand} {item.model}</td>
                <td>{item.serial_number || '-'}</td>
                <td>{item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-'}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(item.status)}>
                    {getStatusText(item.status)}
                  </Badge>
                </td>
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-info" size="sm" onClick={() => handleDetailClick(item)}>
                      <Info size={14} />
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(item)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(item)}>
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showFormModal && (
        <InventoryFormModal
          show={showFormModal}
          onHide={() => setShowFormModal(false)}
          onSuccess={fetchItems}
          employeeId={employeeId}
          item={selectedItem}
        />
      )}

      {showDetailModal && (
        <InventoryDetailModal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          item={selectedItem}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onHandleDelete={confirmDelete}
          title="Cihazı Sil"
          message="Bu cihazı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          loading={isDeleting}
        />
      )}
    </div>
  );
};

export default EmployeeInventory;
