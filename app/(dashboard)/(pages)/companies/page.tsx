"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Card, Table, Button, Badge, Container } from 'react-bootstrap';
import { companyService } from '@/services';
import { Company } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import CompanyModal from '@/components/modals/CompanyModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Edit, Trash2, Eye, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const router = useRouter();

  const fetchCompanies = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC', perPage?: number) => {
    try {
      setIsLoading(true);

      const response = await companyService.getAll({ 
        page, 
        limit: perPage || itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      if (response.data) {
        setCompanies(response.data);
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, []);

  const handleSort = (key: 'name') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchCompanies(1, key, direction);
  };

  const getSortIcon = (columnKey: 'name') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" /> :
      <ChevronDown size={16} className="ms-1" />;
  };

  const handleView = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  const handleAddNew = () => {
    setSelectedCompany(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedCompany) {
      setDeleteLoading(true);
      try {
        await companyService.delete(selectedCompany.id);
        toast.success('Şirket başarıyla silindi');
        fetchCompanies(currentPage, sortConfig.key || undefined, sortConfig.direction);
        setShowDeleteModal(false);
        setSelectedCompany(null);
      } catch (error: any) {
        let errorMessage = '';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data) {
          errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = 'Silme işlemi sırasında bir hata oluştu';
        }
        
        const translatedError = translateErrorMessage(errorMessage);
        toast.error(translatedError);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleModalSave = () => {
    fetchCompanies(currentPage, sortConfig.key || undefined, sortConfig.direction);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setIsEdit(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCompany(null);
  };

  const handlePageChange = (newPage: number) => {
    fetchCompanies(newPage, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    fetchCompanies(1, sortConfig.key || undefined, sortConfig.direction, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">      
        <LoadingOverlay show={isLoading} message="Şirketler yükleniyor..." />
  
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Şirketler"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni Şirket"
            onCreate={handleAddNew}
          />
        </div>

        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th 
                              onClick={() => handleSort('name')}
                              className="sortable-header"
                            >
                              Şirket Adı {getSortIcon('name')}
                            </th>
                            <th>E-posta</th>
                            <th>Telefon</th>
                            <th>Adres</th>
                            <th>Statü</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies.length ? (
                            companies.map((company: Company) => (
                              <tr key={company.id}>
                                <td>{company.id}</td>
                                <td>{company.name}</td>
                                <td>{company.email || '-'}</td>
                                <td>{company.phone || '-'}</td>
                                <td>{company.address || '-'}</td>
                                <td>
                                  <Badge bg="success">Aktif</Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleView(company)}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEdit(company)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(company)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-4">
                                <div className="text-muted">
                                  <p className="mb-0">Henüz şirket bulunmuyor.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {totalItems > 0 && (
          <Row className="mt-3">
            <Col lg={12}>
              <div className="table-wrapper">
                <div className="d-flex justify-content-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Company Modal */}
        <CompanyModal
          show={showModal}
          isEdit={isEdit}
          company={selectedCompany}
          onHide={handleCloseModal}
          onSave={handleModalSave}
        />

        {/* Delete Modal */}
        {showDeleteModal && (
          <DeleteModal
            title="Şirketi Sil"
            message={`"${selectedCompany?.name}" şirketini silmek istediğinizden emin misiniz?`}
            onHandleDelete={handleDelete}
            onClose={handleCloseDeleteModal}
            loading={deleteLoading}
          />
        )}
      </Container>
    </>
  );
};

export default CompaniesPage;