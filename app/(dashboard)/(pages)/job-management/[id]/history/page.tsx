"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Row, Col, Card, Table, Button, Badge, Container } from 'react-bootstrap';
import { jobService } from '@/services/job.service';
import { Job, JobHistory } from '@/models/hr/job-models';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Eye, ArrowLeft, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import JobHistoryModal from '@/components/modals/JobHistoryModal';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

type HistorySortKey = 'start_time' | 'end_time' | 'processed_count' | 'status';

const JobHistoryPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [history, setHistory] = useState<JobHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<JobHistory | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [sortConfig, setSortConfig] = useState<{
    key: HistorySortKey;
    direction: 'ASC' | 'DESC';
  }>({ key: 'start_time', direction: 'DESC' });

  const fetchJob = async (jobId: number) => {
    try {
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Görev yüklenirken hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const fetchHistory = async (
    jobId: number,
    page: number = currentPage,
    sortKey: HistorySortKey = sortConfig.key,
    sortDir: 'ASC' | 'DESC' = sortConfig.direction,
    pageSize: number = itemsPerPage
  ) => {
    try {
      setIsLoading(true);
      const response = await jobService.getJobHistory(jobId, {
        page,
        limit: pageSize,
        sort: sortKey,
        direction: sortDir,
      });

      if (response.data) {
        setHistory(response.data);
        setTotalPages(response.page?.total_pages || 0);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      } else {
        setHistory([]);
        setTotalPages(0);
        setTotalItems(0);
        setCurrentPage(page);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Geçmiş yüklenirken hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const jobId = Number(id);
    fetchJob(jobId);
    fetchHistory(jobId, 1, sortConfig.key, sortConfig.direction, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSort = (key: HistorySortKey) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
    if (id) {
      fetchHistory(Number(id), 1, key, direction, itemsPerPage);
    }
  };

  const getSortIcon = (columnKey: HistorySortKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC'
      ? <ChevronUp size={14} className="ms-1" style={{ display: 'inline' }} />
      : <ChevronDown size={14} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handlePageChange = (page: number) => {
    if (id) {
      fetchHistory(Number(id), page, sortConfig.key, sortConfig.direction, itemsPerPage);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    if (id) {
      fetchHistory(Number(id), 1, sortConfig.key, sortConfig.direction, size);
    }
  };

  const handleViewDetail = (item: JobHistory) => {
    setSelectedHistory(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedHistory(null);
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!start || !end) return '-';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffInSeconds = Math.floor((endTime - startTime) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sn`;
    }
    const mins = Math.floor(diffInSeconds / 60);
    const secs = diffInSeconds % 60;
    return `${mins} dk ${secs} sn`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge bg="success">Başarılı</Badge>;
      case 'FAILED':
        return <Badge bg="danger">Başarısız</Badge>;
      case 'RUNNING':
        return <Badge bg="warning" text="dark">Çalışıyor</Badge>;
      case 'TIMEOUT':
        return <Badge bg="secondary">Zaman Aşımı</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Geçmiş yükleniyor..." />

        <div className="page-heading-wrapper">
          <div className="d-flex align-items-center mb-3">
            <Button
              variant="link"
              className="p-0 me-3 text-dark d-flex align-items-center"
              onClick={() => router.push('/job-management')}
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft size={20} className="me-1" />
              Geri
            </Button>
            <h4 className="mb-0">Görev Çalışma Geçmişi: {job?.name || ''}</h4>
          </div>
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
                            <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleSort('start_time')}>
                              Başlangıç {getSortIcon('start_time')}
                            </th>
                            <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleSort('end_time')}>
                              Bitiş {getSortIcon('end_time')}
                            </th>
                            <th>Süre</th>
                            <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleSort('processed_count')}>
                              İşlenen Kayıt {getSortIcon('processed_count')}
                            </th>
                            <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                              Durum {getSortIcon('status')}
                            </th>
                            <th className="text-end">Detay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.length ? (
                            history.map((item: JobHistory) => (
                              <tr key={item.id}>
                                <td>{new Date(item.start_time).toLocaleString()}</td>
                                <td>{item.end_time ? new Date(item.end_time).toLocaleString() : '-'}</td>
                                <td>{calculateDuration(item.start_time, item.end_time)}</td>
                                <td>{item.processed_count}</td>
                                <td>{getStatusBadge(item.status)}</td>
                                <td className="text-end">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => handleViewDetail(item)}
                                    title="Detay"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-4">
                                <div className="text-muted">
                                  <p className="mb-0">Bu görev için çalışma geçmişi bulunamadı.</p>
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

              {totalItems > 0 && (
                <div className="px-3 mt-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 50, 100]}
                  />
                </div>
              )}
            </div>
          </Col>
        </Row>

        {showModal && selectedHistory && (
          <JobHistoryModal
            show={showModal}
            history={selectedHistory}
            onHide={handleCloseModal}
          />
        )}
      </Container>
    </>
  );
};

export default JobHistoryPage;
