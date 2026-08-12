import AcademyDetailClient from './AcademyDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function AcademyDetailPage() {
  return <AcademyDetailClient />;
}
