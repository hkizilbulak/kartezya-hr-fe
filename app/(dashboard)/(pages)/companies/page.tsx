"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import { companyService } from '@/services';
import { Company } from '@/models/hr/common.types';
import Pagination from '@/components/Pagination';
import CompanyModal from '@/components/modals/CompanyModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Filter } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const [pageData, setPageData] = useState({
    page: 1,
    limit: 10,
    offset: 0,
    total: 0,
    total_pages: 1
  });

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'email' | 'phone' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  // Backend'den verileri çek
  const fetchCompanies = async (page: number = 1, search: string = '', sortKey: string = '', sortDir: 'ASC' | 'DESC' = 'ASC') => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * pageData.limit;
      
      const queryParams = new URLSearchParams();
      queryParams.append('limit', pageData.limit.toString());
      queryParams.append('offset', offset.toString());
      if (search) queryParams.append('search', search);
      if (sortKey) queryParams.append('sort', sortKey);
      queryParams.append('direction', sortDir);

      const response = await companyService.getAll({ 
        page, 
        size: pageData.limit,
        search: search || undefined,
        sort: sortKey || undefined,
        direction: sortDir
      });
      
      if (response.data) {
        setCompanies(response.data);
        setPageData({
          page: response.page?.page || 1,
          limit: response.page?.limit || 10,
          offset: 0,
          total: response.page?.total || 0,
          total_pages: response.page?.total_pages || 1
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSort = (key: 'name' | 'email' | 'phone') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchCompanies(1, searchFilter, key, direction);
  };

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    fetchCompanies(1, value, sortConfig.key || '', sortConfig.direction);
  };

  const getSortIcon = (columnKey: 'name' | 'email' | 'phone') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
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
        fetchCompanies(pageData.page, searchFilter, sortConfig.key || '', sortConfig.direction);
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
    fetchCompanies(pageData.page, searchFilter, sortConfig.key || '', sortConfig.direction);
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
    fetchCompanies(newPage, searchFilter, sortConfig.key || '', sortConfig.direction);
  };

  return (
    <>
      <style jsx global>{`
        #page-content {
          background-color: #f5f7fa;
          min-height: 100vh;
        }
      `}</style>
      
      <style jsx>{`
        .sortable-header {
          transition: background-color 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        .sortable-header:hover {
          background-color: rgba(98, 75, 255, 0.1) !important;
        }
        .table-box {
          border-radius: 8px;
          overflow: hidden;
          border: none;
          margin: 0;
        }
        .table-responsive {
          border-radius: 0;
          margin-bottom: 0;
        }
        table {
          margin-bottom: 0;
          table-layout: fixed;
          width: 100%;
        }
        table td, table th {
          padding: 12px 16px;
          vertical-align: middle;
          word-wrap: break-word;
        }
        table thead tr {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        table thead tr:last-child td {
          padding: 12px 16px;
          background-color: white;
          border-bottom: none;
        }
        table thead tr:last-child .filter-input {
          width: 100%;
        }
      `}</style>

      <Row className="mb-4 px-3 pt-4">
        <Col lg={12} md={12} sm={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Şirketler</h4>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                <Filter size={16} />
              </Button>
              
              <Button variant="primary" size="sm" onClick={handleAddNew} disabled={isLoading}>
                <Plus size={16} className="me-1" />
                Yeni Şirket
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="px-3">
            <Card className="border-0 shadow-sm position-relative">
              <LoadingOverlay show={isLoading} message="Şirketler yükleniyor..." />

              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                          >
                            Şirket Adı {getSortIcon('name')}
                          </th>
                          <th
                            onClick={() => handleSort('email')}
                            className="sortable-header"
                          >
                            E-posta {getSortIcon('email')}
                          </th>
                          <th
                            onClick={() => handleSort('phone')}
                            className="sortable-header"
                          >
                            Telefon {getSortIcon('phone')}
                          </th>
                          <th>İşlemler</th>
                        </tr>
                        {showFilters && (
                          <tr>
                            <td className="border-top">
                              <Form.Control
                                type="text"
                                placeholder="Şirket adı, email..."
                                value={searchFilter}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="filter-input"
                                size="sm"
                                disabled={isLoading}
                              />
                            </td>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                            </td>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {companies.length ? (
                          companies.map((company: Company) => (
                            <tr key={company.id}>
                              <td>{company.name}</td>
                              <td>{company.email || '-'}</td>
                              <td>{company.phone || '-'}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(company)}
                                  disabled={isLoading}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(company)}
                                  disabled={isLoading}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          !isLoading && (
                            <tr>
                              <td colSpan={4} className="text-center py-4">
                                {companies.length === 0 ? 'Veri bulunamadı' : 'Arama kriterlerine uygun veri bulunamadı'}
                              </td>
                            </tr>
                          )
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

      {!isLoading && (
        <Row className="mt-4">
          <Col lg={12} md={12} sm={12}>
            <div className="px-3">
              <Pagination
                currentPage={pageData.page}
                totalPages={pageData.total_pages}
                totalItems={pageData.total}
                itemsPerPage={pageData.limit}
                onPageChange={handlePageChange}
              />
            </div>
          </Col>
        </Row>
      )}

      <CompanyModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        company={selectedCompany}
        isEdit={isEdit}
      />

      {showDeleteModal && (
        <DeleteModal
          onClose={handleCloseDeleteModal}
          onHandleDelete={handleDelete}
          loading={deleteLoading}
        />
      )}
    </>
  );
};

export default CompaniesPage;