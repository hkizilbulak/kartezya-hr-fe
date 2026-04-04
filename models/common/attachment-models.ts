// Attachment Related Type Enum
export enum AttachmentRelatedType {
  EXPENSE = 1,
  LEAVE = 2,
  USER = 3,
  EMPLOYEE = 4,
  CONTRACT = 5,
}

// Attachment Type Enum
export enum AttachmentType {
  INVOICE = 1,
  MEDICAL_REPORT = 2,
  AVATAR = 3,
  RECEIPT = 4,
  CONTRACT = 5,
  IDENTITY = 6,
  DIPLOMA = 7,
  CERTIFICATE = 8,
  OTHER = 99,
}

// Attachment Status Enum
export enum AttachmentStatus {
  TEMPORARY = 1,
  LINKED = 2,
  ARCHIVED = 3,
}

export interface Attachment {
  id: string;
  owner_id: number;
  related_type: AttachmentRelatedType;
  related_id?: number;
  type: AttachmentType;
  status: AttachmentStatus;
  file_name: string;
  path: string;
  content_type: string;
  file_size: number;
  hash?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions
export const getAttachmentTypeName = (type: AttachmentType): string => {
  const names: Record<AttachmentType, string> = {
    [AttachmentType.INVOICE]: 'Fatura',
    [AttachmentType.MEDICAL_REPORT]: 'Sağlık Raporu',
    [AttachmentType.AVATAR]: 'Profil Resmi',
    [AttachmentType.RECEIPT]: 'Makbuz',
    [AttachmentType.CONTRACT]: 'Sözleşme',
    [AttachmentType.IDENTITY]: 'Kimlik',
    [AttachmentType.DIPLOMA]: 'Diploma',
    [AttachmentType.CERTIFICATE]: 'Sertifika',
    [AttachmentType.OTHER]: 'Diğer',
  };
  return names[type] || 'Bilinmeyen';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (contentType: string): string => {
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('image')) return '🖼️';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  return '📎';
};
