import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Tab, Nav, Form, Spinner, Alert } from 'react-bootstrap';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'react-feather';
import { Html5Qrcode } from 'html5-qrcode';
import { documentService } from '@/services/document.service';
import { toast } from 'react-toastify';

// DYS Constants
const ATTACHMENT_RELATED_TYPE_INVENTORY = 8;
const ATTACHMENT_TYPE_DEVICE_PHOTO = 10;

interface BarcodeScannerModalProps {
  show: boolean;
  onHide: () => void;
  onScanSuccess: (result: {
    serialNumber: string;
    brand: string;
    model: string;
    deviceType: string;
    documentId?: string;
    fileName?: string;
  }) => void;
}

export const predictDeviceDetails = (serial: string) => {
  let clean = serial.trim().toUpperCase();

  // Remove common prefixes
  const prefixes = [
    'SN:',
    'S/N:',
    'SERIAL:',
    'SERIAL NUMBER:',
    'SERIAL NO:',
    'SERİ NO:',
  ];
  for (const prefix of prefixes) {
    if (clean.startsWith(prefix)) {
      clean = clean.substring(prefix.length).trim();
      break;
    }
  }

  // Model-specific checks first
  if (clean.includes('X1502') || clean.includes('F1502') || clean.includes('X1502ZA') || clean.includes('F1502Z')) {
    return { serialNumber: clean, brand: 'ASUS', deviceType: 'Laptop', model: 'Vivobook 15' };
  }
  if (clean.includes('FA506') || clean.includes('TUF')) {
    return { serialNumber: clean, brand: 'ASUS', deviceType: 'Laptop', model: 'TUF Gaming' };
  }

  // Dell Service Tag (7 characters alphanumeric)
  if (/^[A-Z0-9]{7}$/.test(clean)) {
    return { serialNumber: clean, brand: 'Dell', deviceType: 'Laptop', model: 'Latitude' };
  }

  // HP (usually 10 chars alphanumeric)
  if (/^[A-Z0-9]{10}$/.test(clean)) {
    return { serialNumber: clean, brand: 'HP', deviceType: 'Laptop', model: 'ProBook' };
  }

  // Lenovo (often starts with 1S prefix on barcode labels)
  if (/^1S[A-Z0-9]{8,12}$/.test(clean)) {
    const realSerial = clean.substring(2);
    return { serialNumber: realSerial, brand: 'Lenovo', deviceType: 'Laptop', model: 'ThinkPad' };
  }
  if (/^[A-Z0-9]{8}$/.test(clean)) {
    return { serialNumber: clean, brand: 'Lenovo', deviceType: 'Laptop', model: 'ThinkPad' };
  }

  // Apple (12 characters alphanumeric)
  if (/^[A-Z0-9]{12}$/.test(clean)) {
    return { serialNumber: clean, brand: 'Apple', deviceType: 'Laptop', model: 'MacBook Pro' };
  }

  // ASUS Serial Tag (15 characters alphanumeric)
  if (/^[A-Z0-9]{15}$/.test(clean)) {
    return { serialNumber: clean, brand: 'ASUS', deviceType: 'Laptop', model: 'Vivobook / Notebook' };
  }

  return { serialNumber: clean, brand: '', deviceType: '', model: '' };
};

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  show,
  onHide,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerStateRef = useRef<'idle' | 'starting' | 'scanning' | 'stopping'>('idle');
  const elementId = 'barcode-scanner-reader-element';

  // Start Camera Scanning
  const startCamera = async () => {
    if (scannerStateRef.current !== 'idle') {
      return;
    }
    setCameraError(null);
    scannerStateRef.current = 'starting';
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode(elementId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { 
          facingMode: 'environment',
          advanced: [{ focusMode: 'continuous' }] as any,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        {
          fps: 10,
          qrbox: (width, height) => ({
            width: Math.max(50, Math.min(width * 0.85, 300)),
            height: Math.max(50, Math.min(height * 0.45, 150)),
          }),
        },
        async (decodedText) => {
          // Successfully scanned! Play beep and process
          try {
            playBeep();
            setIsUploading(true);

            // Capture snapshot of the barcode
            let documentId: string | undefined;
            let fileName: string | undefined;
            const video = document.querySelector(`#${elementId} video`) as HTMLVideoElement;
            if (video) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
                if (blob) {
                  fileName = `device_photo_${Date.now()}.jpg`;
                  const file = new File([blob], fileName, { type: 'image/jpeg' });
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('related_type', String(ATTACHMENT_RELATED_TYPE_INVENTORY));
                  formData.append('type', String(ATTACHMENT_TYPE_DEVICE_PHOTO));
                  
                  try {
                    const response = await documentService.uploadDocument(formData);
                    if (response && response.data) {
                      documentId = response.data.id;
                    }
                  } catch (uploadErr) {
                    console.error('Camera snapshot upload failed but scanning succeeded:', uploadErr);
                    toast.warning('Barkod başarıyla okundu, fakat fotoğraf DYS sistemine yüklenemedi.');
                  }
                }
              }
            }

            // Stop camera first
            await stopCamera();
            setIsCameraActive(false);

            // Predict details and callback
            const predictions = predictDeviceDetails(decodedText);
            onScanSuccess({
              ...predictions,
              documentId,
              fileName,
            });
            onHide();
          } catch (err: any) {
            console.error('Scan handling failed:', err);
            toast.error('Görüşme/tarama verisi işlenirken hata oluştu.');
          } finally {
            setIsUploading(false);
          }
        },
        () => {
          // Silent errors (ignore standard no-code found frame exceptions)
        }
      );

      scannerStateRef.current = 'scanning';
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setCameraError('Kamera başlatılamadı. Kamera izinlerini kontrol edin.');
      setIsCameraActive(false);
      scannerStateRef.current = 'idle';
      html5QrCodeRef.current = null;
    }
  };

  // Stop Camera Scanning
  const stopCamera = async () => {
    // If scanner is currently starting, wait and retry
    if (scannerStateRef.current === 'starting') {
      setTimeout(stopCamera, 100);
      return;
    }

    if (scannerStateRef.current === 'scanning' && html5QrCodeRef.current) {
      scannerStateRef.current = 'stopping';
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        scannerStateRef.current = 'idle';
      }
    } else {
      html5QrCodeRef.current = null;
      scannerStateRef.current = 'idle';
    }
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      // Create local html5-qrcode instance for file scanning using a dedicated element
      const html5QrCode = new Html5Qrcode('barcode-file-reader-element');
      const decodedText = await html5QrCode.scanFile(file, false);
      
      // Upload file to DYS DYS
      let documentId: string | undefined;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('related_type', String(ATTACHMENT_RELATED_TYPE_INVENTORY));
        formData.append('type', String(ATTACHMENT_TYPE_DEVICE_PHOTO));

        const response = await documentService.uploadDocument(formData);
        if (response && response.data) {
          documentId = response.data.id;
        }
      } catch (uploadErr) {
        console.error('File upload failed but scanning succeeded:', uploadErr);
        toast.warning('Barkod başarıyla okundu, fakat fotoğraf DYS sistemine yüklenemedi.');
      }

      playBeep();
      const predictions = predictDeviceDetails(decodedText);
      onScanSuccess({
        ...predictions,
        documentId,
        fileName: documentId ? file.name : undefined,
      });
      onHide();
    } catch (err: any) {
      console.error('File scan failed:', err);
      setUploadError('Fotoğrafta okunabilir bir barkod bulunamadı. Lütfen daha net bir açıdan çekin.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Play Beep sound on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1000; // 1kHz
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15); // play for 150ms
    } catch (err) {
      console.error('Failed to play sound:', err);
    }
  };

  // Manage camera state based on active tab
  useEffect(() => {
    if (show) {
      if (activeTab === 'camera') {
        startCamera();
      } else {
        stopCamera();
        setIsCameraActive(false);
      }
    } else {
      stopCamera();
      setIsCameraActive(false);
    }
    return () => {
      stopCamera();
    };
  }, [show, activeTab]);

  // Clean up on close/unmount
  const handleClose = () => {
    stopCamera();
    setIsCameraActive(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-semibold text-dark">Barkod Tarayıcı</Modal.Title>
      </Modal.Header>
      <Modal.Body className="position-relative p-4">
        {isUploading && (
          <div
            className="position-absolute d-flex flex-column align-items-center justify-content-center bg-white opacity-75"
            style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
          >
            <Spinner animation="border" variant="primary" />
            <span className="mt-2 text-dark small fw-medium">Fotoğraf DYS'ye yükleniyor...</span>
          </div>
        )}

        <Tab.Container
          activeKey={activeTab}
          onSelect={(k) => setActiveTab((k as any) || 'camera')}
        >
          <Nav variant="tabs" className="mb-3 border-bottom">
            <Nav.Item>
              <Nav.Link eventKey="camera" className="d-flex align-items-center gap-2">
                <Camera size={16} />
                <span>Kamera ile Tara</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="upload" className="d-flex align-items-center gap-2">
                <Upload size={16} />
                <span>Fotoğraf Yükle</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Camera Scanning Tab */}
            <Tab.Pane eventKey="camera">
              {cameraError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 small">
                  <AlertCircle size={16} />
                  <span>{cameraError}</span>
                </Alert>
              )}

              <div
                className="overflow-hidden bg-dark rounded position-relative mb-3 mx-auto"
                style={{ width: '100%', maxWidth: '360px', height: '240px' }}
              >
                {/* Scanner reader container */}
                <div id={elementId} style={{ width: '100%', height: '100%' }} />

                {/* Laser scan animation overlay */}
                {isCameraActive && (
                  <div
                    className="position-absolute w-100 bg-primary opacity-50"
                    style={{
                      height: '2px',
                      top: '15%',
                      left: 0,
                      animation: 'scanLaser 2.2s infinite ease-in-out',
                      boxShadow: '0 0 8px var(--bs-primary)',
                      zIndex: 2,
                    }}
                  />
                )}
              </div>
              <div className="text-center text-muted small">
                Cihazın arkasındaki S/N veya barkodu tarama alanı içine hizalayın.
              </div>
            </Tab.Pane>

            {/* Upload Photo Tab */}
            <Tab.Pane eventKey="upload">
              {uploadError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 small">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </Alert>
              )}

              <div
                className="border border-2 border-dashed rounded d-flex flex-column align-items-center justify-content-center p-4 bg-light cursor-pointer text-center"
                style={{ height: '200px', borderColor: '#dee2e6' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={36} className="text-secondary mb-3" />
                <span className="fw-medium text-dark small mb-1">
                  Barkod içeren bir fotoğraf seçin veya sürükleyin
                </span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  PNG, JPG veya JPEG (Max 10MB)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Kapat
        </Button>
      </Modal.Footer>

      {/* Embedded laser scan keyframes */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 15%; }
          50% { top: 85%; }
          100% { top: 15%; }
        }
        #${elementId} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
      <div id="barcode-file-reader-element" className="d-none" />
    </Modal>
  );
};

export default BarcodeScannerModal;
