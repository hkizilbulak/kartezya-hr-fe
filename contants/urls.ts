export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const HR_API_BASE_URL = `${API_URL}/api/v1`

// HR API Endpoints
export const HR_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    VALIDATE_RESET_TOKEN: '/auth/validate-reset-token',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    YANDEX_CALLBACK: '/auth/yandex/callback'
  },
  // Companies
  COMPANIES: '/companies',
  // Departments
  DEPARTMENTS: '/departments',
  DEPARTMENTS_LOOKUP: '/departments/lookup',
  // Job Positions
  JOB_POSITIONS: '/job-positions',
  JOB_POSITIONS_LOOKUP: '/job-positions/lookup',
  // Grades
  GRADES_LOOKUP: '/lookup/grades',
  // Employees
  EMPLOYEES: '/employees',
  // Work Information
  WORK_INFORMATION: '/work-information',
  WORK_INFORMATION_ME: '/work-information/me',
  // Leave Management
  LEAVE: {
    BASE: '/leave',
    TYPES: '/leave/types',
    TYPES_LOOKUP: '/leave/types/lookup',
    REQUESTS: '/leave/requests',
    REQUESTS_ME: '/leave/requests/me',
    BALANCES_ME: '/leave/balances/me'
  }
}
