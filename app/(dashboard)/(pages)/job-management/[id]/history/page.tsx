import JobHistoryClient from './JobHistoryClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function JobHistoryPage() {
  return <JobHistoryClient />;
}
