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
  GRADES: '/grades',
  GRADES_LOOKUP: '/lookup/grades',
  // Employees
  EMPLOYEES: '/employees',
  // Employee Grades
  EMPLOYEE_GRADES: '/employee-grades',
  // Employee Contracts
  EMPLOYEE_CONTRACTS: '/employee-contracts',
  // Contracts
  CONTRACTS: '/contracts',
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
    BALANCES: '/leave/balances',
    BALANCES_ME: '/leave/balances/me'
  }
}

// CV Search API
export const CV_SEARCH_API_BASE_URL =
  process.env.NEXT_PUBLIC_CV_SEARCH_API_URL ||
  'https://cv-search-production.up.railway.app/api'

export const CV_SEARCH_ENDPOINTS = {
  BULK_UPLOAD: '/cv/bulk-upload',
  BATCH_STATUS: '/cv/batch',
  HYBRID_SEARCH: '/search/hybrid',
  // Candidates
  CANDIDATES: '/candidates',
  // Search
  POPULAR_QUERIES: '/search/popular-queries',
  SUGGEST: '/search/suggest',
}
