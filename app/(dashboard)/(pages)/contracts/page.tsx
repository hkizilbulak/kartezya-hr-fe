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
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchContracts(currentPage);
  }, [currentPage, limit]);

  const fetchContracts = async (page: number) => {
    try {
      setIsLoading(true);
      
      const [res, compRes] = await Promise.all([
        contractService.getAll({ page, limit }) as any,
        lookupService.getCompaniesLookup().catch(() => ({ data: [] }))
      ]);

      // API returns: { data: [...], page: { total, page, limit, total_pages, ... } }
      // base.service getAll() already returns response.data, so res = { data: [...], page: {...} }
      if (res?.data && Array.isArray(res.data)) {
        setContracts(res.data);
        const total = res.page?.total || 0;
        setTotalCount(total);
        setTotalPages(res.page?.total_pages || Math.ceil(total / limit) || 1);
      } else if (Array.isArray(res)) {
        setContracts(res);
        setTotalCount(res.length);
        setTotalPages(1);
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
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small">Toplam <strong>{totalCount}</strong> sözleşme</span>
              </div>
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
              </div>

              {totalCount > 0 && (
                <Row className="mt-4">
                  <Col lg={12} md={12} sm={12}>
                    <div className="px-3">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalCount}
                        itemsPerPage={limit}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={(newSize) => { setLimit(newSize); setCurrentPage(1); }}
                      />
                    </div>
                  </Col>
                </Row>
              )}
            </>
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