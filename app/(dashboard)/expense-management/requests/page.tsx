"use client";
import { Container } from 'react-bootstrap';
import AdminExpenseRequests from '@/components/expense/AdminExpenseRequests';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const ExpenseRequestsPage = () => {
  return (
    <Container fluid className="page-container">
      <AdminExpenseRequests />
    </Container>
  );
};

export default ExpenseRequestsPage;
