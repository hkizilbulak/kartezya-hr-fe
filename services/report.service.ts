import {
  WorkDayReportResponse,
  EforReportResponse,
  GradeReportResponse,
  ContractReportResponse,
} from "@/models/hr/report.model";
import axiosInstance from "@/helpers/api/axiosInstance";

export interface OrderedColumnItem {
  key: string;
  label: string;
}

export interface GradeReportExportPayload {
  companyId?: number;
  departmentId?: number;
  departmentIds?: number[];
  title?: string;
}

const appendCsvArrayParam = (
  params: URLSearchParams,
  key: string,
  values?: Array<number | string> | string,
) => {
  if (values === undefined || values === null) {
    return;
  }

  const normalizedValues = Array.isArray(values)
    ? values.map((value) => String(value).trim()).filter(Boolean)
    : String(values)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  if (normalizedValues.length > 0) {
    params.append(key, normalizedValues.join(","));
  }
};

export const reportService = {
  /**
   * Get work day report
   */
  async getWorkDayReport(
    startDate: string,
    endDate: string,
    companyId?: number,
    departmentId?: number | Array<number | string> | string,
    isActive?: boolean,
    title?: string,
  ): Promise<WorkDayReportResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    if (companyId) {
      params.append("company_id", companyId.toString());
    }

    if (Array.isArray(departmentId) || typeof departmentId === "string") {
      appendCsvArrayParam(params, "department_ids", departmentId);
    } else if (departmentId) {
      params.append("department_id", departmentId.toString());
    }

    if (isActive !== undefined) {
      params.append("is_active", isActive.toString());
    }

    if (title) {
      params.append("title", title);
    }

    const response = await axiosInstance.get(
      `/reports/work-day?${params.toString()}`,
    );

    return response.data as WorkDayReportResponse;
  },

  /**
   * Get efor report
   */
  async getEforReport(
    startDate: string,
    endDate: string,
    companyId?: number,
    departmentId?: number | Array<number | string> | string,
    isActive?: boolean,
    title?: string,
  ): Promise<EforReportResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    if (companyId) {
      params.append("company_id", companyId.toString());
    }

    if (Array.isArray(departmentId) || typeof departmentId === "string") {
      appendCsvArrayParam(params, "department_ids", departmentId);
    } else if (departmentId) {
      params.append("department_id", departmentId.toString());
    }

    if (isActive !== undefined) {
      params.append("is_active", isActive.toString());
    }

    if (title) {
      params.append("title", title);
    }

    const response = await axiosInstance.get(
      `/reports/efor?${params.toString()}`,
    );

    return response.data as EforReportResponse;
  },

  /**
   * Get grade report
   */
  async getGradeReport(
    companyId?: number,
    departmentId?: number | Array<number | string> | string,
    isActive?: boolean,
  ): Promise<GradeReportResponse> {
    const params = new URLSearchParams({});
    if (companyId) {
      params.append("company_id", companyId.toString());
    }

    if (Array.isArray(departmentId) || typeof departmentId === "string") {
      appendCsvArrayParam(params, "department_ids", departmentId);
    } else if (departmentId) {
      params.append("department_id", departmentId.toString());
    }

    if (isActive !== undefined) {
      params.append("is_active", isActive.toString());
    }

    const response = await axiosInstance.get(
      `/reports/grade?${params.toString()}`,
    );

    return response.data as GradeReportResponse;
  },

  async requestGradeReportExport(
    payload: GradeReportExportPayload,
  ): Promise<Blob> {
    const response = await axiosInstance.post(
      "/reports/grade/export",
      payload,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  async downloadGradeReportExcel(
    payload: GradeReportExportPayload & { columns: OrderedColumnItem[] },
  ): Promise<void> {
    const apiPayload = {
      company_id: payload.companyId,
      department_ids: payload.departmentIds,
      export_columns: payload.columns.map((c) => ({
        key: c.key,
        label: c.label,
      })),
    };

    const response = await axiosInstance.post(
      "/reports/grade/export/excel",
      apiPayload,
      {
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rapor.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getContractReport(filter: {
    startDate?: string;
    endDate?: string;
    companyId?: number;
    departmentIds?: number[];
    isActive?: boolean;
  }): Promise<ContractReportResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) {
      params.append("start_date", filter.startDate);
    }
    
    if (filter.endDate) {
      params.append("end_date", filter.endDate);
    }

    if (filter.companyId) {
      params.append("company_id", filter.companyId.toString());
    }

    if (filter.departmentIds && filter.departmentIds.length > 0) {
      params.append("department_ids", filter.departmentIds.join(","));
    }

    if (filter.isActive !== undefined) {
      params.append("is_active", filter.isActive.toString());
    }

    console.log(
      "Contract Report Filter",
      filter,
      "URL:",
      `/reports/contract?${params.toString()}`,
    );
    const response = await axiosInstance.get<ContractReportResponse>(
      `/reports/contract?${params.toString()}`,
    );
    return response.data;
  },

  async downloadContractReportExcel(payload: {
    startDate?: string;
    endDate?: string;
    companyId?: number;
    departmentIds?: number[];
    columns: OrderedColumnItem[];
  }): Promise<void> {
    const apiPayload = {
      start_date: payload.startDate,
      end_date: payload.endDate,
      company_id: payload.companyId,
      department_ids: payload.departmentIds,
      export_columns: payload.columns.map((c) => ({
        key: c.key,
        label: c.label,
      })),
    };

    const response = await axiosInstance.post(
      "/reports/contract/export/excel",
      apiPayload,
      {
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `SözleşmeRaporu.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
