"use client";
import { Container } from 'react-bootstrap';
import EmployeeExpenseRequests from '@/components/expense/EmployeeExpenseRequests';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const MyExpenseRequests = () => {
  return (
    <Container fluid className="page-container">
      <EmployeeExpenseRequests />
    </Container>
  );
};

export default MyExpenseRequests;
