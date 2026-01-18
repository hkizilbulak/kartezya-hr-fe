import { Modal, Button } from 'react-bootstrap';
import LoadingOverlay from './LoadingOverlay';

type IProps = {
    onClose: () => void;
    onHandleDelete: () => void;
    loading?: boolean;
    title?: string;
    message?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    loadingLabel?: string;
    variant?: 'danger' | 'warning';
}

export default function DeleteModal({ 
    onClose, 
    onHandleDelete, 
    loading = false,
    title = 'Silme Onayı',
    message = 'Silme işlemini onaylıyor musunuz?',
    cancelLabel = 'Kapat',
    confirmLabel = 'Sil',
    loadingLabel = 'Siliniyor...',
    variant = 'danger'
}: IProps) {
    return (
        <Modal show={true} onHide={onClose} size="sm">
            <div className="position-relative">
                <LoadingOverlay show={loading} message={loadingLabel} />
                
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{message}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={variant} onClick={onHandleDelete} disabled={loading}>
                        {loading ? loadingLabel : confirmLabel}
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
}