'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import { contractService } from '@/services';
import { lookupService } from '@/services/lookup.service';
import { Contract, ContractStatus } from '@/models/hr/contract';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, ChevronUp, ChevronDown } from 'react-feather';
import DeleteModal from '@/components/DeleteModal';
import ContractModal from '@/components/modals/ContractModal';
import Pagination from '@/components/Pagination';
import FormTextField from '@/components/FormTextField';
import FormSelectField from '@/components/FormSelectField';
import LoadingOverlay from '@/components/LoadingOverlay';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'DESC'
  });

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

  const fetchContracts = async (
    page: number, 
    overrideFilters?: { search?: string; customerName?: string; statusFilter?: string },
    sortKey: string | null = sortConfig.key,
    sortDir: 'ASC' | 'DESC' = sortConfig.direction
  ) => {
    try {
      setIsLoading(true);
      const f = overrideFilters ?? { search, customerName, statusFilter };

      const [res, compRes] = await Promise.all([
        contractService.getAll({
          page,
          limit,
          ...(f.search ? { search: f.search } : {}),
          ...(f.customerName ? { customer_name: f.customerName } : {}),
          ...(f.statusFilter ? { status: f.statusFilter } : {}),
          ...(sortKey ? { sort: sortKey, direction: sortDir.toUpperCase() } : {})
        } as any) as any,
        lookupService.getCompaniesLookup().catch(() => ({ data: [] }))
      ]);

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

  const handleSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchContracts(currentPage, undefined, key, direction);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ? 
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> : 
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchContracts(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCustomerName('');
    setStatusFilter('');
    setCurrentPage(1);
    setSortConfig({ key: null, direction: 'DESC' });
    fetchContracts(1, { search: '', customerName: '', statusFilter: '' }, null, 'DESC');
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
    <Container fluid className="page-container">
      <LoadingOverlay show={isLoading} message="Sözleşmeler yükleniyor..." />

      <div className="page-heading-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0">Kurumsal Sözleşme Yönetimi</h2>
            <p className="text-muted mb-0">Müşteri sözleşmeleri ve teklif yönetimi</p>
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
      </div>

      {/* Filtre Kartı */}
      <Row className="mb-3">
        <Col lg={12} md={12} sm={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3 align-items-end mb-3">
                <Col lg={3} md={6} sm={12}>
                  <FormTextField
                    controlId="filter-search"
                    label="Sözleşme No / Proje Adı"
                    name="search"
                    type="text"
                    value={search}
                    onChange={(_name, value) => setSearch(value)}
                    placeholder="Ara..."
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <FormTextField
                    controlId="filter-customer"
                    label="Müşteri Yetkili"
                    name="customerName"
                    type="text"
                    value={customerName}
                    onChange={(_name, value) => setCustomerName(value)}
                    placeholder="İsim ara..."
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <FormSelectField
                    label="Durum"
                    name="statusFilter"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    <option value={ContractStatus.PendingProposal}>Teklif Aşamasında</option>
                    <option value={ContractStatus.Approved}>Onaylandı</option>
                    <option value={ContractStatus.Rejected}>Reddedildi</option>
                    <option value={ContractStatus.Active}>Aktif</option>
                    <option value={ContractStatus.Completed}>Tamamlandı</option>
                    <option value={ContractStatus.Cancelled}>İptal Edildi</option>
                  </FormSelectField>
                </Col>
              </Row>
              <Row>
                <Col lg={12} md={12} sm={12} className="text-end">
                  <Button variant="secondary" size="sm" className="me-2" onClick={handleClearFilters}>
                    Temizle
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSearch}>
                    Filtrele
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="table-wrapper">
            <Card className="border-0 shadow-sm position-relative">
              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="d-flex justify-content-between align-items-center px-4 py-3">
                    <span className="text-muted small">Toplam <strong>{totalCount}</strong> sözleşme</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort('contract_no')} className="sortable-header" style={{cursor: 'pointer'}}>
                            Sözleşme No {getSortIcon('contract_no')}
                          </th>
                          <th onClick={() => handleSort('project_name')} className="sortable-header" style={{cursor: 'pointer'}}>
                            Proje Adı {getSortIcon('project_name')}
                          </th>
                          <th onClick={() => handleSort('customer_contact_name')} className="sortable-header" style={{cursor: 'pointer'}}>
                            Müşteri Yetkili {getSortIcon('customer_contact_name')}
                          </th>
                          <th onClick={() => handleSort('start_date')} className="sortable-header" style={{cursor: 'pointer'}}>
                            Tarih {getSortIcon('start_date')}
                          </th>
                          <th>Durum</th>
                          <th className="text-end">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-5 text-muted">
                              Kayıt bulunamadı.
                            </td>
                          </tr>
                        ) : contracts.map(contract => (
                          <tr key={contract.id}>
                            <td><span className="fw-semibold">{contract.contract_no}</span></td>
                            <td>{contract.project_name}</td>
                            <td>{contract.customer_contact_name}</td>
                            <td>
                              {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                            </td>
                            <td>
                              <span className={`badge ${
                                contract.status === ContractStatus.Active ? 'bg-success' :
                                contract.status === ContractStatus.Completed ? 'bg-primary' :
                                contract.status === ContractStatus.Cancelled ? 'bg-danger' :
                                contract.status === ContractStatus.Approved ? 'bg-info' :
                                contract.status === ContractStatus.Rejected ? 'bg-warning text-dark' :
                                'bg-secondary'
                              }`}>
                                {contract.status === ContractStatus.Active ? 'Aktif' :
                                 contract.status === ContractStatus.Completed ? 'Tamamlandı' :
                                 contract.status === ContractStatus.Cancelled ? 'İptal Edildi' :
                                 contract.status === ContractStatus.Approved ? 'Onaylandı' :
                                 contract.status === ContractStatus.Rejected ? 'Reddedildi' :
                                 contract.status === ContractStatus.PendingProposal ? 'Teklif Aşamasında' :
                                 contract.status || '-'}
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
                    <div className="px-3 py-3">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalCount}
                        itemsPerPage={limit}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={(newSize) => { setLimit(newSize); setCurrentPage(1); }}
                      />
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

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