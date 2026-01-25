"use client";
import { Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import useMounted from "@/hooks/useMounted";
import { authService, ResetPasswordRequest, ValidateResetTokenRequest } from "@/services/auth.service";
import { Formik } from "formik";
import * as Yup from "yup";
import FormTextField from "@/components/FormTextField";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const hasMounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setError('Şifre sıfırlama bağlantısı geçersiz. Lütfen e-posta adresinizdeki bağlantıyı kontrol ediniz.');
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
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Token doğrulaması başarısız oldu. Lütfen yeni bir şifre sıfırlama talebi gönderin.');
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const initialValues: FormData = {
    newPassword: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object().shape({
    newPassword: Yup.string()
      .required("Yeni şifre zorunludur")
      .min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: Yup.string()
      .required("Şifre doğrulama zorunludur")
      .oneOf([Yup.ref('newPassword')], "Şifreler eşleşmiyor"),
  });

  const handleSubmit = async (values: FormData) => {
    if (!token || !email) {
      setError('Şifre sıfırlama bağlantısı geçersiz.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const request: ResetPasswordRequest = {
        token,
        email: decodeURIComponent(email),
        new_password: values.newPassword
      };

      const response = await authService.resetPassword(request);

      if (response.success) {
        setSuccess('Şifreniz başarıyla sıfırlanmıştır. Yeni şifrenizle giriş yapabilirsiniz.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Şifre sıfırlama sırasında bir hata oluştu");
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
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
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

  return (
    <Row className="align-items-center justify-content-center g-0 min-vh-100">
      <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
        <Card className="smooth-shadow-md">
          <Card.Body className="p-6">
            <div className="d-flex justify-content-center align-items-center mb-6">
              <p className="h3 fw-bold">Şifre Sıfırlama</p>
            </div>
            
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-4">
                {success}
              </Alert>
            )}

            {hasMounted && !success && (
              <>
                <p className="text-muted mb-4">
                  <small>E-posta: {userEmail}</small>
                </p>
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ handleSubmit, isValid, isSubmitting, errors, touched }) => (
                    <Form noValidate onSubmit={handleSubmit}>
                      <FormTextField
                        as={Col}
                        md={12}
                        controlId="validationNewPassword"
                        label="Yeni Şifre"
                        type="password"
                        name="newPassword"
                      />
                      
                      <FormTextField
                        as={Col}
                        md={12}
                        controlId="validationConfirmPassword"
                        label="Şifre Doğrulama"
                        type="password"
                        name="confirmPassword"
                      />

                      <div className="d-grid mt-4">
                        <Button
                          disabled={!isValid || isSubmitting || isLoading}
                          variant="primary"
                          as="input"
                          size="lg"
                          type="submit"
                          value={isSubmitting || isLoading ? "İşleniyor..." : "Şifremizi Sıfırla"}
                        />
                      </div>
                    </Form>
                  )}
                </Formik>

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

export default ResetPassword;
