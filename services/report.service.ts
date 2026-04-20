import { 
	WorkDayReportResponse,
	EforReportResponse,
	GradeReportResponse 
} from '@/models/hr/report.model';
import axiosInstance from '@/helpers/api/axiosInstance';

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
	values?: Array<number | string> | string
) => {
	if (values === undefined || values === null) {
		return;
	}

	const normalizedValues = Array.isArray(values)
		? values.map((value) => String(value).trim()).filter(Boolean)
		: String(values)
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);

	if (normalizedValues.length > 0) {
		params.append(key, normalizedValues.join(','));
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
		title?: string
	): Promise<WorkDayReportResponse> {
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
		});

		if (companyId) {
			params.append('company_id', companyId.toString());
		}

		if (Array.isArray(departmentId) || typeof departmentId === 'string') {
			appendCsvArrayParam(params, 'department_ids', departmentId);
		} else if (departmentId) {
			params.append('department_id', departmentId.toString());
		}

		if (isActive !== undefined) {
			params.append('is_active', isActive.toString());
		}

		if (title) {
			params.append('title', title);
		}

		const response = await axiosInstance.get(
			`/reports/work-day?${params.toString()}`
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
		title?: string
	): Promise<EforReportResponse> {
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
		});

		if (companyId) {
			params.append('company_id', companyId.toString());
		}

		if (Array.isArray(departmentId) || typeof departmentId === 'string') {
			appendCsvArrayParam(params, 'department_ids', departmentId);
		} else if (departmentId) {
			params.append('department_id', departmentId.toString());
		}

		if (isActive !== undefined) {
			params.append('is_active', isActive.toString());
		}

		if (title) {
			params.append('title', title);
		}

		const response = await axiosInstance.get(
			`/reports/efor?${params.toString()}`
		);

		return response.data as EforReportResponse;
	},

	/**
	 * Get grade report
	 */
	async getGradeReport(
		companyId?: number,
		departmentId?: number | Array<number | string> | string,
		isActive?: boolean
	): Promise<GradeReportResponse> {
		const params = new URLSearchParams({
		});
		if (companyId) {
			params.append('company_id', companyId.toString());
		}

		if (Array.isArray(departmentId) || typeof departmentId === 'string') {
			appendCsvArrayParam(params, 'department_ids', departmentId);
		} else if (departmentId) {
			params.append('department_id', departmentId.toString());
		}

		if (isActive !== undefined) {
			params.append('is_active', isActive.toString());
		}

		const response = await axiosInstance.get(
			`/reports/grade?${params.toString()}`
		);

		return response.data as GradeReportResponse;
	},

	async requestGradeReportExport(payload: GradeReportExportPayload): Promise<Blob> {
		const response = await axiosInstance.post('/reports/grade/export', payload, {
			responseType: 'blob',
		});
		return response.data;
	}
}