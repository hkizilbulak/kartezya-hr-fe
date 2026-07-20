import EmployeeDetailClient from './EmployeeDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function EmployeeDetailPage() {
  return <EmployeeDetailClient />;
}
