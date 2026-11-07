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
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;

  let headerRowIndex = 3;
  if (dateRange) {
    const dateRow = worksheet.addRow([`Periode: ${dateRange}`]);
    dateRow.font = { size: 11, italic: true };
    worksheet.mergeCells(2, 1, 2, columns.length);
    dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    dateRow.height = 20;
    headerRowIndex = 4;
  } else {
    // Empty row if no dateRange
    const emptyRow = worksheet.addRow([]);
    emptyRow.height = 12;
  }

  // Header Row
  const headerKeys = columns.map(c => c.header);
  const headerRow = worksheet.addRow(headerKeys);
  headerRow.height = 26;
  
  // Style Header
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Tailwind blue-600
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
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
      
      // PASTI WRAP TEXT PADA SETIAP SEL DATA
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      cell.font = { size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Dynamic Column Widths & Column-level WrapText Setting
  columns.forEach((col, i) => {
    const colNumber = i + 1;
    const worksheetCol = worksheet.getColumn(colNumber);

    // Set lebar kolom yang proporsional agar wrap text bekerja ideal
    const headerLower = col.header.toLowerCase();
    let colWidth = 18;

    if (headerLower.includes('no.')) {
      colWidth = 7;
    } else if (headerLower.includes('nama')) {
      colWidth = 22;
    } else if (headerLower.includes('nik') || headerLower.includes('no induk') || headerLower.includes('id')) {
      colWidth = 18;
    } else if (headerLower.includes('tempat') || headerLower.includes('ttl')) {
      colWidth = 22;
    } else if (headerLower.includes('alamat')) {
      colWidth = 32; // Alamat lengkap diberikan lebar cukup + auto wrap text
    } else if (headerLower.includes('telepon') || headerLower.includes('phone')) {
      colWidth = 16;
    } else if (headerLower.includes('email')) {
      colWidth = 24;
    } else if (headerLower.includes('pekerjaan') || headerLower.includes('bagian')) {
      colWidth = 18;
    } else if (headerLower.includes('penempatan') || headerLower.includes('rs')) {
      colWidth = 20;
    } else if (headerLower.includes('shift')) {
      colWidth = 16;
    } else if (headerLower.includes('status')) {
      colWidth = 16;
    } else if (headerLower.includes('wilayah')) {
      colWidth = 18;
    } else if (headerLower.includes('tanggal') || headerLower.includes('tgl') || headerLower.includes('masa')) {
      colWidth = 15;
    }

    worksheetCol.width = colWidth;
    worksheetCol.alignment = { wrapText: true, vertical: 'top' };
  });

  // Save File
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}_${new Date().getTime()}.xlsx`);
}

export function exportToPDF(config: ExportConfig) {
  const { title, filename, columns, data } = config;
  
  // Jika kolom banyak (misal data karyawan dengan 16 kolom), selalu Landscape
  const isLandscape = columns.length > 6;
  const doc = new jsPDF(isLandscape ? 'l' : 'p', 'pt', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 25, 30);

  // Subtitle/Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Tanggal Cetak: ${dateStr}`, 25, 44);

  let currentY = 55;
  if (config.dateRange) {
    doc.text(`Periode: ${config.dateRange}`, 25, 54);
    currentY = 65;
  }

  // Prepare table data
  const head = [columns.map(c => c.header)];
  const body = data.map(item => 
    columns.map(c => item[c.dataKey] !== undefined && item[c.dataKey] !== null ? String(item[c.dataKey]) : '-')
  );

  // Konfigurasi ukuran font dan padding dinamis berdasarkan jumlah kolom
  const isDense = columns.length > 10;
  const fontSize = isDense ? 6.5 : (columns.length > 6 ? 7.5 : 9);
  const cellPadding = isDense ? 2.5 : 4;

  // Custom column styles agar kolom no sempit, alamat wrap lebar, dll
  const columnStyles: { [key: number]: any } = {};
  columns.forEach((col, idx) => {
    const h = col.header.toLowerCase();
    if (h === 'no.' || h === 'no') {
      columnStyles[idx] = { cellWidth: 24, halign: 'center' };
    } else if (h.includes('alamat')) {
      columnStyles[idx] = { cellWidth: isDense ? 85 : 120 };
    } else if (h.includes('nama')) {
      columnStyles[idx] = { cellWidth: isDense ? 65 : 80 };
    } else if (h.includes('nik') || h.includes('id') || h.includes('no. induk')) {
      columnStyles[idx] = { cellWidth: isDense ? 52 : 65 };
    } else if (h.includes('tempat') || h.includes('ttl')) {
      columnStyles[idx] = { cellWidth: isDense ? 55 : 70 };
    } else if (h.includes('email')) {
      columnStyles[idx] = { cellWidth: isDense ? 65 : 80 };
    }
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: fontSize,
      font: 'helvetica',
      cellPadding: cellPadding,
      overflow: 'linebreak', // AKTIFKAN AUTO WRAP TEXT
      valign: 'top',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [37, 99, 235], // Tailwind blue-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: fontSize + 0.5,
      overflow: 'linebreak'
    },
    columnStyles: columnStyles,
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Tailwind slate-50
    },
    margin: { top: 50, left: 20, right: 20, bottom: 30 },
    didDrawPage: (dataArg) => {
      // Footer
      const str = 'Halaman ' + (doc.internal as any).getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, dataArg.settings.margin.left, pageHeight - 15);
    }
  });

  doc.save(`${filename}_${new Date().getTime()}.pdf`);
}
