"use client";

import { Container } from 'react-bootstrap';
import AdminOtherRequests from '@/components/other-requests/AdminOtherRequests';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const AdminOtherRequestsPage = () => {
  return (
    <Container fluid className="page-container">
      <AdminOtherRequests />
    </Container>
  );
};

export default AdminOtherRequestsPage;