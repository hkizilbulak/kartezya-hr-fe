import CandidateDetailClient from './CandidateDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function CandidateDetailPage() {
  return <CandidateDetailClient />;
}
