'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Spinner } from 'react-bootstrap';
import { contractService } from '@/services';
import { lookupService } from '@/services/lookup.service';
import { Contract } from '@/models/hr/contract';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus } from 'react-feather';
import DeleteModal from '@/components/DeleteModal';
import ContractModal from '@/components/modals/ContractModal';
import Pagination from '@/components/Pagination';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchContracts(currentPage);
  }, [currentPage]);

  const fetchContracts = async (page: number) => {
    try {
      setIsLoading(true);
      const limit = 10;
      
      const [res, compRes] = await Promise.all([
        contractService.getAll({ page, limit }) as any,
        lookupService.getCompaniesLookup().catch(() => ({ data: [] }))
      ]);

      if (res.data) {
        if (res.data.data) {
          setContracts(res.data.data);
          setTotalPages(Math.ceil((res.data.page?.total || 0) / limit));
        } else if (Array.isArray(res.data)) {
          setContracts(res.data);
          setTotalPages(1);
        }
      }

      if (compRes?.data) {
        setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
      }
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message || 'Sözleşmeler yüklenirken hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contractToDelete) return;
    setIsDeleting(true);
    try {
      await contractService.delete(contractToDelete.id);
      toast.success('Sözleşme silindi');
      setShowDeleteModal(false);
      setContractToDelete(null);
      fetchContracts(currentPage);
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <Container fluid className="p-6">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">Kurumsal Sözleşme Yönetimi</h2>
              <p className="text-muted">Müşteri sözleşmeleri ve teklif yönetimi</p>
            </div>
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={() => {
                setIsEdit(false);
                setSelectedContract(null);
                setShowModal(true);
              }}
            >
              <Plus size={16} className="me-2" />
              Yeni Kayıt
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">Henüz kayıtlı sözleşme bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Sözleşme No</th>
                    <th>Proje Adı</th>
                    <th>Müşteri Yetkili</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th className="text-end">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id}>
                      <td><span className="fw-semibold">{contract.contract_no}</span></td>
                      <td>{contract.project_name}</td>
                      <td>{contract.customer_contact_name}</td>
                      <td>
                        {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                      </td>
                      <td>
                        <span className={`badge ${
                          contract.status === 'ACTIVE' ? 'bg-success' : 
                          contract.status === 'COMPLETED' ? 'bg-primary' : 
                          contract.status === 'CANCELLED' ? 'bg-danger' : 
                          'bg-secondary'
                        }`}>
                          {contract.status || '-'}
                        </span>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="light"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsEdit(true);
                            setShowModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          onClick={() => {
                            setContractToDelete(contract);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <ContractModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedContract(null);
        }}
        onSave={() => fetchContracts(currentPage)}
        contract={selectedContract}
        isEdit={isEdit}
        companies={companies}
      />

      {showDeleteModal && (
        <DeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setContractToDelete(null);
          }}
          onHandleDelete={handleDelete}
          loading={isDeleting}
          title="Sözleşme Sil"
          message={`${contractToDelete?.contract_no} numaralı sözleşmeyi silmek istediğinize emin misiniz?`}
        />
      )}
    </Container>
  );
}