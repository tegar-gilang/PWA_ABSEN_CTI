import * as XLSX from 'xlsx';
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
}

export function exportToExcel(config: ExportConfig) {
  const { title, filename, columns, data } = config;

  // Format data according to columns
  const formattedData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      row[col.header] = item[col.dataKey] !== undefined && item[col.dataKey] !== null ? item[col.dataKey] : '-';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set column widths
  const colWidths = columns.map(c => ({ wch: Math.max(c.header.length, 15) }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
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

  // Prepare table data
  const head = [columns.map(c => c.header)];
  const body = data.map(item => 
    columns.map(c => item[c.dataKey] !== undefined && item[c.dataKey] !== null ? String(item[c.dataKey]) : '-')
  );

  autoTable(doc, {
    head: head,
    body: body,
    startY: 80,
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
