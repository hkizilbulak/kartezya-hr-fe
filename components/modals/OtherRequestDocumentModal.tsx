'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, ListGroup, ProgressBar } from 'react-bootstrap';
import { Upload, X, Download, FileText } from 'react-feather';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { Attachment, getFileIcon, formatFileSize } from '@/models/common/attachment-models';

interface OtherRequestDocumentModalProps {
    show: boolean;
    onHide: () => void;
    reqId: number | null;
    initialAttachments: Attachment[];
    onSuccess: () => void;
    canDelete?: boolean;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

const OtherRequestDocumentModal: React.FC<OtherRequestDocumentModalProps> = ({
    show, onHide, reqId, initialAttachments, onSuccess, canDelete = true
}) => {
    const [documents, setDocuments] = useState<Attachment[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (show && reqId) {
            setDocuments(Array.isArray(initialAttachments) ? initialAttachments : []);
            fetchDocuments();
        } else {
            setDocuments([]);
            setUploadingFiles([]);
        }
    }, [show, reqId]);

    const fetchDocuments = async () => {
        if (!reqId) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/${reqId}/documents`);
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setDocuments(data);
        } catch (err) {
            setDocuments([]);
            toast.error('Belgeler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDragLeave = (e: React.DragEvent) => { setIsDragging(false); };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            uploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            uploadFiles(Array.from(e.target.files));
        }
    };

    const removeUploadingFile = (id: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== id));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'error': return 'danger';
            case 'success': return 'success';
            default: return 'info';
        }
    };

    const uploadFiles = async (files: File[]) => {
        const newUploads: UploadingFile[] = files.map(f => ({
            id: `${Date.now()}-${Math.random()}`, file: f, progress: 0, status: 'pending'
        }));
        setUploadingFiles(prev => [...prev, ...newUploads]);

        for (const uf of newUploads) {
            try {
                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'uploading', progress: 50 } : p));
                const formData = new FormData();
                formData.append('file', uf.file);

                await axiosInstance.post(
                    `${HR_ENDPOINTS.OTHER_REQUESTS}/${reqId}/documents`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'success', progress: 100 } : p));

                await fetchDocuments();
                onSuccess();

                setTimeout(() => setUploadingFiles(prev => prev.filter(p => p.id !== uf.id)), 2000);
            } catch (err: any) {
                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'error', error: 'Yükleme başarısız' } : p));
                toast.error("Yükleme başarısız oldu.");
            }
        }
    };

    const handleDownload = async (documentId: string, fileName: string) => {
        try {
            const response = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${documentId}/download`);
            const fileUrl = response.data?.data?.url;
            
            if (!fileUrl) { 
                toast.error('Dosya linki alınamadı.'); 
                return; 
            }

            const link = document.createElement('a');
            link.href = fileUrl;
            link.setAttribute('download', fileName); 
            link.setAttribute('target', '_blank');  
            link.setAttribute('rel', 'noopener noreferrer');
            
            document.body.appendChild(link);
            link.click(); 
            document.body.removeChild(link); 
            
        } catch (err: any) {
            toast.error('Dosya indirilemedi.');
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            await axiosInstance.delete(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${documentId}`);
            toast.success('Doküman silindi.');
            await fetchDocuments();
            onSuccess();
        } catch (err) {
            toast.error('Silme başarısız.');
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title><FileText size={20} className="me-2" /> Talep Dokümanları</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {canDelete && (
                    <div className="mb-4">
                        <div
                            className={`border rounded p-4 text-center ${isDragging ? 'border-primary bg-light' : 'border-secondary'}`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer', borderStyle: 'dashed', transition: 'all 0.2s' }}
                        >
                            <Upload size={40} className="text-secondary mb-3" />
                            <p className="mb-2"><strong>Dosyaları buraya sürükleyin veya tıklayarak seçin</strong></p>
                            <p className="text-muted small mb-0">Desteklenen formatlar: PDF, JPG, PNG, GIF (Maks. 10MB)</p>
                            <p className="text-muted small mb-0">Birden fazla dosya seçebilirsiniz</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                hidden
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                            />
                        </div>

                        {uploadingFiles.length > 0 && (
                            <div className="mt-3">
                                <h6 className="mb-2">Yükleniyor...</h6>
                                {uploadingFiles.map((uf) => (
                                    <div key={uf.id} className="mb-3 p-3 border rounded">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">{getFileIcon(uf.file.type)}</span>
                                                <div>
                                                    <div className="fw-bold">{uf.file.name}</div>
                                                    <small className="text-muted">{formatFileSize(uf.file.size)}</small>
                                                </div>
                                            </div>
                                            {uf.status === 'error' && (
                                                <Button variant="link" size="sm" onClick={() => removeUploadingFile(uf.id)} className="text-danger p-0">
                                                    <X size={20} />
                                                </Button>
                                            )}
                                        </div>
                                        {uf.status !== 'success' && (
                                            <ProgressBar
                                                now={uf.progress}
                                                variant={getStatusColor(uf.status)}
                                                striped={uf.status === 'uploading'}
                                                animated={uf.status === 'uploading'}
                                            />
                                        )}
                                        {uf.status === 'success' && <div className="text-success"><small>✓ Başarıyla yüklendi</small></div>}
                                        {uf.status === 'error' && <div className="text-danger"><small>✗ {uf.error}</small></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <h6 className="mb-3">Yüklenen Dokümanlar ({documents.length}):</h6>
                {loading ? <p>Yükleniyor...</p> : (
                    <ListGroup className="mb-3">
                        {documents.map(doc => (
                            <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                                <span className="d-flex align-items-center">
                                    {getFileIcon(doc.content_type || 'application/pdf')}
                                    <span className="ms-2">
                                        {doc.file_name}
                                        <small className="text-muted d-block">{formatFileSize(doc.file_size)}</small>
                                    </span>
                                </span>
                                <div>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleDownload(doc.id, doc.file_name)}><Download size={14} /></Button>
                                    {canDelete && (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(doc.id)}><X size={14} /></Button>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default OtherRequestDocumentModal;