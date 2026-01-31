import { Row, Col, Button } from "react-bootstrap";

type IProps = {
  heading: string;
  showCreateButton?: boolean;
  showFilterButton?: boolean;
  createButtonText?: string;
  onCreate?: () => void;
  onToggleFilter?: () => void;
};

const PageHeading = ({
  heading,
  showCreateButton = true,
  showFilterButton = true,
  createButtonText,
  onCreate,
  onToggleFilter,
}: IProps) => {
  return (
    <Row>
      <Col lg={12} md={12} xs={12}>
        {/* Page header */}
        <div className="border-bottom pb-4 mt-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0 fw-bold">{heading}</h3>
            <div className="d-flex justify-content-end align-items-center gap-2">
              {showCreateButton && (
                <Button
                  className="d-flex align-items-center"
                  variant="primary"
                  onClick={onCreate}
                  style={{
                    fontWeight: 500,
                    textTransform: 'none'
                  }}
                >
                  <i className="fe fe-plus" style={{ marginRight: '0.5rem' }}></i>
                  <span className="d-none d-lg-flex">
                    {createButtonText || 'Yeni'}
                  </span>
                </Button>
              )}
              {showFilterButton && (
                <Button
                  className="d-flex align-items-center"
                  variant="warning"
                  onClick={onToggleFilter}
                  style={{
                    fontWeight: 500,
                    textTransform: 'none'
                  }}
                >
                  <i className="fe fe-filter" style={{ marginRight: '0.5rem' }}></i>
                  <span className="d-none d-lg-flex">Filtrele</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          @media (max-width: 768px) {
            .border-bottom {
              margin-bottom: 1rem;
            }
          }
        `}</style>
      </Col>
    </Row>
  );
};

export default PageHeading;
