export type ReportType = "work-day" | "effort" | "contract" | "grade";

export interface GenerateReportSubjectParams {
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  companyName?: string;
  departmentName?: string;
}

export interface SendReportEmailPayload {
  subject: string;
  body: string;
  reportType: string;
  filters: Record<string, unknown>;
  attachment: Blob;
  fileName: string;
}
