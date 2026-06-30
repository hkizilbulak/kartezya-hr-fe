"use client";

import { Container } from 'react-bootstrap';
import EmployeeOtherRequests from '@/components/other-requests/EmployeeOtherRequests';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const MyOtherRequestsPage = () => {
  return (
    <Container fluid className="page-container">
      <EmployeeOtherRequests />
    </Container>
  );
};

export default MyOtherRequestsPage;