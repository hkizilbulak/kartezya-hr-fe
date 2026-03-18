"use client";
import { Container } from 'react-bootstrap';
import EmployeeLeaveRequests from '@/components/leave/EmployeeLeaveRequests';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const MyLeaveRequests = () => {
  return (
    <Container fluid className="page-container">
      <EmployeeLeaveRequests />
    </Container>
  );
};

export default MyLeaveRequests;
