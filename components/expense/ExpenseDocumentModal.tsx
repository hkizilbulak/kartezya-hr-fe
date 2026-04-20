import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, ListGroup, Badge, ProgressBar } from 'react-bootstrap';
import { Upload, X, Download, FileText, AlertCircle } from 'react-feather';
import expenseService from '@/services/expense.service';
import { Attachment, formatFileSize, getFileIcon } from '@/models/common/attachment-models';

interface ExpenseDocumentModalProps {
  show: boolean;
  onHide: () => void;
  expenseRequestId: number;
  expenseAmount: number;
  requiresReceipt: boolean;
  isPending: boolean;
}

interface UploadingFile {
  id: string; // Unique ID for tracking
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const ExpenseDocumentModal: React.FC<ExpenseDocumentModalProps> = ({
  show,
  onHide,
  expenseRequestId,
  expenseAmount,
  requiresReceipt,
  isPending,
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
  }, [show, expenseRequestId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await expenseService.getExpenseDocuments(expenseRequestId);
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Dökümanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name}: Dosya boyutu 10MB'dan küçük olmalıdır`;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Sadece PDF ve resim dosyaları yüklenebilir`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    filesArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError('');
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    handleFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`, // Unique ID
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const uploadingFile = newUploadingFiles[i];

      try {
        // Update status to uploading
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.id === uploadingFile.id ? { ...uf, status: 'uploading' as const, progress: 50 } : uf
          )
        );

        const response = await expenseService.uploadExpenseDocument(expenseRequestId, uploadingFile.file);

        if (response.success) {
          // Update status to success
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.id === uploadingFile.id ? { ...uf, status: 'success' as const, progress: 100 } : uf
            )
          );

          // Refresh documents list
          await fetchDocuments();
          
          // Remove from uploading list after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadingFile.id));
          }, 2000);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Yükleme başarısız';
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.id === uploadingFile.id ? { ...uf, status: 'error' as const, error: errorMsg } : uf
          )
        );
      }
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(uf => uf.id !== id));
  };

  const handleDelete = async (documentId: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await expenseService.deleteExpenseDocument(documentId);
      if (response.success) {
        setSuccess('Döküman başarıyla silindi');
        await fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Döküman silinirken hata oluştu');
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await expenseService.downloadExpenseDocument(documentId);
      if (response.success && response.data?.url) {
        // Open download URL in new tab
        window.open(response.data.url, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Döküman indirilirken hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'uploading': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FileText size={20} className="me-2" />
          Masraf Dökümanları
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {requiresReceipt && documents.length === 0 && uploadingFiles.length === 0 && (
          <Alert variant="warning">
            <AlertCircle size={16} className="me-2" />
            Bu masraf türü için <strong>makbuz zorunludur</strong>. Lütfen en az bir döküman yükleyin.
          </Alert>
        )}

        {/* Upload Section */}
        {true ? (
          <div className="mb-4">
            <div
              className={`border rounded p-4 text-center ${isDragging ? 'border-primary bg-light' : 'border-secondary'
                }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => fileInputRef.current?.click()}
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

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-2">Yükleniyor...</h6>
                {uploadingFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <span className="me-2">{getFileIcon(uploadFile.file.type)}</span>
                        <div>
                          <div className="fw-bold">{uploadFile.file.name}</div>
                          <small className="text-muted">{formatFileSize(uploadFile.file.size)}</small>
                        </div>
                      </div>
                      <div>
                        {uploadFile.status === 'error' && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => removeUploadingFile(uploadFile.id)}
                            className="text-danger p-0"
                          >
                            <X size={20} />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {uploadFile.status !== 'success' && (
                      <ProgressBar
                        now={uploadFile.progress}
                        variant={getStatusColor(uploadFile.status)}
                        striped={uploadFile.status === 'uploading'}
                        animated={uploadFile.status === 'uploading'}
                      />
                    )}
                    
                    {uploadFile.status === 'success' && (
                      <div className="text-success">
                        <small>✓ Başarıyla yüklendi</small>
                      </div>
                    )}
                    
                    {uploadFile.status === 'error' && (
                      <div className="text-danger">
                        <small>✗ {uploadFile.error}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Alert variant="info">
            <AlertCircle size={16} className="me-2" />
            Sadece <strong>beklemede</strong> durumundaki masraf taleplerine döküman yükleyebilirsiniz.
          </Alert>
        )}

        <hr />

        {/* Documents List */}
        <div>
          <h6>Yüklenen Dökümanlar ({documents.length})</h6>
          {loading ? (
            <p className="text-muted">Yükleniyor...</p>
          ) : documents.length === 0 ? (
            <p className="text-muted">Henüz döküman yüklenmemiş</p>
          ) : (
            <ListGroup>
              {documents.map((doc) => (
                <ListGroup.Item
                  key={doc.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <span className="me-2" style={{ fontSize: '1.5em' }}>
                      {getFileIcon(doc.content_type)}
                    </span>
                    <div>
                      <div className="fw-bold">{doc.file_name}</div>
                      <small className="text-muted">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                      </small>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      title="İndir"
                    >
                      <Download size={16} />
                    </Button>
                    {true && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        title="Sil"
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
        <Button variant="secondary" onClick={onHide}>
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExpenseDocumentModal;
