import ExcelJS from 'exceljs';
import { WorkDayReportResponse, GradeReportResponse, GradeReportRow } from '@/models/hr/report.model';

export interface GradeExcelColumnConfig {
  key: string;
  label: string;
  width?: number;
  exportValue: (row: GradeReportRow, index: number) => string | number;
}

export const exportToExcel = async (reportData: WorkDayReportResponse) => {
  try {
    // Create a new workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rapor');

    // Format dates
    const startDate = new Date(reportData.start_date);
    const endDate = new Date(reportData.end_date);
    const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    let rowNum = 1;

    // Row 1: Title
    const titleRow = ws.addRow(['ÇALIŞMA GÜNÜ RAPORU']);
    ws.mergeCells(rowNum, 1, rowNum, 15); // Merge A1:L1
    titleRow.height = 24;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    rowNum++;

    // Row 2: Empty
    ws.addRow([]);
    rowNum++;

    // Row 3: Date range
    const dateRow = ws.addRow([`${formatDate(startDate)} - ${formatDate(endDate)}`]);
    ws.mergeCells(rowNum, 1, rowNum, 15); // Merge A3:L3
    dateRow.height = 18;
    const dateCell = dateRow.getCell(1);
    dateCell.font = { bold: true, size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    rowNum++;

    // Row 4: Empty
    ws.addRow([]);
    rowNum++;

    // Row 5: Toplam İş Günü
    const row5 = ws.addRow(['Toplam İş Günü:(Resmi Tatil Hariç)', Math.round(reportData.total_work_days)]);
    row5.getCell(1).font = { bold: true, size: 11 };
    row5.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row5.getCell(2).font = { bold: true, size: 11 };
    row5.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowNum++;

    // Row 6: Toplam Resmi Tatil
    const row6 = ws.addRow(['Toplam Resmi Tatil:', Math.round(reportData.total_holiday_days)]);
    row6.getCell(1).font = { bold: true, size: 11 };
    row6.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row6.getCell(2).font = { bold: true, size: 11 };
    row6.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowNum++;

    // Row 7: Toplam Çalışan Sayısı
    const row7 = ws.addRow(['Toplam Çalışan Sayısı:', reportData.rows?.length || 0]);
    row7.getCell(1).font = { bold: true, size: 11 };
    row7.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row7.getCell(2).font = { bold: true, size: 11 };
    row7.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowNum++;

    // Row 8: Empty
    ws.addRow([]);
    rowNum++;

    // Row 9: Empty
    ws.addRow([]);
    rowNum++;

    // Row 10: Headers
    const headerRow = ws.addRow([
      'SIRA NO',
      'ID',
      'AD',
      'SOYAD',
      'KİMLİK NO',
      'İŞE GİRİŞ TARİHİ',
      'İŞTEN AYRILIŞ TARİHİ',
      'ŞİRKET',
      'DEPARTMAN',
      'YÖNETİCİ',
      'TAKIMA BAŞLANGIÇ',
      'TAKIMDAN AYRILIŞ',
      'İŞ GÜNÜ',
      'KULLANILAN İZİN',
      'ÇALIŞILAN GÜN'
    ]);
    headerRow.height = 20;
    
    // Style header cells
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    rowNum++;

    // Add data rows
    if (reportData.rows && reportData.rows.length > 0) {
      // Sort rows by first_name and last_name
      const sortedRows = [...reportData.rows].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB, 'tr-TR');
      });

      sortedRows.forEach((row, index) => {
        const dataRow = ws.addRow([
          index + 1,
          row.id,
          row.first_name,
          row.last_name,
          row.identity_no,
          row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-',
          row.leave_date ? new Date(row.leave_date).toLocaleDateString('tr-TR') : '-',
          row.company_name,
          row.department_name,
          row.manager || '-',
          row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-',
          row.team_end_date ? new Date(row.team_end_date).toLocaleDateString('tr-TR') : '-',
          Math.round(row.work_days),
          row.used_leave_days.toFixed(1),
          row.worked_days.toFixed(1)
        ]);
        
        // Check if used_leave_days > 0 for yellow highlighting
        const isYellowRow = row.used_leave_days > 0 
        || reportData.total_work_days.toFixed(1) !== row.worked_days.toFixed(1);
        
        // Add borders and conditional formatting to data cells
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
          
          // Apply yellow background if used_leave_days > 0
          if (isYellowRow) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
          }
        });
      });
    }

    // Set column widths
    ws.columns = [
      { width: 10 },  // SIRA NO
      { width: 8 },   // ID
      { width: 15 },  // AD
      { width: 15 },  // SOYAD
      { width: 15 },  // KİMLİK NO
      { width: 15 },  // İŞE GİRİŞ TARİHİ
      { width: 20 },  // İŞTEN AYRILIŞ TARİHİ
      { width: 20 },  // ŞİRKET
      { width: 20 },  // DEPARTMAN
      { width: 20 },  // YÖNETİCİ
      { width: 20 },  // TAKIMA BAŞLANGIÇ
      { width: 20 },  // TAKIMDAN AYRILIŞ
      { width: 12 },  // İŞ GÜNÜ
      { width: 15 },  // KULLANILAN İZİN
      { width: 15 }   // ÇALIŞILAN GÜN
    ];

    // Generate filename
    const filename = `calismaguvu_raporu_${formatDate(startDate).replace(/\//g, '-')}.xlsx`;

    // Write file - browser downloads it
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel export hatası:', error);
    throw error;
  }
};

export const exportGradeToExcel = async (
  reportData: GradeReportResponse,
  columnsConfig?: GradeExcelColumnConfig[]
) => {
  try {
    // Create a new workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Grade Raporu');

    let rowNum = 1;

    // Row 1: Title
    const titleRow = ws.addRow(['GRADE RAPORU']);
    ws.mergeCells(rowNum, 1, rowNum, 12);
    titleRow.height = 24;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    rowNum++;

    // Row 2: Empty
    ws.addRow([]);
    rowNum++;

    // Row 5: Empty
    ws.addRow([]);
    rowNum++;

    const defaultColumnsConfig: GradeExcelColumnConfig[] = [
      {
        key: 'full_name',
        label: 'AD SOYAD',
        width: 25,
        exportValue: (row) => row.first_name + ' ' + row.last_name
      },
      {
        key: 'hire_date',
        label: 'İŞE GİR. TAR.',
        width: 15,
        exportValue: (row) => row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-'
      },
      {
        key: 'profession_start_date',
        label: 'MESLEĞE BAŞ. TAR.',
        width: 20,
        exportValue: (row) => row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-'
      },
      {
        key: 'total_experience_text',
        label: 'TOPLAM DENEYIM',
        width: 20,
        exportValue: (row) => row.total_experience_text || '-'
      },
      {
        key: 'current_grade',
        label: 'MEVCUT GRADE',
        width: 15,
        exportValue: (row) => row.current_grade || '-'
      },
      {
        key: 'expected_grade',
        label: 'BEKLENEN GRADE',
        width: 15,
        exportValue: (row) => row.expected_grade || '-'
      },
      {
        key: 'company_name',
        label: 'ŞİRKET',
        width: 20,
        exportValue: (row) => row.company_name
      },
      {
        key: 'department_name',
        label: 'DEPARTMAN',
        width: 20,
        exportValue: (row) => row.department_name
      },
      {
        key: 'manager',
        label: 'YÖNETİCİ',
        width: 20,
        exportValue: (row) => row.manager || '-'
      },
      {
        key: 'team_start_date',
        label: 'TAKIMA BAŞ. TAR.',
        width: 20,
        exportValue: (row) => row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-'
      }
    ];

    const activeColumns = columnsConfig && columnsConfig.length > 0 ? columnsConfig : defaultColumnsConfig;

    // Row 6: Headers
    const headerRow = ws.addRow(activeColumns.map((column) => column.label));
    headerRow.height = 20;
    
    // Style header cells
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    rowNum++;

    // Add data rows
    if (reportData.rows && reportData.rows.length > 0) {
      // Sort rows by first_name and last_name
      const sortedRows = [...reportData.rows].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB, 'tr-TR');
      });

      sortedRows.forEach((row, index) => {
        const dataRow = ws.addRow(activeColumns.map((column) => column.exportValue(row, index)));
        
        // Check if there's a gap for yellow highlighting
        const isYellowRow = row.current_grade !== row.expected_grade;
        
        // Add borders and conditional formatting to data cells
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
          
          // Apply yellow background if there's a gap
          if (isYellowRow) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
          }
        });
      });
    }

    // Set column widths
    ws.columns = activeColumns.map((column) => ({ width: column.width || 20 }));

    // Generate filename
    const today = new Date().toLocaleDateString('tr-TR').replace(/\//g, '-');
    const filename = `grade_raporu_${today}.xlsx`;

    // Write file - browser downloads it
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel export hatası:', error);
    throw error;
  }
};
