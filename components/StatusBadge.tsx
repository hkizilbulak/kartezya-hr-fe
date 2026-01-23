import React from 'react';
import { Badge } from 'react-bootstrap';
import { CheckCircle, XCircle, Clock, AlertCircle, User, Calendar } from 'react-feather';
import { turkishToUpperCase } from '@/helpers/HelperUtils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'warning' | 'success' | 'danger' | 'info';
  text?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  text, 
  showIcon = true, 
  size = 'md' 
}) => {
  const getVariant = () => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'success':
        return 'success';
      case 'inactive':
      case 'rejected':
      case 'danger':
        return 'danger';
      case 'pending':
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'success':
        return <CheckCircle size={12} />;
      case 'inactive':
      case 'rejected':
      case 'danger':
        return <XCircle size={12} />;
      case 'pending':
        return <Clock size={12} />;
      case 'warning':
        return <AlertCircle size={12} />;
      default:
        return null;
    }
  };

  const getText = () => {
    if (text) return text;
    
    switch (status) {
      case 'active':
        return turkishToUpperCase('Aktif');
      case 'inactive':
        return turkishToUpperCase('Pasif');
      case 'pending':
        return turkishToUpperCase('Bekliyor');
      case 'approved':
        return turkishToUpperCase('Onaylandı');
      case 'rejected':
        return turkishToUpperCase('Reddedildi');
      case 'warning':
        return turkishToUpperCase('Uyarı');
      case 'success':
        return turkishToUpperCase('Başarılı');
      case 'danger':
        return turkishToUpperCase('Hata');
      case 'info':
        return turkishToUpperCase('Bilgi');
      default:
        return turkishToUpperCase('Bilinmiyor');
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'fs-7';
      case 'lg':
        return 'fs-6';
      default:
        return 'fs-7';
    }
  };

  return (
    <Badge 
      bg={getVariant()} 
      className={`d-inline-flex align-items-center gap-1 px-2 py-1 ${getSizeClass()}`}
      style={{
        fontWeight: '500',
        borderRadius: '6px',
        textTransform: 'none'
      }}
    >
      {showIcon && getIcon()}
      <span>{getText()}</span>
    </Badge>
  );
};

// Additional utility components for common table data
interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  imageUrl, 
  size = 32 
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="rounded-circle"
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
      style={{ 
        width: size, 
        height: size, 
        fontSize: size * 0.4,
        minWidth: size
      }}
    >
      {initials}
    </div>
  );
};

interface DateDisplayProps {
  date: string | Date;
  format?: 'short' | 'long' | 'time';
  showIcon?: boolean;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({ 
  date, 
  format = 'short', 
  showIcon = true 
}) => {
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    
    switch (format) {
      case 'long':
        return d.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'time':
        return d.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return d.toLocaleDateString('tr-TR');
    }
  };

  return (
    <div className="d-flex align-items-center gap-2 text-muted">
      {showIcon && <Calendar size={14} />}
      <span className="fs-7">{formatDate(date)}</span>
    </div>
  );
};

export default StatusBadge;