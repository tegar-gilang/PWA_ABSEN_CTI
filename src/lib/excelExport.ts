/**
 * Utilitas untuk membuat dan mengunduh laporan spreadsheet resmi berformat .xlsx (OpenXML)
 * Kompatibel 100% dengan Microsoft Excel, Google Sheets, LibreOffice Calc, dan WPS Office.
 */

// Table CRC-32 untuk pembuatan ZIP secara mandiri tanpa dependency tambahan
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

/**
 * Membuat file ZIP PKZIP 2.0 standar berformat Stored (Method 0)
 */
function createZipArchive(files: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const pathBytes = encoder.encode(file.path);
    const dataBytes = file.data;
    const crc = calculateCrc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + path + data)
    const local = new Uint8Array(30 + pathBytes.length + size);
    const lView = new DataView(local.buffer);

    lView.setUint32(0, 0x04034b50, true); // Local header signature
    lView.setUint16(4, 20, true);         // Version needed: 2.0
    lView.setUint16(6, 0x0800, true);     // Flags: UTF-8 filename
    lView.setUint16(8, 0, true);          // Compression method: 0 (Stored)
    lView.setUint16(10, 0x4d00, true);    // Last mod time
    lView.setUint16(12, 0x5521, true);    // Last mod date
    lView.setUint32(14, crc, true);       // CRC-32
    lView.setUint32(18, size, true);      // Compressed size
    lView.setUint32(22, size, true);      // Uncompressed size
    lView.setUint16(26, pathBytes.length, true); // Filename length
    lView.setUint16(28, 0, true);         // Extra field length

    local.set(pathBytes, 30);
    local.set(dataBytes, 30 + pathBytes.length);
    localHeaders.push(local);

    // Central directory file header (46 bytes + path)
    const central = new Uint8Array(46 + pathBytes.length);
    const cView = new DataView(central.buffer);

    cView.setUint32(0, 0x02014b50, true); // Central header signature
    cView.setUint16(4, 20, true);         // Version made by
    cView.setUint16(6, 20, true);         // Version needed to extract
    cView.setUint16(8, 0x0800, true);     // Flags: UTF-8
    cView.setUint16(10, 0, true);         // Compression method: 0
    cView.setUint16(12, 0x4d00, true);    // Last mod time
    cView.setUint16(14, 0x5521, true);    // Last mod date
    cView.setUint32(16, crc, true);       // CRC-32
    cView.setUint32(20, size, true);      // Compressed size
    cView.setUint32(24, size, true);      // Uncompressed size
    cView.setUint16(28, pathBytes.length, true); // Filename length
    cView.setUint16(30, 0, true);         // Extra field length
    cView.setUint16(32, 0, true);         // File comment length
    cView.setUint16(34, 0, true);         // Disk number start
    cView.setUint16(36, 0, true);         // Internal file attributes
    cView.setUint32(38, 0, true);         // External file attributes
    cView.setUint32(42, offset, true);    // Relative offset of local header

    central.set(pathBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralHeaders) {
    centralSize += c.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, files.length, true);
  eView.setUint16(10, files.length, true);
  eView.setUint32(12, centralSize, true);
  eView.setUint32(16, centralOffset, true);
  eView.setUint16(20, 0, true);

  const totalLength = centralOffset + centralSize + 22;
  const zip = new Uint8Array(totalLength);
  let pos = 0;
  for (const l of localHeaders) {
    zip.set(l, pos);
    pos += l.length;
  }
  for (const c of centralHeaders) {
    zip.set(c, pos);
    pos += c.length;
  }
  zip.set(eocd, pos);

  return zip;
}

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownloadXlsx(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface EmployeeInfo {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
}

export interface AttendanceSummaryCounts {
  totalIzin: number;
  totalCuti: number;
  totalTelat: number;
  totalHadir: number;
  totalHariAktif?: number;
}

export interface AttendanceDetailItem {
  date: string;
  dayName: string;
  category: 'TERLAMBAT' | 'IZIN' | 'CUTI' | 'HADIR' | string;
  categoryLabel: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number | null;
  keterangan?: string;
  status?: string;
}

const COMMON_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="14">
    <font><name val="Calibri"/><sz val="11"/><color rgb="FF1F2937"/></font> <!-- 0: normal -->
    <font><b/><name val="Calibri"/><sz val="16"/><color rgb="FF1E3A8A"/></font> <!-- 1: title -->
    <font><b/><name val="Calibri"/><sz val="13"/><color rgb="FF1E40AF"/></font> <!-- 2: subtitle -->
    <font><i/><name val="Calibri"/><sz val="10"/><color rgb="FF6B7280"/></font> <!-- 3: muted -->
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FF1E3A8A"/></font> <!-- 4: section -->
    <font><b/><name val="Calibri"/><sz val="10"/><color rgb="FF374151"/></font> <!-- 5: label -->
    <font><b/><name val="Calibri"/><sz val="10"/><color rgb="FFFFFFFF"/></font> <!-- 6: header white -->
    <font><b/><name val="Calibri"/><sz val="12"/><color rgb="FF1E3A8A"/></font> <!-- 7: sum normal -->
    <font><b/><name val="Calibri"/><sz val="12"/><color rgb="FFB45309"/></font> <!-- 8: sum late -->
    <font><b/><name val="Calibri"/><sz val="12"/><color rgb="FFDC2626"/></font> <!-- 9: sum leave -->
    <font><b/><name val="Calibri"/><sz val="12"/><color rgb="FF2563EB"/></font> <!-- 10: sum perm -->
    <font><b/><name val="Calibri"/><sz val="14"/><color rgb="FF000000"/></font> <!-- 11: CTI Main Title -->
    <font><b/><name val="Calibri"/><sz val="10"/><color rgb="FF000000"/></font> <!-- 12: CTI Table Header -->
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FF000000"/></font> <!-- 13: CTI Section / Meta -->
  </fonts>
  <fills count="11">
    <fill><patternFill patternType="none"/></fill> <!-- 0 -->
    <fill><patternFill patternType="gray125"/></fill> <!-- 1 -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0E7FF"/></patternFill></fill> <!-- 2: section bg -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF9FAFB"/></patternFill></fill> <!-- 3: label bg -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF3B82F6"/></patternFill></fill> <!-- 4: header sum blue -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/></patternFill></fill> <!-- 5: table header dark blue -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF0FDF4"/></patternFill></fill> <!-- 6: sum hadir green -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill> <!-- 7: sum late yellow -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill> <!-- 8: sum leave red -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill> <!-- 9: sum perm blue -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFDEEAF6"/></patternFill></fill> <!-- 10: CTI Sheet Header Blue -->
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border> <!-- 0: none -->
    <border> <!-- 1: thin gray -->
      <left style="thin"><color rgb="FFE5E7EB"/></left>
      <right style="thin"><color rgb="FFE5E7EB"/></right>
      <top style="thin"><color rgb="FFE5E7EB"/></top>
      <bottom style="thin"><color rgb="FFE5E7EB"/></bottom>
    </border>
    <border> <!-- 2: thin black/dark gray for CTI table -->
      <left style="thin"><color rgb="FFBFBFBF"/></left>
      <right style="thin"><color rgb="FFBFBFBF"/></right>
      <top style="thin"><color rgb="FFBFBFBF"/></top>
      <bottom style="thin"><color rgb="FFBFBFBF"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="20">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/> <!-- 0: normal -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf> <!-- 1: title -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf> <!-- 2: subtitle -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf> <!-- 3: muted -->
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf> <!-- 4: section -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf> <!-- 5: label -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center"/></xf> <!-- 6: value/cell -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 7: cell center -->
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 8: tbl header -->
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 9: sum header -->
    <xf numFmtId="0" fontId="8" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 10: sum late -->
    <xf numFmtId="0" fontId="9" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 11: sum leave -->
    <xf numFmtId="0" fontId="10" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 12: sum perm -->
    <xf numFmtId="0" fontId="11" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 13: CTI title -->
    <xf numFmtId="0" fontId="13" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf> <!-- 14: CTI meta label -->
    <xf numFmtId="0" fontId="13" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf> <!-- 15: CTI meta value -->
    <xf numFmtId="0" fontId="12" fillId="10" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf> <!-- 16: CTI table header -->
    <xf numFmtId="0" fontId="13" fillId="10" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 17: CTI dept header -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf> <!-- 18: CTI cell center -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf> <!-- 19: CTI cell left -->
  </cellXfs>
</styleSheet>`;

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const WORKBOOK_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Laporan Absensi" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

/**
 * Ekspor Laporan Detail Absensi Karyawan Tunggal (Single Employee) ke format .xlsx
 * Berisi:
 * - Data pribadi karyawan (Nama, NIP, Divisi, Periode)
 * - Ringkasan berapa kali izin, cuti, telat, dan hadir
 * - Rincian hari & tanggal kapan dia melakukan izin, cuti, atau terlambat
 */
export function exportSingleEmployeeReport(
  employee: EmployeeInfo,
  summary: AttendanceSummaryCounts,
  details: AttendanceDetailItem[],
  periodeText: string = "08/07/2026 - Sekarang"
) {
  const downloadDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const downloadTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let r = 1;
  const rowsXml: string[] = [];
  const merges: string[] = [];

  // Baris 1: Header Perusahaan
  rowsXml.push(`<row r="${r}" ht="28" customHeight="1"><c r="A${r}" s="1" t="inlineStr"><is><t>PT CTI - HR ADMIN SYSTEM</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Baris 2: Judul Laporan
  rowsXml.push(`<row r="${r}" ht="24" customHeight="1"><c r="A${r}" s="2" t="inlineStr"><is><t>LAPORAN DETAIL ABSENSI, IZIN, CUTI &amp; KETERLAMBATAN KARYAWAN</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Baris 3: Tanggal Ekspor
  rowsXml.push(`<row r="${r}" ht="18" customHeight="1"><c r="A${r}" s="3" t="inlineStr"><is><t>Dokumen Laporan Individual Karyawan - Diekspor pada: ${escapeXml(downloadDate)}, pk ${escapeXml(downloadTime)} WIB</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Baris 4: Spasi
  rowsXml.push(`<row r="${r}" ht="12"/>`);
  r++;

  // Baris 5: Seksi Profil
  rowsXml.push(`<row r="${r}" ht="22" customHeight="1"><c r="A${r}" s="4" t="inlineStr"><is><t>I. DATA PRIBADI KARYAWAN</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Profil Baris 1
  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="A${r}" s="5" t="inlineStr"><is><t>Nama</t></is></c>
    <c r="B${r}" s="6" t="inlineStr"><is><t>${escapeXml(employee.name)}</t></is></c>
    <c r="E${r}" s="5" t="inlineStr"><is><t>NIP / ID</t></is></c>
    <c r="F${r}" s="6" t="inlineStr"><is><t>${escapeXml(employee.employeeId)}</t></is></c>
  </row>`);
  merges.push(`B${r}:D${r}`, `F${r}:H${r}`);
  r++;

  // Profil Baris 2
  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="A${r}" s="5" t="inlineStr"><is><t>Bagian</t></is></c>
    <c r="B${r}" s="6" t="inlineStr"><is><t>${escapeXml(employee.department)}</t></is></c>
    <c r="E${r}" s="5" t="inlineStr"><is><t>Jabatan</t></is></c>
    <c r="F${r}" s="6" t="inlineStr"><is><t>${escapeXml(employee.position || 'Staff')}</t></is></c>
  </row>`);
  merges.push(`B${r}:D${r}`, `F${r}:H${r}`);
  r++;

  // Profil Baris 3
  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="A${r}" s="5" t="inlineStr"><is><t>Periode</t></is></c>
    <c r="B${r}" s="6" t="inlineStr"><is><t>${escapeXml(periodeText)}</t></is></c>
    <c r="E${r}" s="5" t="inlineStr"><is><t>Kontak</t></is></c>
    <c r="F${r}" s="6" t="inlineStr"><is><t>${escapeXml(employee.phone || employee.email || '-')}</t></is></c>
  </row>`);
  merges.push(`B${r}:D${r}`, `F${r}:H${r}`);
  r++;

  // Spasi
  rowsXml.push(`<row r="${r}" ht="14"/>`);
  r++;

  // Seksi Ringkasan Akumulasi
  rowsXml.push(`<row r="${r}" ht="22" customHeight="1"><c r="A${r}" s="4" t="inlineStr"><is><t>II. RINGKASAN AKUMULASI KEHADIRAN &amp; KETIDAKHADIRAN</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Header Ringkasan
  rowsXml.push(`<row r="${r}" ht="22" customHeight="1">
    <c r="A${r}" s="9" t="inlineStr"><is><t>TOTAL IZIN</t></is></c>
    <c r="C${r}" s="9" t="inlineStr"><is><t>TOTAL CUTI</t></is></c>
    <c r="E${r}" s="9" t="inlineStr"><is><t>TOTAL TERLAMBAT</t></is></c>
    <c r="G${r}" s="9" t="inlineStr"><is><t>HADIR TEPAT WAKTU</t></is></c>
  </row>`);
  merges.push(`A${r}:B${r}`, `C${r}:D${r}`, `E${r}:F${r}`, `G${r}:H${r}`);
  r++;

  // Nilai Ringkasan
  rowsXml.push(`<row r="${r}" ht="28" customHeight="1">
    <c r="A${r}" s="12" t="inlineStr"><is><t>${summary.totalIzin} Kali</t></is></c>
    <c r="C${r}" s="11" t="inlineStr"><is><t>${summary.totalCuti} Kali</t></is></c>
    <c r="E${r}" s="10" t="inlineStr"><is><t>${summary.totalTelat} Kali</t></is></c>
    <c r="G${r}" s="7" t="inlineStr"><is><t>${summary.totalHadir} Kali</t></is></c>
  </row>`);
  merges.push(`A${r}:B${r}`, `C${r}:D${r}`, `E${r}:F${r}`, `G${r}:H${r}`);
  r++;

  // Spasi
  rowsXml.push(`<row r="${r}" ht="14"/>`);
  r++;

  // Seksi Detail Hari & Tanggal Kejadian
  rowsXml.push(`<row r="${r}" ht="22" customHeight="1"><c r="A${r}" s="4" t="inlineStr"><is><t>III. RINCIAN HARI &amp; TANGGAL KEJADIAN (IZIN / CUTI / TERLAMBAT / HADIR)</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Header Kolom Tabel Detail
  rowsXml.push(`<row r="${r}" ht="24" customHeight="1">
    <c r="A${r}" s="8" t="inlineStr"><is><t>No</t></is></c>
    <c r="B${r}" s="8" t="inlineStr"><is><t>Hari</t></is></c>
    <c r="C${r}" s="8" t="inlineStr"><is><t>Tanggal</t></is></c>
    <c r="D${r}" s="8" t="inlineStr"><is><t>Kategori Kejadian</t></is></c>
    <c r="E${r}" s="8" t="inlineStr"><is><t>Jam Check-In</t></is></c>
    <c r="F${r}" s="8" t="inlineStr"><is><t>Jam Check-Out</t></is></c>
    <c r="G${r}" s="8" t="inlineStr"><is><t>Keterangan / Alasan</t></is></c>
    <c r="H${r}" s="8" t="inlineStr"><is><t>Status Verifikasi</t></is></c>
  </row>`);
  r++;

  // Isi Data Detail Kejadian
  if (details.length === 0) {
    rowsXml.push(`<row r="${r}" ht="24" customHeight="1"><c r="A${r}" s="7" t="inlineStr"><is><t>Tidak ada catatan kejadian pada periode ini.</t></is></c></row>`);
    merges.push(`A${r}:H${r}`);
    r++;
  } else {
    details.forEach((item, idx) => {
      let dateFormatted = item.date;
      if (dateFormatted && dateFormatted.includes('-')) {
        const [y, m, d] = dateFormatted.split('-');
        dateFormatted = `${d}/${m}/${y}`;
      }

      rowsXml.push(`<row r="${r}" ht="22" customHeight="1">
        <c r="A${r}" s="7"><v>${idx + 1}</v></c>
        <c r="B${r}" s="7" t="inlineStr"><is><t>${escapeXml(item.dayName || '-')}</t></is></c>
        <c r="C${r}" s="7" t="inlineStr"><is><t>${escapeXml(dateFormatted)}</t></is></c>
        <c r="D${r}" s="7" t="inlineStr"><is><t>${escapeXml(item.categoryLabel || item.category)}</t></is></c>
        <c r="E${r}" s="7" t="inlineStr"><is><t>${escapeXml(item.checkInTime || '-')}</t></is></c>
        <c r="F${r}" s="7" t="inlineStr"><is><t>${escapeXml(item.checkOutTime || '-')}</t></is></c>
        <c r="G${r}" s="6" t="inlineStr"><is><t>${escapeXml(item.keterangan || '-')}</t></is></c>
        <c r="H${r}" s="7" t="inlineStr"><is><t>${escapeXml(item.status || 'Tercatat')}</t></is></c>
      </row>`);
      r++;
    });
  }

  // Spasi dan Pengesahan
  rowsXml.push(`<row r="${r}" ht="20"/>`);
  r++;

  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="F${r}" s="7" t="inlineStr"><is><t>Jakarta, ${escapeXml(downloadDate)}</t></is></c>
  </row>`);
  merges.push(`F${r}:H${r}`);
  r++;

  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="A${r}" s="7" t="inlineStr"><is><t>Karyawan Yang Bersangkutan,</t></is></c>
    <c r="F${r}" s="7" t="inlineStr"><is><t>Mengetahui, HRD PT CTI</t></is></c>
  </row>`);
  merges.push(`A${r}:C${r}`, `F${r}:H${r}`);
  r++;

  rowsXml.push(`<row r="${r}" ht="45"/>`); // Ruang tanda tangan
  r++;

  rowsXml.push(`<row r="${r}" ht="20" customHeight="1">
    <c r="A${r}" s="7" t="inlineStr"><is><t>( ${escapeXml(employee.name)} )</t></is></c>
    <c r="F${r}" s="7" t="inlineStr"><is><t>( HR Department / Admin )</t></is></c>
  </row>`);
  merges.push(`A${r}:C${r}`, `F${r}:H${r}`);
  r++;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="14" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="22" customWidth="1"/>
    <col min="5" max="5" width="15" customWidth="1"/>
    <col min="6" max="6" width="15" customWidth="1"/>
    <col min="7" max="7" width="38" customWidth="1"/>
    <col min="8" max="8" width="20" customWidth="1"/>
  </cols>
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
  ${merges.length > 0 ? `<mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n    ')}
  </mergeCells>` : ''}
</worksheet>`;

  const encoder = new TextEncoder();
  const zipFiles: ZipEntry[] = [
    { path: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES_XML) },
    { path: '_rels/.rels', data: encoder.encode(ROOT_RELS_XML) },
    { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(WORKBOOK_RELS_XML) },
    { path: 'xl/workbook.xml', data: encoder.encode(WORKBOOK_XML) },
    { path: 'xl/styles.xml', data: encoder.encode(COMMON_STYLES_XML) },
    { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) }
  ];

  const zipData = createZipArchive(zipFiles);
  const sanitizedName = employee.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Absensi_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownloadXlsx(zipData, filename);
}

export interface SummaryEmployeeRow {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  izin: number | null;
  cuti: number | null;
  telat: number | null;
  hadir?: number;
  periode: string;
}

/**
 * Ekspor Ringkasan Data Absensi Seluruh Karyawan ke format .xlsx (Tombol Export to Excel di Kanan Atas)
 */
export function exportAllEmployeesSummary(
  summaryList: SummaryEmployeeRow[],
  periodeText: string = "08/07/2026 - Sekarang"
) {
  const downloadDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let r = 1;
  const rowsXml: string[] = [];
  const merges: string[] = [];

  // Judul
  rowsXml.push(`<row r="${r}" ht="28" customHeight="1"><c r="A${r}" s="1" t="inlineStr"><is><t>PT CTI - REKAPITULASI DATA ABSENSI SELURUH KARYAWAN</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Subjudul
  rowsXml.push(`<row r="${r}" ht="20" customHeight="1"><c r="A${r}" s="3" t="inlineStr"><is><t>Periode: ${escapeXml(periodeText)} | Tanggal Ekspor: ${escapeXml(downloadDate)}</t></is></c></row>`);
  merges.push(`A${r}:H${r}`);
  r++;

  // Spasi
  rowsXml.push(`<row r="${r}" ht="12"/>`);
  r++;

  // Header Tabel
  rowsXml.push(`<row r="${r}" ht="24" customHeight="1">
    <c r="A${r}" s="8" t="inlineStr"><is><t>No</t></is></c>
    <c r="B${r}" s="8" t="inlineStr"><is><t>NIK</t></is></c>
    <c r="C${r}" s="8" t="inlineStr"><is><t>Nama Karyawan</t></is></c>
    <c r="D${r}" s="8" t="inlineStr"><is><t>Bagian</t></is></c>
    <c r="E${r}" s="8" t="inlineStr"><is><t>Izin</t></is></c>
    <c r="F${r}" s="8" t="inlineStr"><is><t>Cuti</t></is></c>
    <c r="G${r}" s="8" t="inlineStr"><is><t>Telat</t></is></c>
    <c r="H${r}" s="8" t="inlineStr"><is><t>Periode</t></is></c>
  </row>`);
  r++;

  // Baris Karyawan
  summaryList.forEach((emp, idx) => {
    rowsXml.push(`<row r="${r}" ht="22" customHeight="1">
      <c r="A${r}" s="7"><v>${idx + 1}</v></c>
      <c r="B${r}" s="7" t="inlineStr"><is><t>${escapeXml(emp.employeeId)}</t></is></c>
      <c r="C${r}" s="6" t="inlineStr"><is><t>${escapeXml(emp.name)}</t></is></c>
      <c r="D${r}" s="6" t="inlineStr"><is><t>${escapeXml(emp.department)}</t></is></c>
      <c r="E${r}" s="7" t="inlineStr"><is><t>${emp.izin !== null ? emp.izin : '-'}</t></is></c>
      <c r="F${r}" s="7" t="inlineStr"><is><t>${emp.cuti !== null ? emp.cuti : '-'}</t></is></c>
      <c r="G${r}" s="7" t="inlineStr"><is><t>${emp.telat !== null ? emp.telat : '-'}</t></is></c>
      <c r="H${r}" s="7" t="inlineStr"><is><t>${escapeXml(emp.periode)}</t></is></c>
    </row>`);
    r++;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="16" customWidth="1"/>
    <col min="3" max="3" width="28" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="10" customWidth="1"/>
    <col min="6" max="6" width="10" customWidth="1"/>
    <col min="7" max="7" width="10" customWidth="1"/>
    <col min="8" max="8" width="25" customWidth="1"/>
  </cols>
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
  ${merges.length > 0 ? `<mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n    ')}
  </mergeCells>` : ''}
</worksheet>`;

  const encoder = new TextEncoder();
  const zipFiles: ZipEntry[] = [
    { path: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES_XML) },
    { path: '_rels/.rels', data: encoder.encode(ROOT_RELS_XML) },
    { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(WORKBOOK_RELS_XML) },
    { path: 'xl/workbook.xml', data: encoder.encode(WORKBOOK_XML) },
    { path: 'xl/styles.xml', data: encoder.encode(COMMON_STYLES_XML) },
    { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) }
  ];

  const zipData = createZipArchive(zipFiles);
  const filename = `Rekap_Data_Absensi_Karyawan_PT_CTI_${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownloadXlsx(zipData, filename);
}

export interface EmployeeExportRow {
  id: string;
  name: string;
  email?: string;
  employee_id?: string;
  employeeId?: string;
  nik?: string;
  department?: string;
  department_name?: string;
  position?: string;
  position_name?: string;
  phone?: string;
  address?: string;
  jam_masuk?: string;
  jam_keluar?: string;
  hospital_name?: string;
  schedule?: string;
}

/**
 * Ekspor Data Seluruh Karyawan ke format .xlsx (Tombol Export to Excel di Manajemen Karyawan)
 */
export function exportEmployeesList(employees: EmployeeExportRow[]) {
  const downloadDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let r = 1;
  const rowsXml: string[] = [];
  const merges: string[] = [];

  // Judul
  rowsXml.push(`<row r="${r}" ht="28" customHeight="1"><c r="A${r}" s="1" t="inlineStr"><is><t>PT CTI - DATA MASTER KARYAWAN</t></is></c></row>`);
  merges.push(`A${r}:I${r}`);
  r++;

  // Subjudul
  rowsXml.push(`<row r="${r}" ht="20" customHeight="1"><c r="A${r}" s="3" t="inlineStr"><is><t>Tanggal Ekspor: ${escapeXml(downloadDate)} | Total Karyawan: ${employees.length} Orang</t></is></c></row>`);
  merges.push(`A${r}:I${r}`);
  r++;

  // Spasi
  rowsXml.push(`<row r="${r}" ht="12"/>`);
  r++;

  // Header Tabel
  rowsXml.push(`<row r="${r}" ht="24" customHeight="1">
    <c r="A${r}" s="8" t="inlineStr"><is><t>No</t></is></c>
    <c r="B${r}" s="8" t="inlineStr"><is><t>Nama Karyawan</t></is></c>
    <c r="C${r}" s="8" t="inlineStr"><is><t>NIK</t></is></c>
    <c r="D${r}" s="8" t="inlineStr"><is><t>Email</t></is></c>
    <c r="E${r}" s="8" t="inlineStr"><is><t>Bagian</t></is></c>
    <c r="F${r}" s="8" t="inlineStr"><is><t>No Telepon</t></is></c>
    <c r="G${r}" s="8" t="inlineStr"><is><t>Alamat</t></is></c>
    <c r="H${r}" s="8" t="inlineStr"><is><t>Penempatan</t></is></c>
    <c r="I${r}" s="8" t="inlineStr"><is><t>Waktu Shift</t></is></c>
  </row>`);
  r++;

  // Baris Karyawan
  employees.forEach((emp, idx) => {
    const nik = emp.nik || '-';
    const email = emp.email || '-';
    const dept = emp.department || emp.department_name || '-';
    const phone = emp.phone || '-';
    const address = emp.address || '-';
    const hospital = emp.hospital_name || '-';
    const shift = emp.schedule || (emp.jam_masuk && emp.jam_keluar ? `${emp.jam_masuk.slice(0, 5)} - ${emp.jam_keluar.slice(0, 5)}` : '08:00 - 17:00');

    rowsXml.push(`<row r="${r}" ht="22" customHeight="1">
      <c r="A${r}" s="7"><v>${idx + 1}</v></c>
      <c r="B${r}" s="6" t="inlineStr"><is><t>${escapeXml(emp.name)}</t></is></c>
      <c r="C${r}" s="7" t="inlineStr"><is><t>${escapeXml(nik)}</t></is></c>
      <c r="D${r}" s="6" t="inlineStr"><is><t>${escapeXml(email)}</t></is></c>
      <c r="E${r}" s="6" t="inlineStr"><is><t>${escapeXml(dept)}</t></is></c>
      <c r="F${r}" s="7" t="inlineStr"><is><t>${escapeXml(phone)}</t></is></c>
      <c r="G${r}" s="6" t="inlineStr"><is><t>${escapeXml(address)}</t></is></c>
      <c r="H${r}" s="6" t="inlineStr"><is><t>${escapeXml(hospital)}</t></is></c>
      <c r="I${r}" s="7" t="inlineStr"><is><t>${escapeXml(shift)}</t></is></c>
    </row>`);
    r++;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="28" customWidth="1"/>
    <col min="3" max="3" width="22" customWidth="1"/>
    <col min="4" max="4" width="28" customWidth="1"/>
    <col min="5" max="5" width="20" customWidth="1"/>
    <col min="6" max="6" width="18" customWidth="1"/>
    <col min="7" max="7" width="32" customWidth="1"/>
    <col min="8" max="8" width="26" customWidth="1"/>
    <col min="9" max="9" width="18" customWidth="1"/>
  </cols>
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
  ${merges.length > 0 ? `<mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n    ')}
  </mergeCells>` : ''}
</worksheet>`;

  const encoder = new TextEncoder();
  const zipFiles: ZipEntry[] = [
    { path: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES_XML) },
    { path: '_rels/.rels', data: encoder.encode(ROOT_RELS_XML) },
    { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(WORKBOOK_RELS_XML) },
    { path: 'xl/workbook.xml', data: encoder.encode(WORKBOOK_XML) },
    { path: 'xl/styles.xml', data: encoder.encode(COMMON_STYLES_XML) },
    { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) }
  ];

  const zipData = createZipArchive(zipFiles);
  const filename = `Data_Karyawan_PT_CTI_${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownloadXlsx(zipData, filename);
}

