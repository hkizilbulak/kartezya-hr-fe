export interface WorkDayReportFilter {
	startDate: string;
	endDate: string;
	companyId?: number;
	departmentId?: number;
	isActive: boolean;
}

export interface WorkDayReportRow {
	id: number;
	first_name: string;
	last_name: string;
	identity_no: string;
	company_name: string;
	department_name: string;
	manager: string;
	work_days: number;
	holiday_days: number;
	used_leave_days: number;
	worked_days: number;
}

export interface WorkDayReportResponse {
	start_date: string;
	end_date: string;
	total_work_days: number;
	total_holiday_days: number;
	rows: WorkDayReportRow[];
}
