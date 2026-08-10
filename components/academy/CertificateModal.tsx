'use client';
import { useRef, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { TrainingCertificate } from '@/services/academy.service';

interface Props {
  certificate: TrainingCertificate;
  onClose: () => void;
}

export default function CertificateModal({ certificate, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const { training, employee, issued_at, certificate_code } = certificate;
  const employeeName = employee
    ? `${employee.first_name} ${employee.last_name}`
    : 'Değerli Çalışanımız';
  const issueDate = new Date(issued_at).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const handleDownload = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sertifika-${certificate_code}.pdf`);
    } catch (e) {
      console.error('PDF oluşturma hatası:', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="xl" centered backdrop="static">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: 'none' }}>
        <Modal.Title className="text-white" style={{ fontSize: 15, fontWeight: 600 }}>
          <i className="fe fe-award me-2" />Sertifika Önizleme
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ background: '#f8fafc' }}>
        {/* ── A4 Landscape Certificate ── */}
        <div
          ref={certRef}
          style={{
            width: '100%',
            maxWidth: 1040,
            margin: '0 auto',
            aspectRatio: '297/210',
            background: 'white',
            borderRadius: 0,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background gradient decorations */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #f8f7ff 0%, #fefefe 50%, #f0fdf4 100%)',
          }} />

          {/* Top decorative border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 10,
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #10b981 100%)',
          }} />

          {/* Bottom decorative border */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 10,
            background: 'linear-gradient(90deg, #10b981 0%, #8b5cf6 60%, #6366f1 100%)',
          }} />

          {/* Left accent */}
          <div style={{
            position: 'absolute', top: 10, bottom: 10, left: 0,
            width: 8,
            background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%)',
          }} />

          {/* Right accent */}
          <div style={{
            position: 'absolute', top: 10, bottom: 10, right: 0,
            width: 8,
            background: 'linear-gradient(180deg, #10b981 0%, #8b5cf6 50%, #6366f1 100%)',
          }} />

          {/* Corner ornaments */}
          {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              ...(pos.includes('top') ? { top: 16 } : { bottom: 16 }),
              ...(pos.includes('Left') ? { left: 16 } : { right: 16 }),
              width: 48, height: 48,
              border: '3px solid',
              borderColor: pos.includes('top') ? '#6366f133' : '#10b98133',
              borderRadius: pos === 'topLeft' ? '60% 0 40% 0' : pos === 'topRight' ? '0 60% 0 40%' : pos === 'bottomLeft' ? '0 40% 0 60%' : '40% 0 60% 0',
            }} />
          ))}

          {/* Main content */}
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 80px',
            textAlign: 'center',
          }}>
            {/* Logo + Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>K</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  Kartezya Akademi
                </div>
                <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Eğitim & Sertifikasyon
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{
              width: 120, height: 3,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: 2, marginBottom: 18,
            }} />

            {/* Certificate title */}
            <div style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 5,
              color: '#6b7280',
              marginBottom: 8,
              fontWeight: 500,
            }}>
              Başarı Sertifikası
            </div>

            <div style={{
              fontSize: 10, color: '#9ca3af', marginBottom: 18, letterSpacing: 0.5,
            }}>
              Bu belge aşağıdaki kişinin belirtilen eğitimi başarıyla tamamladığını onaylar
            </div>

            {/* Employee name */}
            <div style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#1e1b4b',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              marginBottom: 14,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {employeeName}
            </div>

            {/* Training title */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f7ff, #e8f4ff)',
              border: '1px solid #c7d9f5',
              borderRadius: 12,
              padding: '12px 32px',
              marginBottom: 20,
              maxWidth: 640,
            }}>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                Eğitim Programı
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a6e' }}>
                {training.title}
              </div>
            </div>

            {/* Meta info row */}
            <div style={{ display: 'flex', gap: 40, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Sertifika Tarihi</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{issueDate}</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Sertifika No</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{certificate_code}</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Eğitim Durumu</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>✓ Tamamlandı</div>
              </div>
            </div>

            {/* Signature line */}
            <div style={{ display: 'flex', gap: 80 }}>
              {['Eğitim Yöneticisi', 'İnsan Kaynakları'].map((role, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 140, height: 1,
                    background: 'linear-gradient(90deg, transparent, #9ca3af, transparent)',
                    marginBottom: 6,
                  }} />
                  <div style={{ fontSize: 10, color: '#6b7280' }}>{role}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>Kartezya Akademi</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ background: '#f8fafc', border: 'none', padding: '16px 24px' }}>
        <Button variant="outline-secondary" onClick={onClose} style={{ borderRadius: 8 }}>
          Kapat
        </Button>
        <Button
          onClick={handleDownload}
          disabled={generating}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            padding: '8px 20px',
          }}
        >
          {generating ? (
            <><Spinner size="sm" animation="border" className="me-2" />PDF Oluşturuluyor...</>
          ) : (
            <><i className="fe fe-download me-2" />PDF İndir (A4)</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
