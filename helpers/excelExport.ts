import ExcelJS from 'exceljs';
import { WorkDayReportResponse, GradeReportResponse, GradeReportRow, EforReportResponse } from '@/models/hr/report.model';
import { Employee } from '@/models/hr/hr-models';

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
    const row5 = ws.addRow(['Toplam İş Günü:(Resmi Tatil Hariç)', reportData.total_work_days]);
    row5.getCell(1).font = { bold: true, size: 11 };
    row5.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row5.getCell(2).font = { bold: true, size: 11 };
    row5.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowNum++;

    // Row 6: Toplam Resmi Tatil
    const row6 = ws.addRow(['Toplam Resmi Tatil:', reportData.total_holiday_days]);
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
      'AD SOYAD',
      'İŞ GÜNÜ',
      'KULLANILAN İZİN',
      'ÇALIŞILAN GÜN',
      'ŞİRKET',
      'DEPARTMAN',
      'YÖNETİCİ'
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
          `${row.first_name} ${row.last_name}`,
          parseFloat(row.work_days.toFixed(1)),
          row.used_leave_days.toFixed(1),
          row.worked_days.toFixed(1),
          row.company_name,
          row.department_name,
          row.manager || '-'
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
      { width: 25 },  // AD SOYAD
      { width: 12 },  // İŞ GÜNÜ
      { width: 15 },  // KULLANILAN İZİN
      { width: 15 },  // ÇALIŞILAN GÜN
      { width: 20 },  // ŞİRKET
      { width: 20 },  // DEPARTMAN
      { width: 20 }   // YÖNETİCİ
    ];

    // Generate filename
    const filename = `calismaguvu_raporu_${formatDate(startDate).replace(/\//g, '-')}.xlsx`;

    // Write file - browser downloads it
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Calisma_Gunu_Raporu_${formatDate(startDate)}-${formatDate(endDate)}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel creation error:', error);
    throw error;
  }
};

export const exportHakedisToExcel = async (reportData: EforReportResponse) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Detay');

    // Title Row
    const titleRow = ws.addRow(['Table 1: 2026 Planlanan Efor (Aylara/Personele Göre Dağılım)']);
    titleRow.font = { bold: true };
    ws.mergeCells(1, 1, 1, 17);

    // Subtitle Row
    const subtitleRow = ws.addRow(['', '', '', 'Aylara Göre İş Günü Sayıları']);
    subtitleRow.font = { bold: true };
    ws.mergeCells(2, 4, 2, 17);

    // Headers
    const headers = [
      'Ad-Soyad', 'Grade', 'Rate', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 
      'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık', 'Toplam', 'Hakediş'
    ];
    
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    
    // Widths
    ws.getColumn(1).width = 25; // Ad-Soyad
    ws.getColumn(2).width = 15; // Grade
    ws.getColumn(3).width = 10; // Rate
    for (let i = 4; i <= 17; i++) {
      ws.getColumn(i).width = 10; // Ayları ve Toplamı
    }

    // Data rows
    reportData.rows.forEach((row, index) => {
      let sum = (row.january || 0) + (row.february || 0) + (row.march || 0) + (row.april || 0) + (row.may || 0) + (row.june || 0) + (row.july || 0) + (row.august || 0) + (row.september || 0) + (row.october || 0) + (row.november || 0) + (row.december || 0);
      const currentRowNum = index + 4; // Title(1) + Subtitle(2) + Header(3) => Veri 4'ten başlar
      const dataRow = ws.addRow([
        `${row.first_name} ${row.last_name}`, // Ad-Soyad
        row.current_grade || '', // Grade
        0, // Rate
        parseFloat((row.january || 0).toFixed(1)), // Ocak
        parseFloat((row.february || 0).toFixed(1)), // Şubat
        parseFloat((row.march || 0).toFixed(1)), // Mart
        parseFloat((row.april || 0).toFixed(1)), // Nisan
        parseFloat((row.may || 0).toFixed(1)), // Mayıs
        parseFloat((row.june || 0).toFixed(1)), // Haziran
        parseFloat((row.july || 0).toFixed(1)), // Temmuz
        parseFloat((row.august || 0).toFixed(1)), // Ağustos
        parseFloat((row.september || 0).toFixed(1)), // Eylül
        parseFloat((row.october || 0).toFixed(1)), // Ekim
        parseFloat((row.november || 0).toFixed(1)), // Kasım
        parseFloat((row.december || 0).toFixed(1)), // Aralık
        { formula: `SUM(D${currentRowNum}:O${currentRowNum})`, result: parseFloat(sum.toFixed(1)) }, // Toplam
        { formula: `P${currentRowNum}*C${currentRowNum}`, result: 0 } // Hakediş
      ]);

      // Format Rate, ayları, Toplam, and Hakediş columns to be explicitly numeric
      dataRow.getCell(3).numFmt = '#,##0.##'; // Rate
      for (let i = 4; i <= 15; i++) {
        dataRow.getCell(i).numFmt = '0.0'; // Aylar
      }
      dataRow.getCell(16).numFmt = '0.0'; // Toplam
      dataRow.getCell(17).numFmt = '#,##0.##'; // Hakediş
      
      // Zebra striping similar to normal excel export
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
    });

    // Formatting for all cells
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (row.number > 2) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    });

    // Generate output
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hakedis_Efor_Raporu.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel creation error:', error);
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
        label: 'İŞE GİRİŞ',
        width: 15,
        exportValue: (row) => row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-'
      },
      {
        key: 'team_start_date',
        label: 'TAKIMA BAŞLANGIÇ',
        width: 20,
        exportValue: (row) => row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-'
      },
      {
        key: 'profession_start_date',
        label: 'MESLEĞE BAŞLANGIÇ',
        width: 20,
        exportValue: (row) => row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-'
      },
      {
        key: 'total_experience_text',
        label: 'TOPLAM DENEYİM',
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

export const exportEmployeesToExcel = async (employees: Employee[]) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Çalışanlar');

    // Title Row
    const titleRow = ws.addRow(['Çalışan Listesi']);
    titleRow.font = { bold: true, size: 14 };
    ws.mergeCells(1, 1, 1, 15);

    // Headers
    const headers = [
      'ID', 'Ad Soyad', 'E-posta', 'Şirket E-posta', 'Telefon', 
      'Cinsiyet', 'Durum', 'Şirket', 'Departman', 'Yönetici', 'Pozisyon', 
      'İşe Giriş Tarihi', 'Çıkış Tarihi', 'Doğum Tarihi', 'Mesleğe Başlangıç'
    ];
    
    // add an empty row after title
    ws.addRow([]);
    
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Widths
    ws.getColumn(1).width = 10; // ID
    ws.getColumn(2).width = 25; // Ad Soyad
    ws.getColumn(3).width = 30; // E-posta
    ws.getColumn(4).width = 30; // Şirket E-posta
    ws.getColumn(5).width = 15; // Telefon
    ws.getColumn(6).width = 10; // Cinsiyet
    ws.getColumn(7).width = 15; // Durum
    ws.getColumn(8).width = 20; // Şirket
    ws.getColumn(9).width = 20; // Departman
    ws.getColumn(10).width = 25; // Yönetici
    ws.getColumn(11).width = 20; // Pozisyon
    ws.getColumn(12).width = 15; // İşe Giriş Tarihi
    ws.getColumn(13).width = 15; // Çıkış Tarihi
    ws.getColumn(14).width = 15; // Doğum Tarihi
    ws.getColumn(15).width = 15; // Mesleğe Başlangıç

    // Data rows
    employees.forEach((emp, index) => {
      const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('tr-TR');
      };

      const dataRow = ws.addRow([
        emp.id,
        `${emp.first_name} ${emp.last_name}`,
        emp.email || '-',
        emp.company_email || '-',
        emp.phone || '-',
        emp.gender === 'MALE' ? 'Erkek' : emp.gender === 'FEMALE' ? 'Kadın' : '-',
        emp.status === 'ACTIVE' ? 'Çalışıyor' : 'Ayrıldı',
        emp.work_information?.company_name || '-',
        emp.work_information?.department_name || '-',
        emp.work_information?.manager || '-',
        emp.work_information?.job_title || '-',
        formatDate(emp.hire_date),
        formatDate(emp.leave_date),
        formatDate(emp.date_of_birth),
        formatDate(emp.profession_start_date)
      ]);
      
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
      
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Calisan_Listesi_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel generate error:', error);
    throw error;
  }
};
