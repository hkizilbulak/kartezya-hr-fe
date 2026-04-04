import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, ListGroup, Badge, ProgressBar } from 'react-bootstrap';
import { Upload, X, Download, FileText, AlertCircle } from 'react-feather';
import { leaveRequestService } from '@/services/leave-request.service';
import { Attachment, formatFileSize, getFileIcon } from '@/models/common/attachment-models';

interface LeaveDocumentModalProps {
  show: boolean;
  onHide: (updatedCount?: number) => void;
  leaveRequestId: number;
  leaveTypeName: string;
  canEdit: boolean; // Can upload/delete documents
}

interface UploadingFile {
  id: string; // Unique ID for tracking
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const LeaveDocumentModal: React.FC<LeaveDocumentModalProps> = ({
  show,
  onHide,
  leaveRequestId,
  leaveTypeName,
  canEdit,
}) => {
  const [documents, setDocuments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      fetchDocuments();
      setUploadingFiles([]);
      setError('');
      setSuccess('');
    }
  }, [show, leaveRequestId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await leaveRequestService.getLeaveDocuments(leaveRequestId);
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Dökümanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      uploadFiles(fileArray);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: File[]) => {
    setError('');
    setSuccess('');

    // Validate file types and sizes
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Geçersiz dosya tipi. Sadece PDF, JPG, PNG, GIF desteklenir.`);
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: Dosya boyutu 10MB'dan büyük olamaz.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (validFiles.length === 0) {
      return;
    }

    // Add files to uploading list with pending status
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: `${Date.now()}_${Math.random()}`, // Unique ID
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (const uploadingFile of newUploadingFiles) {
      await uploadSingleFile(uploadingFile);
    }
  };

  const uploadSingleFile = async (uploadingFile: UploadingFile) => {
    const { id, file } = uploadingFile;

    // Update status to uploading
    setUploadingFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'uploading', progress: 50 } : f))
    );

    try {
      const response = await leaveRequestService.uploadLeaveDocument(leaveRequestId, file);

      if (response.success) {
        // Update to success
        setUploadingFiles(prev =>
          prev.map(f => (f.id === id ? { ...f, status: 'success', progress: 100 } : f))
        );

        // Remove from list after 2 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== id));
        }, 2000);

        // Refresh documents list
        await fetchDocuments();
        setSuccess('Döküman başarıyla yüklendi');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Yükleme başarısız';
      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'error', error: errorMessage } : f))
      );
      setError(errorMessage);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await leaveRequestService.deleteLeaveDocument(documentId);
      if (response.success) {
        setSuccess('Döküman başarıyla silindi');
        await fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Döküman silinirken hata oluştu');
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    setError('');

    try {
      const response = await leaveRequestService.downloadLeaveDocument(documentId);
      if (response.success && response.data?.url) {
        // Open download URL in new window
        window.open(response.data.url, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'İndirme başarısız');
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      uploadFiles(fileArray);
    }
  };

  const getProgressBarVariant = (status: UploadingFile['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'uploading':
        return 'primary';
      default:
        return 'info';
    }
  };

  return (
    <Modal show={show} onHide={() => onHide(documents.length)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FileText size={20} className="me-2" />
          İzin Dökümanları - {leaveTypeName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <AlertCircle size={16} className="me-2" />
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Upload Section */}
        {canEdit && (
          <div className="mb-4">
            <div
              className={`border rounded p-4 text-center ${isDragging ? 'border-primary bg-light' : 'border-secondary'
                }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={handleButtonClick}
            >
              <Upload size={48} className="text-secondary mb-3" />
              <p className="mb-2">
                <strong>Dosyaları buraya sürükleyin veya tıklayarak seçin</strong>
              </p>
              <p className="text-muted small mb-0">
                Desteklenen formatlar: PDF, JPG, PNG, GIF (Maks. 10MB)
              </p>
              <p className="text-muted small mb-0">
                Birden fazla dosya seçebilirsiniz
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                multiple
              />
            </div>
          </div>
        )}

        {/* Uploading Files */}
        {uploadingFiles.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-3">Yükleniyor...</h6>
            <ListGroup>
              {uploadingFiles.map((uploadingFile) => (
                <ListGroup.Item key={uploadingFile.id} className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center flex-grow-1">
                      <FileText size={20} className="me-2 text-secondary" />
                      <div className="flex-grow-1">
                        <div className="fw-medium">{uploadingFile.file.name}</div>
                        <small className="text-muted">{formatFileSize(uploadingFile.file.size)}</small>
                      </div>
                    </div>
                    {uploadingFile.status === 'error' && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.id)}
                        className="text-danger p-0"
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                  <ProgressBar
                    now={uploadingFile.progress}
                    variant={getProgressBarVariant(uploadingFile.status)}
                    striped={uploadingFile.status === 'uploading'}
                    animated={uploadingFile.status === 'uploading'}
                    className="mb-1"
                  />
                  {uploadingFile.error && (
                    <small className="text-danger">{uploadingFile.error}</small>
                  )}
                  {uploadingFile.status === 'success' && (
                    <small className="text-success">Yükleme tamamlandı</small>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Documents List */}
        <div>
          <h6 className="mb-3">
            Yüklenmiş Dökümanlar
            {documents.length > 0 && (
              <Badge bg="secondary" className="ms-2">
                {documents.length}
              </Badge>
            )}
          </h6>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <Alert variant="info">
              <AlertCircle size={16} className="me-2" />
              Henüz döküman yüklenmemiş
            </Alert>
          ) : (
            <ListGroup>
              {documents.map((doc) => (
                <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">{getFileIcon(doc.content_type)}</span>
                    <div>
                      <div className="fw-medium">{doc.file_name}</div>
                      <small className="text-muted">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                    >
                      <Download size={16} />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => onHide(documents.length)}>
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LeaveDocumentModal;
