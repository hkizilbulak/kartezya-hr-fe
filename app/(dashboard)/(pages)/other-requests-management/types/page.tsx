"use client";

import { Container } from 'react-bootstrap';
import OtherRequestTypeManagement from '@/components/other-requests/OtherRequestTypeManagement';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const OtherRequestTypesPage = () => {
  return (
    <Container fluid className="page-container">
      <OtherRequestTypeManagement />
    </Container>
  );
};

export default OtherRequestTypesPage;