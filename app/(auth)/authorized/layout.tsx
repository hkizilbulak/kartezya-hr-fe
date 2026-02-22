'use client'
import { Container } from 'react-bootstrap';
import { useEffect } from 'react';

export default function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Body arka planını siyah yap
    document.body.style.backgroundColor = '#000000';
    
    // Cleanup: component unmount olduğunda eski renge dön
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <Container className="d-flex flex-column">
        {children}
      </Container>
    </div>
  )
}
