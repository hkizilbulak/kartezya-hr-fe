'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Card, Table, Button, Badge, Container, Form } from 'react-bootstrap';
import { jobService } from '@/services/job.service';
import { Job } from '@/models/hr/job-models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import JobModal from '@/components/modals/JobModal';
import { Edit, Clock, PlayCircle, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'job_key' | 'is_active' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null, 
    direction: 'ASC'
  });

  const router = useRouter();

  const fetchJobs = async (key = sortConfig.key, dir = sortConfig.direction) => {
    try {
      setIsLoading(true);
      const data = await jobService.getJobs(key || undefined, dir || undefined);
      if (data) {
        setJobs(data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSort = (key: 'name' | 'job_key' | 'is_active') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchJobs(key, direction);
  };

  const getSortIcon = (columnKey: 'name' | 'job_key' | 'is_active') => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ? 
        <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> : 
        <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleHistory = (job: Job) => {
    router.push(`/job-management/${job.id}/history`);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleRunNow = async (job: Job) => {
    try {
      setIsLoading(true);
      await jobService.runJob(job.id);
      toast.success(`${job.name} başarıyla tetiklendi. Arka planda çalışıyor.`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Tetikleme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (job: Job) => {
    try {
      setIsLoading(true);
      await jobService.updateJob(job.id, {
        cron_expression: job.cron_expression,
        is_active: !job.is_active,
        timeout_second: job.timeout_second
      });
      toast.success('Görev durumu güncellendi');
      fetchJobs();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Güncelleme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSave = () => {
    fetchJobs();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  return (
    <>
      <Container fluid className="page-container">      
        <LoadingOverlay show={isLoading} message="Görevler yükleniyor..." />
  
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Görev Yönetimi"
            showCreateButton={false}
            showFilterButton={false}
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
                            <th onClick={() => handleSort('job_key')} className="sortable-header" style={{cursor: 'pointer'}}>
                                Job Key {getSortIcon('job_key')}
                            </th>
                            <th onClick={() => handleSort('name')} className="sortable-header" style={{cursor: 'pointer'}}>
                                Görev Adı {getSortIcon('name')}
                            </th>
                            <th>Cron İfadesi</th>
                            <th onClick={() => handleSort('is_active')} className="sortable-header" style={{cursor: 'pointer'}}>
                                Durum {getSortIcon('is_active')}
                            </th>
                            <th className="text-end">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.length ? (
                            jobs.map((job: Job) => (
                              <tr key={job.id}>
                                <td>{job.id}</td>
                                <td><Badge bg="secondary">{job.job_key}</Badge></td>
                                <td>{job.name}</td>
                                <td><code>{job.cron_expression}</code></td>
                                <td>
                                  <Form.Check 
                                    type="switch"
                                    id={`custom-switch-${job.id}`}
                                    checked={job.is_active}
                                    onChange={() => handleToggleActive(job)}
                                  />
                                </td>
                                <td className="text-end">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleRunNow(job)}
                                    title="Şimdi Çalıştır"
                                  >
                                    <PlayCircle size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleHistory(job)}
                                    title="Geçmişi Görüntüle"
                                  >
                                    <Clock size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEdit(job)}
                                    title="Düzenle"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-4">
                                <div className="text-muted">
                                  <p className="mb-0">Sistemde kayıtlı görev bulunamadı.</p>
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

        {showModal && selectedJob && (
          <JobModal
            show={showModal}
            job={selectedJob}
            onHide={handleCloseModal}
            onSave={handleModalSave}
          />
        )}
      </Container>
    </>
  );
};

export default JobsPage;