"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Row, Col, Card, Table, Button, Badge, Container, Form, Alert,
} from 'react-bootstrap';
import { cvSearchService } from '@/services';
import type { BulkUploadJobResult } from '@/models/cv-search/cv-search.models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Upload, X, RefreshCw } from 'react-feather';
import { toast } from 'react-toastify';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 1;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const POLL_INTERVAL_MS = 3000;

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge bg="success">Tamamlandı</Badge>;
    case 'processing':
      return <Badge bg="info">İşleniyor</Badge>;
    case 'failed':
      return <Badge bg="danger">Hata</Badge>;
    case 'pending':
    default:
      return <Badge bg="warning" text="dark">Bekliyor</Badge>;
  }
};

const CvUploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
    if (!batchId) return;

    const poll = async () => {
      try {
        const status = await cvSearchService.getBatchStatus(batchId);
        if (status.results && status.results.length > 0) {
          setJobResults(status.results);
        }

        const allDone =
          status.results.length > 0 &&
          status.results.every(
            (r) => r.status === 'completed' || r.status === 'failed'
          );
        if (allDone) {
          stopPolling();
          const failed = status.results.filter((r) => r.status === 'failed').length;
          const completed = status.results.filter((r) => r.status === 'completed').length;
          if (failed === 0) {
            toast.success(`${completed} dosya başarıyla işlendi.`);
          } else {
            toast.warning(`${completed} başarılı, ${failed} başarısız.`);
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
        errors.push(`"${file.name}" 1 MB sınırını aşıyor.`);
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
    setIsUploading(true);
    try {
      const response = await cvSearchService.bulkUpload(selectedFiles);
      setBatchId(response.batch_id);
      // Seed table with initial statuses from upload response
      if (response.results && response.results.length > 0) {
        setJobResults(response.results);
      } else {
        // Build placeholder rows if API does not return them
        setJobResults(
          selectedFiles.map((f: File) => ({
            filename: f.name,
            status: 'pending' as const,
          }))
        );
      }
      setSelectedFiles([]);
      toast.info('Dosyalar sıraya alındı, işleme durumu takip ediliyor…');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Yükleme sırasında bir hata oluştu.';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setBatchId(null);
    setJobResults([]);
    setSelectedFiles([]);
  };

  const allDone =
    jobResults.length > 0 &&
    jobResults.every((r: BulkUploadJobResult) => r.status === 'completed' || r.status === 'failed');

  return (
    <Container fluid className="page-container">
      <LoadingOverlay show={isUploading} message="Dosyalar yükleniyor…" />

      <div className="page-heading-wrapper">
        <PageHeading
          heading="CV Yükleme"
          showCreateButton={false}
          showFilterButton={false}
        />
      </div>

      {/* Upload area — shown when no active batch */}
      {!batchId && (
        <Row className="mb-4">
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragOver ? '#0d6efd' : '#dee2e6'}`,
                    borderRadius: '8px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragOver ? '#f0f6ff' : '#fafafa',
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={36} color={isDragOver ? '#0d6efd' : '#6c757d'} />
                  <p className="mt-3 mb-1 fw-semibold">
                    Dosyaları buraya sürükleyin veya seçmek için tıklayın
                  </p>
                  <p className="text-muted small mb-0">
                    PDF, DOCX, TXT · Maksimum {MAX_FILES} dosya · Dosya başına 1 MB
                  </p>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
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
                        disabled={isUploading || selectedFiles.length === 0}
                      >
                        <Upload size={16} className="me-1" />
                        Yükle
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSelectedFiles([])}
                        disabled={isUploading}
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
      )}

      {/* Batch status table — shown after upload */}
      {batchId && (
        <Row>
          <Col lg={12}>
            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <Card.Header className="bg-white d-flex align-items-center justify-content-between py-3 px-4">
                  <div>
                    <span className="fw-semibold">İşlem Durumu</span>
                    <span className="text-muted small ms-2">Batch: {batchId}</span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {isPolling && (
                      <span className="text-muted small">
                        <RefreshCw size={14} className="me-1 spin" />
                        Güncelleniyor…
                      </span>
                    )}
                    {allDone && (
                      <Button variant="outline-primary" size="sm" onClick={handleReset}>
                        <Upload size={14} className="me-1" />
                        Yeni Yükleme
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 50 }}>#</th>
                            <th>Dosya Adı</th>
                            <th style={{ width: 140 }}>Durum</th>
                            <th style={{ width: 100 }}>Job ID</th>
                            <th>Hata Mesajı</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobResults.length > 0 ? (
                            jobResults.map((job, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td className="text-break">{job.filename}</td>
                                <td>{getStatusBadge(job.status)}</td>
                                <td className="text-muted small">
                                  {job.job_id ?? '—'}
                                </td>
                                <td className="text-danger small">
                                  {job.error || '—'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted">
                                Durum bilgisi bekleniyor…
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
