import React from 'react';
import { Button } from 'react-bootstrap';
import styles from './LeftProfileColumn.module.scss';

interface LeftProfileColumnProps {
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

export default function LeftProfileColumn({ 
  employee = defaultEmployee 
}: LeftProfileColumnProps) {
  return (
    <div className={styles.container}>
      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar}>{employee.initials}</div>
          <h3 className={styles.name}>{employee.name}</h3>
          <p className={styles.role}>{employee.jobTitle}</p>
        </div>

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>ŞİRKET</div>
            <div className={styles.infoValue}>{employee.company}</div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>DEPARTMAN</div>
            <div className={styles.infoValue}>{employee.department}</div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>YÖNETICI</div>
            <div className={styles.infoValue}>{employee.manager}</div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className={styles.contactCard}>
          <h4 className={styles.contactTitle}>İLETİŞİM BİLGİLERİ</h4>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>E-POSTA</div>
              <div className={styles.contactValue}>{employee.email}</div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>TELEFON</div>
              <div className={styles.contactValue}>{employee.phone}</div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactLabel}>ADRES</div>
              <div className={styles.contactValue}>{employee.address}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
