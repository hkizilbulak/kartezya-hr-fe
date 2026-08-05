"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Container, Form, Alert,
} from 'react-bootstrap';
import { cvSearchService } from '@/services';
import type { BulkUploadJobResult } from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import { Upload, X, RefreshCw } from 'react-feather';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const POLL_INTERVAL_MS = 3000;

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge bg="success">Tamamlandı</Badge>;
    case 'processing':
      return <Badge bg="info">İşleniyor</Badge>;
    case 'failed':
    case 'error':
      return <Badge bg="danger">Hata</Badge>;
    case 'duplicate':
      return <Badge bg="secondary">Zaten Var (Kopya)</Badge>;
    case 'too_large':
    case 'invalid_type':
    case 'queue_full':
      return <Badge bg="danger">Kabul Edilmedi</Badge>;
    case 'batch_submitted':
      return <Badge bg="info">Toplu İşleme Gönderildi</Badge>;
    case 'pending':
    case 'queued':
    default:
      return <Badge bg="warning" text="dark">Bekliyor</Badge>;
  }
};

const CvUploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<BulkUploadJobResult[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling logic
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!batchId || batchId === 'uploading' || batchId === 'failed') return;

    const poll = async () => {
      try {
        const status = await cvSearchService.getBatchStatus(batchId);
        const currentJobs = status.jobs || [];
        if (currentJobs.length > 0) {
          setJobResults(currentJobs);
        }

        const terminalStatuses = ['completed', 'failed', 'duplicate', 'too_large', 'invalid_type', 'error', 'queue_full', 'batch_submitted'];
        const allDone =
          currentJobs.length > 0 &&
          currentJobs.every((r) => terminalStatuses.includes(r.status));
        if (allDone) {
          stopPolling();
          const completed = currentJobs.filter((r) => r.status === 'completed').length;
          const duplicate = currentJobs.filter((r) => r.status === 'duplicate').length;
          const failed = currentJobs.filter((r) => !['completed', 'duplicate'].includes(r.status)).length;
          
          if (completed > 0 && failed === 0) {
            toast.success(`${completed} dosya başarıyla işlendi.${duplicate > 0 ? ` (${duplicate} kopya atlandı)` : ''}`);
          } else if (completed === 0 && duplicate > 0 && failed === 0) {
            toast.info(`${duplicate} dosya zaten mevcut olduğu için atlandı.`);
          } else if (failed > 0) {
            toast.warning(`${completed} başarılı, ${duplicate} kopya, ${failed} başarısız.`);
          } else {
            toast.info(`İşlem tamamlandı.`);
          }
        }
      } catch {
        // polling errors are non-fatal; keep trying
      }
    };

    setIsPolling(true);
    poll(); // immediate first call
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [batchId, stopPolling]);

  // Clean up on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const validateAndAddFiles = (files: File[]) => {
    const currentCount = selectedFiles.length;
    const newFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}" desteklenmeyen format (sadece PDF, DOCX, TXT).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`"${file.name}" ${MAX_FILE_SIZE_MB} MB sınırını aşıyor.`);
        continue;
      }
      if (currentCount + newFiles.length >= MAX_FILES) {
        errors.push(`En fazla ${MAX_FILES} dosya yükleyebilirsiniz.`);
        break;
      }
      // Avoid duplicates
      if (!selectedFiles.find((f: File) => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }

    if (errors.length > 0) {
      errors.forEach((e) => toast.warning(e));
    }
    if (newFiles.length > 0) {
      setSelectedFiles((prev: File[]) => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    // reset input so the same file can be re-added after removal
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndAddFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // 1. Take a snapshot of files to upload and clear selection
    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]);
    
    // 2. Set temporary batch state and transition to table immediately
    setBatchId('uploading');
    setJobResults(
      filesToUpload.map((f: File) => ({
        filename: f.name,
        status: 'pending' as const,
      }))
    );
    
    // 3. Perform the upload in the background
    try {
      const response = await cvSearchService.bulkUpload(filesToUpload);
      setBatchId(response.batch_id);
      
      // Seed table with initial statuses from upload response
      if (response.results && response.results.length > 0) {
        setJobResults(response.results);
      } else {
        // Build placeholder rows if API does not return them
        setJobResults(
          filesToUpload.map((f: File) => ({
            filename: f.name,
            status: 'pending' as const,
          }))
        );
      }
      toast.info('Dosyalar başarıyla gönderildi, işleme durumu takip ediliyor…');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Yükleme sırasında bir hata oluştu.';
      toast.error(msg);
      
      // Update table to show the failure
      setBatchId('failed');
      setJobResults(
        filesToUpload.map((f: File) => ({
          filename: f.name,
          status: 'failed' as const,
          error: msg,
        }))
      );
    }
  };

  const handleReset = () => {
    stopPolling();
    setBatchId(null);
    setJobResults([]);
    setSelectedFiles([]);
  };

  const terminalStatuses = ['completed', 'failed', 'duplicate', 'too_large', 'invalid_type', 'error', 'queue_full', 'batch_submitted'];
  const allDone =
    jobResults.length > 0 &&
    jobResults.every((r: BulkUploadJobResult) => terminalStatuses.includes(r.status));

  return (
    <Container fluid className="page-container">
      <div className="page-heading-wrapper">
        <PageHeading
          heading="CV Yükleme"
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      {/* Upload area — always visible */}
      <Row className="mb-4 justify-content-center">
          <Col lg={10} xl={9}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <h5 className="fw-bold" style={{ color: '#1e293b', letterSpacing: '0.5px' }}>CV YÜKLEME MERKEZİ</h5>
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="d-flex flex-column align-items-center justify-content-center"
                  style={{
                    border: `2px dashed ${isDragOver ? '#6366f1' : '#cbd5e1'}`,
                    borderRadius: '16px',
                    padding: '60px 24px 30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragOver ? '#eef2ff' : '#f8fafc',
                    transition: 'all 0.2s',
                    minHeight: '280px'
                  }}
                >
                  <div className="mb-3">
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      <path d="M12 17v-8"></path>
                      <path d="M9 12l3-3 3 3"></path>
                    </svg>
                  </div>
                  <h4 className="fw-bold mb-2 text-dark" style={{ fontSize: '20px' }}>Sürükle ve Bırak</h4>
                  <p className="text-muted mb-4 pb-2" style={{ fontSize: '15px' }}>Veya bir dosya seçmek için tıklayın</p>
                  
                  <div className="mt-auto w-100">
                    <p className="text-muted small mb-0" style={{ fontSize: '13px' }}>
                      Maksimum {MAX_FILES} dosya. PDF, DOCX ve TXT desteklenir. (Max {MAX_FILE_SIZE_MB} MB per file).
                    </p>
                  </div>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="text-center mt-4 mb-2">
                  <Button 
                    variant="primary" 
                    className="fw-semibold px-5 py-2 shadow-sm"
                    style={{ borderRadius: '50px', backgroundColor: '#4f46e5', border: 'none', minWidth: '220px', fontSize: '15px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    KLASÖR SEÇ
                  </Button>
                </div>

                {/* Selected file list */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="fw-semibold mb-2">
                      Seçilen dosyalar ({selectedFiles.length}/{MAX_FILES})
                    </p>
                    <ul className="list-unstyled mb-0">
                      {selectedFiles.map((file: File, i: number) => (
                        <li
                          key={i}
                          className="d-flex align-items-center justify-content-between py-1 border-bottom"
                        >
                          <span className="small text-truncate" style={{ maxWidth: '70%' }}>
                            {file.name}
                            <span className="text-muted ms-2">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={() => handleRemoveFile(i)}
                          >
                            <X size={16} />
                          </Button>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 d-flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0}
                      >
                        <Upload size={16} className="me-1" />
                        Yükle
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSelectedFiles([])}
                      >
                        Temizle
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      {/* Batch status table — shown after upload */}
      {batchId && (
        <Row className="justify-content-center pb-5">
          <Col lg={10} xl={9}>
            <Card className="border-0 shadow-sm position-relative" style={{ borderRadius: '16px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
              <Card.Header className="bg-white border-bottom-0 d-flex align-items-center justify-content-between py-4 px-4 px-md-5">
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>İşlem Durumu</h5>
                  <span className="text-muted small">
                    Batch: {batchId === 'uploading' ? 'Yükleniyor...' : batchId === 'failed' ? 'Yükleme Başarısız' : batchId}
                  </span>
                </div>
                  <div className="d-flex gap-2 align-items-center">
                    {batchId === 'uploading' && (
                      <span className="text-muted small me-2">
                        <RefreshCw size={14} className="me-1 spin" />
                        Dosyalar gönderiliyor…
                      </span>
                    )}
                    {isPolling && batchId !== 'uploading' && (
                      <span className="text-muted small me-2">
                        <RefreshCw size={14} className="me-1 spin" />
                        Güncelleniyor…
                      </span>
                    )}
                    {allDone && (
                      <Button variant="outline-primary" size="sm" onClick={handleReset} style={{ borderRadius: '50px', padding: '6px 16px', color: '#4f46e5', borderColor: '#eef2ff', backgroundColor: '#eef2ff', fontWeight: 600 }}>
                        <Upload size={14} className="me-1 mb-1" />
                        Yeni Yükleme
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body className="p-0 px-4 px-md-5 pb-4">
                  <div className="table-responsive">
                    <Table hover className="mb-0 align-middle">
                      <thead className="bg-transparent">
                        <tr>
                          <th className="border-0 text-muted small fw-semibold py-3 px-0" style={{ width: 50 }}>#</th>
                          <th className="border-0 text-muted small fw-semibold py-3">Dosya Adı</th>
                          <th className="border-0 text-muted small fw-semibold py-3" style={{ width: 140 }}>Durum</th>
                          <th className="border-0 text-muted small fw-semibold py-3" style={{ width: 100 }}>Job ID</th>
                          <th className="border-0 text-muted small fw-semibold py-3">Hata Mesajı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobResults.length > 0 ? (
                          jobResults.map((job, i) => (
                            <tr key={i} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                              <td className="border-0 py-3 px-0 text-muted small">{i + 1}</td>
                              <td className="border-0 py-3 text-dark fw-medium text-break" style={{ fontSize: '14.5px' }}>{job.filename}</td>
                              <td className="border-0 py-3">{getStatusBadge(job.status)}</td>
                              <td className="border-0 py-3 text-muted small">
                                {job.job_id ?? '—'}
                              </td>
                              <td className="border-0 py-3 text-danger small">
                                {job.error || '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border-0 text-center py-5 text-muted">
                              Durum bilgisi bekleniyor…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
          </Col>
        </Row>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin { animation: spin 1.2s linear infinite; display: inline-block; }
      `}</style>
    </Container>
  );
};

export default CvUploadPage;
