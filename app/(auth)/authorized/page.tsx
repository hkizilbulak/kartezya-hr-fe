"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";

const AuthorizedPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processYandexCallback = async () => {
      try {
        // URL parametrelerinden code ve cid'yi al
        const code = searchParams.get('code');
        const cid = searchParams.get('cid');

        if (!code) {
          setError('Authorization code bulunamadı');
          toast.error('Giriş başarısız: Yetkilendirme kodu eksik');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('Yandex Authorization Code:', code);
        console.log('Client ID:', cid);

        // Backend'e Yandex login isteği gönder
        const response = await authService.yandexLogin({ 
          code, 
          cid: cid || undefined 
        });

        if (response.success) {
          toast.success('Yandex ile giriş başarılı!');
          setTimeout(() => router.replace('/'), 500);
        } else {
          throw new Error('Giriş başarısız');
        }
        
      } catch (err: any) {
        console.error('Yandex login error:', err);
        setError(err.message || 'Bir hata oluştu');
        toast.error('Giriş başarısız: ' + (err.message || 'Bilinmeyen hata'));
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processYandexCallback();
  }, [searchParams, router]);

  return (
    <Row className="align-items-center justify-content-center g-0 min-vh-100" style={{ backgroundColor: '#000000' }}>
      <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
        <Card style={{ 
          backgroundColor: '#212b36', 
          border: 'none',
          boxShadow: '0 1rem 3rem rgba(255, 255, 255, 0.15)'
        }}>
          <Card.Body className="p-6">
            <div className="d-flex flex-column justify-content-center align-items-center">
              <div className="mb-4">
                <img 
                  src="https://kartezya.com/wp-content/uploads/2025/02/togetherBoyut2.svg" 
                  alt="Kartezya HR" 
                  style={{ minWidth: '300px', maxWidth: '400px', height: 'auto' }}
                />
              </div>

              {isProcessing ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <p className="text-muted">Yandex ile giriş yapılıyor...</p>
                  <p className="text-muted small">Lütfen bekleyin...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <div className="text-danger mb-3">
                    <svg 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-danger fw-bold">Giriş Başarısız</p>
                  <p className="text-muted small">{error}</p>
                  <p className="text-muted small mt-3">Login sayfasına yönlendiriliyorsunuz...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-success mb-3">
                    <svg 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <p className="text-success fw-bold">Giriş Başarılı</p>
                  <p className="text-muted small">Dashboard'a yönlendiriliyorsunuz...</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AuthorizedPage;
