"use client";
import { Container } from 'react-bootstrap';
import ExpenseTypeManagement from '@/components/expense/ExpenseTypeManagement';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const ExpenseTypesPage = () => {
  return (
    <Container fluid className="page-container">
      <ExpenseTypeManagement />
    </Container>
  );
};

export default ExpenseTypesPage;
