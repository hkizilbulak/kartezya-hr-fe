import axiosInstance from "@/helpers/api/axiosInstance";
import { SendReportEmailPayload } from "./types";
import { APIResponse } from "@/services/base.service";

export async function sendReportEmail(payload: SendReportEmailPayload): Promise<APIResponse<void>> {
  try {
    const formData = new FormData();
    formData.append("subject", payload.subject);
    formData.append("body", payload.body);
    formData.append("report_type", payload.reportType);
    formData.append("filters", JSON.stringify(payload.filters));
    formData.append("attachment", payload.attachment, payload.fileName);

    const response = await axiosInstance.post("/reports/email", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
