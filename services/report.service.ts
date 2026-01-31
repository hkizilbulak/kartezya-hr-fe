import { BaseService, APIResponse } from './base.service';
import { WorkDayReportFilter, WorkDayReportResponse } from '@/models/hr/report.model';
import axiosInstance from '@/helpers/api/axiosInstance';

class ReportService {
	/**
	 * Get work day report
	 */
	async getWorkDayReport(
		startDate: string,
		endDate: string,
		companyId?: number,
		departmentId?: number,
		isActive?: boolean
	): Promise<WorkDayReportResponse> {
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
		});

		if (companyId) {
			params.append('company_id', companyId.toString());
		}

		if (departmentId) {
			params.append('department_id', departmentId.toString());
		}

		if (isActive !== undefined) {
			params.append('is_active', isActive.toString());
		}

		const response = await axiosInstance.get(
			`/reports/work-day?${params.toString()}`
		);

		return response.data as WorkDayReportResponse;
	}
}

export const reportService = new ReportService();
export default reportService;
