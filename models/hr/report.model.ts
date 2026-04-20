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
	team_start_date: string | null;
	team_end_date: string | null;
	hire_date: string | null;
	leave_date: string | null;
	work_days: number;
	used_leave_days: number;
	worked_days: number;
	current_grade: string;
}

export interface WorkDayReportResponse {
	start_date: string;
	end_date: string;
	total_work_days: number;
	total_holiday_days: number;
	rows: WorkDayReportRow[];
}

export interface EforReportRow {
	id: number;
	first_name: string;
	last_name: string;
	identity_no: string;
	company_name: string;
	department_name: string;
	manager: string;
	current_grade: string;
	grade: string;
	rate: string;
	january: number;
	february: number;
	march: number;
	april: number;
	may: number;
	june: number;
	july: number;
	august: number;
	september: number;
	october: number;
	november: number;
	december: number;
	worked_days: number;
}

export interface EforReportResponse {
	start_date: string;
	end_date: string;
	total_work_days: number;
	rows: EforReportRow[];
}

export interface GradeReportRow {
	id: number;
	first_name: string;
	last_name: string;
	hire_date: string | null;
	company_name: string;
	department_name: string;
	manager: string;
	team_start_date: string | null;
	profession_start_date: string | null;
	total_gap: number;
	total_experience_text: string;
	current_grade: string;
	expected_grade: string;
}

export interface GradeReportResponse {
	rows: GradeReportRow[];
}
