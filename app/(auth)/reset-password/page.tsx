"use client";
import { Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import useMounted from "@/hooks/useMounted";
import { authService, ResetPasswordRequest, ValidateResetTokenRequest } from "@/services/auth.service";
import FormTextField from "@/components/FormTextField";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const ResetPasswordContent = () => {
  const hasMounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        toast.error('Şifre sıfırlama bağlantısı geçersiz. Lütfen e-posta adresinizdeki bağlantıyı kontrol ediniz.');
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        const request: ValidateResetTokenRequest = {
          token,
          email: decodeURIComponent(email)
        };
        
        const response = await authService.validateResetToken(request);
        
        if (response.success) {
          setTokenValid(true);
          setUserEmail(decodeURIComponent(email));
        }
      } catch (err: any) {
        toast.error(err.message || 'Token doğrulaması başarısız oldu. Lütfen yeni bir şifre sıfırlama talebi gönderin.');
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'newPassword':
        if (!value) return "Yeni şifre zorunludur";
        if (value.length < 6) return "Şifre en az 6 karakter olmalıdır";
        break;
      case 'confirmPassword':
        if (!value) return "Şifre doğrulama zorunludur";
        if (value !== formData.newPassword) return "Şifreler eşleşmiyor";
        break;
    }
    return undefined;
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Also revalidate confirmPassword when newPassword changes
    if (name === 'newPassword' && touched.confirmPassword) {
      const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
    }
  };

  const handleInputBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof FormData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    newErrors.newPassword = validateField('newPassword', formData.newPassword);
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    
    setErrors(newErrors);
    setTouched({ newPassword: true, confirmPassword: true });
    
    return !newErrors.newPassword && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!token || !email) {
      toast.error('Şifre sıfırlama bağlantısı geçersiz.');
      return;
    }

    try {
      setIsLoading(true);
      
      const request: ResetPasswordRequest = {
        token,
        email: decodeURIComponent(email),
        new_password: formData.newPassword
      };

      const response = await authService.resetPassword(request);

      if (response.success) {
        toast.success('Şifreniz başarıyla sıfırlanmıştır. Yeni şifrenizle giriş yapabilirsiniz.');
        setSuccess('Şifreniz başarıyla sıfırlanmıştır. Yeni şifrenizle giriş yapabilirsiniz.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || "Şifre sıfırlama sırasında bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
          <Card className="smooth-shadow-md">
            <Card.Body className="p-6 text-center">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p>Şifre sıfırlama bağlantısı doğrulanıyor...</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  if (!tokenValid || !userEmail) {
    return (
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
          <Card className="smooth-shadow-md">
            <Card.Body className="p-6">
              <div className="d-flex justify-content-center align-items-center mb-6">
                <p className="h3 fw-bold">Şifre Sıfırlama</p>
              </div>

              <div className="text-center">
                <p className="mb-3">Yeni bir şifre sıfırlama talebi göndermek için lütfen giriş sayfasına dönün.</p>
                <Link href="/login" className="btn btn-primary">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  const isFormValid = !errors.newPassword && !errors.confirmPassword && formData.newPassword && formData.confirmPassword;

  return (
    <Row className="align-items-center justify-content-center g-0 min-vh-100">
      <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
        <Card className="smooth-shadow-md">
          <Card.Body className="p-6">
            <div className="d-flex justify-content-center align-items-center mb-6">
              <p className="h3 fw-bold">Şifre Sıfırlama</p>
            </div>

            {hasMounted && !success && (
              <>
                <Form noValidate onSubmit={handleSubmit}>
                  <FormTextField
                    as={Col}
                    md={12}
                    controlId="validationNewPassword"
                    label="Yeni Şifre"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    error={touched.newPassword ? errors.newPassword : undefined}
                  />
                  
                  <FormTextField
                    as={Col}
                    md={12}
                    controlId="validationConfirmPassword"
                    label="Şifre Doğrulama"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    error={touched.confirmPassword ? errors.confirmPassword : undefined}
                  />

                  <div className="d-grid mt-4">
                    <Button
                      disabled={!isFormValid || isLoading}
                      variant="primary"
                      size="lg"
                      type="submit"
                    >
                      {isLoading ? "İşleniyor..." : "Şifremi Sıfırla"}
                    </Button>
                  </div>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    <small>
                      <Link href="/login" className="text-decoration-none">
                        Giriş sayfasına dön
                      </Link>
                    </small>
                  </p>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

const ResetPassword = () => {
  return (
    <Suspense fallback={
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
          <Card className="smooth-shadow-md">
            <Card.Body className="p-6 text-center">
              <Spinner animation="border" variant="primary" />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPassword;
