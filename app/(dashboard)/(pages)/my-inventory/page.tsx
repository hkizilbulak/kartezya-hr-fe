'use client';

import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Spinner, Button } from 'react-bootstrap';
import { Monitor, Edit, Plus } from 'react-feather';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-toastify';
import InventoryFormModal from '@/components/inventory/InventoryFormModal';

const MyInventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryService.getMyItems();
      setItems(response.data || []);
    } catch (error: any) {
      toast.error('Envanter bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddClick = () => {
    setSelectedItem(null);
    setShowFormModal(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowFormModal(true);
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

  return (
    <Container fluid className="px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Monitor size={24} className="me-2 text-primary" />
          <h4 className="mb-0">Bana Zimmetli Cihazlar</h4>
        </div>
        <Button variant="primary" onClick={handleAddClick} className="d-flex align-items-center">
          <Plus size={16} className="me-2" />
          Cihaz Ekle
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">Üzerinize zimmetli herhangi bir cihaz bulunmamaktadır.</p>
            </div>
          ) : (
            <Table responsive className="table-list mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Cihaz Türü</th>
                  <th>Marka / Model</th>
                  <th>Seri No</th>
                  <th>Zimmet Tarihi</th>
                  <th>Durum</th>
                  <th className="pe-4 text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4">{item.device_type}</td>
                    <td>{item.brand} {item.model}</td>
                    <td>{item.serial_number || '-'}</td>
                    <td>{item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-'}</td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </td>
                    <td className="pe-4 text-end">
                      <Button variant="light" size="sm" onClick={() => handleEditClick(item)}>
                        <Edit size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {showFormModal && (
        <InventoryFormModal
          show={showFormModal}
          onHide={() => setShowFormModal(false)}
          onSuccess={fetchItems}
          item={selectedItem}
          isEmployeeView={true}
        />
      )}
    </Container>
  );
};

export default MyInventoryPage;
