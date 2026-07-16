import React from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './EmployeeHeaderProfile.module.scss';

interface EmployeeHeaderProfileProps {
  employee?: {
    name: string;
    jobTitle: string;
    initials: string;
    company: string;
    department: string;
    manager: string;
    email: string;
    phone: string;
    address: string;
    totalExperience?: string;
  };
}

const defaultEmployee = {
  name: 'Ronald Richards',
  jobTitle: 'UI/UX Designer',
  initials: 'RR',
  company: 'Design Inc.',
  department: 'Designer',
  manager: 'Jerome Bell',
  email: 'ronald@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main St, New York, NY 10001',
};

export default function EmployeeHeaderProfile({
  employee = defaultEmployee
}: EmployeeHeaderProfileProps) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerCard}>
        <Row className="align-items-center g-4">
          <Col lg={3} md={12} className="d-flex align-items-center gap-3">
            <div className={styles.avatar}>{employee.initials}</div>
            <div className={styles.nameSection}>
              <h3 className={styles.name}>{employee.name}</h3>
              <p className={styles.jobTitle}>{employee.jobTitle}</p>
            </div>
          </Col>
          
          <Col lg={9} md={12}>
            <Row className="g-3">
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Şirket</span>
                  <span className={styles.infoValue}>{employee.company || '-'}</span>
                </div>
              </Col>
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Departman</span>
                  <span className={styles.infoValue} style={{ wordBreak: 'break-word' }}>{employee.department || '-'}</span>
                </div>
              </Col>
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Yönetici</span>
                  <span className={styles.infoValue}>{employee.manager || '-'}</span>
                </div>
              </Col>
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>E-Posta</span>
                  <span className={styles.infoValue} style={{ wordBreak: 'break-all' }}>{employee.email || '-'}</span>
                </div>
              </Col>
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Telefon</span>
                  <span className={styles.infoValue}>{employee.phone || '-'}</span>
                </div>
              </Col>
              <Col md={4} sm={6} xs={12}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Toplam Tecrübe</span>
                  <span className={styles.infoValue}>{employee.totalExperience || '-'}</span>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  );
}
