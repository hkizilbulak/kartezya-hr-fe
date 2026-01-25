"use client";
import { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormTextField from '@/components/FormTextField';
import { authService, ChangePasswordRequest } from '@/services/auth.service';
import useMounted from '@/hooks/useMounted';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';

interface ChangePasswordModalProps {
  show: boolean;
  onHide: () => void;
}

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordModal = ({ show, onHide }: ChangePasswordModalProps) => {
  const hasMounted = useMounted();
  const [isLoading, setIsLoading] = useState(false);

  const initialValues: FormData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string()
      .required('Mevcut şifre zorunludur'),
    newPassword: Yup.string()
      .required('Yeni şifre zorunludur')
      .min(6, 'Şifre en az 6 karakter olmalıdır')
      .notOneOf(
        [Yup.ref('currentPassword')],
        'Yeni şifre mevcut şifre ile aynı olamaz'
      ),
    confirmPassword: Yup.string()
      .required('Şifre doğrulama zorunludur')
      .oneOf([Yup.ref('newPassword')], 'Şifreler eşleşmiyor'),
  });

  const handleSubmit = async (values: FormData, { resetForm }: any) => {
    try {
      setIsLoading(true);

      const request: ChangePasswordRequest = {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      };

      const response = await authService.changePassword(request);

      if (response.success) {
        toast.success('Şifreniz başarıyla değiştirilmiştir.');
        resetForm();
        onHide();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Şifre değiştirme sırasında bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <div className="position-relative">
        <LoadingOverlay show={isLoading} message="Şifre değiştiriliyor..." />
        
        <Modal.Header closeButton>
          <Modal.Title>Şifre Değişikliği</Modal.Title>
        </Modal.Header>

        {hasMounted && (
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isValid, isSubmitting, errors, touched, values }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Modal.Body>
                  <FormTextField
                    controlId="validationCurrentPassword"
                    label="Mevcut Şifre"
                    type="password"
                    name="currentPassword"
                    disabled={isLoading}
                  />

                  <FormTextField
                    controlId="validationNewPassword"
                    label="Yeni Şifre"
                    type="password"
                    name="newPassword"
                    disabled={isLoading}
                  />

                  <FormTextField
                    controlId="validationConfirmPassword"
                    label="Şifre Doğrulama"
                    type="password"
                    name="confirmPassword"
                    disabled={isLoading}
                  />
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isSubmitting || isLoading}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!isValid || isSubmitting || isLoading}
                  >
                    {isSubmitting || isLoading ? 'İşleniyor...' : 'Şifre Değiştir'}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
