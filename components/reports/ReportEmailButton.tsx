"use client";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { Send } from "react-feather";
import { toast } from "react-toastify";
import { ReportType, generateReportSubject, generateReportBody, sendReportEmail } from "@/lib/reports";

interface ReportEmailButtonProps {
  reportType: ReportType;
  filters: Record<string, unknown>;
  disabled?: boolean;
  getExportBlob: () => Promise<Blob>;
  startDate?: string;
  endDate?: string;
  companyName?: string;
  departmentName?: string;
}

export default function ReportEmailButton({
  reportType,
  filters,
  disabled = false,
  getExportBlob,
  startDate,
  endDate,
  companyName,
  departmentName,
}: ReportEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const subject = generateReportSubject({
        reportType,
        startDate,
        endDate,
        companyName,
        departmentName,
      });
      const body = generateReportBody(subject);
      const blob = await getExportBlob();
      const fileName = `${subject}.xlsx`;

      await sendReportEmail({
        subject,
        body,
        reportType,
        filters,
        attachment: blob,
        fileName,
      });

      toast.success("Rapor email ile başarıyla gönderildi");
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Email gönderimi sırasında hata oluştu";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline-primary"
      onClick={handleSendEmail}
      disabled={disabled || isSending}
    >
      <Send size={18} className="me-2" style={{ display: "inline" }} />
      {isSending ? "Gönderiliyor..." : "Email ile Gönder"}
    </Button>
  );
}
