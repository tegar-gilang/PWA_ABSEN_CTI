import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ColumnDef {
  header: string;
  dataKey: string;
  width?: number; // optional width for PDF
}

interface ExportConfig {
  title: string;
  filename: string;
  columns: ColumnDef[];
  data: any[];
  dateRange?: string; // Menambahkan rentang tanggal opsional
}

export async function exportToExcel(config: ExportConfig) {
  const { title, filename, columns, data, dateRange } = config;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Title
  const titleRow = worksheet.addRow([title]);
  titleRow.font = { size: 14, bold: true };
  worksheet.mergeCells(1, 1, 1, columns.length);
  titleRow.getCell(1).alignment = { horizontal: 'center' };

  let headerRowIndex = 3;
  if (dateRange) {
    const dateRow = worksheet.addRow([`Periode: ${dateRange}`]);
    dateRow.font = { size: 11, italic: true };
    worksheet.mergeCells(2, 1, 2, columns.length);
    dateRow.getCell(1).alignment = { horizontal: 'center' };
    headerRowIndex = 4;
  } else {
    // Empty row if no dateRange
    worksheet.addRow([]);
  }

  // If dateRange was present, we add one empty row before table
  if (dateRange) {
    worksheet.addRow([]);
  }

  // Header Row
  const headerKeys = columns.map(c => c.header);
  const headerRow = worksheet.addRow(headerKeys);
  
  // Style Header
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Tailwind blue-600
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add Data
  data.forEach((item, index) => {
    const rowValues = columns.map(c => item[c.dataKey] !== undefined && item[c.dataKey] !== null ? item[c.dataKey] : '-');
    const row = worksheet.addRow(rowValues);
    
    // Style Data
    row.eachCell({ includeEmpty: true }, (cell) => {
      // Alternate row colors for better readability
      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // Tailwind slate-50
        };
      }
      
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Adjust Column Widths
  columns.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = Math.max(col.header.length + 5, 18);
  });

  // Save File
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}_${new Date().getTime()}.xlsx`);
}

export function exportToPDF(config: ExportConfig) {
  const { title, filename, columns, data } = config;
  const doc = new jsPDF('p', 'pt', 'a4');

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 40);

  // Subtitle/Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Tanggal Cetak: ${dateStr}`, 40, 60);

  let currentY = 80;
  if (config.dateRange) {
    doc.text(`Rentang Tanggal: ${config.dateRange}`, 40, 75);
    currentY = 95;
  }

  // Prepare table data
  const head = [columns.map(c => c.header)];
  const body = data.map(item => 
    columns.map(c => item[c.dataKey] !== undefined && item[c.dataKey] !== null ? String(item[c.dataKey]) : '-')
  );

  autoTable(doc, {
    head: head,
    body: body,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 9,
      font: 'helvetica',
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [37, 99, 235], // Tailwind blue-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      // Allow custom widths or wrap
      0: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Tailwind slate-50
    },
    margin: { top: 80, left: 40, right: 40, bottom: 40 },
    didDrawPage: (dataArg) => {
      // Footer
      const str = 'Halaman ' + (doc.internal as any).getNumberOfPages();
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, dataArg.settings.margin.left, pageHeight - 20);
    }
  });

  doc.save(`${filename}_${new Date().getTime()}.pdf`);
}
