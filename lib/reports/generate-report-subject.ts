import { GenerateReportSubjectParams } from "./types";

const REPORT_TITLES: Record<string, string> = {
  "work-day": "Çalışma Günü Raporu",
  "effort": "Hakediş Efor Raporu",
  "contract": "Sözleşme Raporu",
  "grade": "Grade Raporu",
};

function formatDateTR(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildSuffix(companyName?: string, departmentName?: string): string {
  if (!companyName && !departmentName) return "";
  const parts = [companyName, departmentName].filter(Boolean).join(" / ");
  return ` (${parts})`;
}

export function generateReportSubject(params: GenerateReportSubjectParams): string {
  const { reportType, startDate, endDate, companyName, departmentName } = params;
  const title = REPORT_TITLES[reportType] || "Rapor";
  const suffix = buildSuffix(companyName, departmentName);

  if (reportType === "grade") {
    if (!companyName && !departmentName) return title;
    return `${title} - ${[companyName, departmentName].filter(Boolean).join(" / ")}`;
  }

  const dateRange = startDate && endDate
    ? ` - ${formatDateTR(startDate)} / ${formatDateTR(endDate)}`
    : "";

  return `${title}${dateRange}${suffix}`;
}
