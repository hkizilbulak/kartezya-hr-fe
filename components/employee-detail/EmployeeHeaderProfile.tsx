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
        {/* Üst Bölüm - Avatar, Ad Soyad, Şirket, Departman, Yönetici */}
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{employee.initials}</div>
            <div className={styles.nameSection}>
              <h3 className={styles.name}>{employee.name}</h3>
              <p className={styles.jobTitle}>{employee.jobTitle}</p>
            </div>
          </div>

          <div className={styles.headerMiddle}>
            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Şirket:</span>
                <span className={styles.infoValue}>{employee.company}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Departman:</span>
                <span className={styles.infoValue}>{employee.department}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Yönetici:</span>
                <span className={styles.infoValue}>{employee.manager}</span>
              </div>
            </div>

            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>E-Posta:</span>
                <span className={styles.infoValue}>{employee.email}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Telefon:</span>
                <span className={styles.infoValue}>{employee.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
