import ExcelJS from 'exceljs';
import { pool } from '../db.js';

// 1. Hitung Periode
function hitungPeriode(tanggalLaporan) {
    const reportDate = new Date(tanggalLaporan);
    
    // TAHUN INI
    const tahunIniAwal = new Date(reportDate.getFullYear(), 0, 1);
    
    // BULAN INI
    const bulanIniAwal = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    
    // MINGGU INI (Awal minggu = Senin)
    const dayOfWeek = reportDate.getDay();
    const diffToMonday = reportDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mingguIniAwal = new Date(reportDate.getFullYear(), reportDate.getMonth(), diffToMonday);
    
    const dayOfMonth = reportDate.getDate();
    const mingguKe = Math.ceil(dayOfMonth / 7);
    const romanNumerals = ["I", "II", "III", "IV", "V"];
    const mingguLabel = romanNumerals[mingguKe - 1] || "I";
    
    const monthsTitleCase = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    
    const formatDate = (dateObj) => `${dateObj.getDate()} ${monthsTitleCase[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    const formatUpperDate = (dateObj) => `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    
    const formatISO = (dateObj) => {
        const d = new Date(dateObj);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    return [
        {
            key: 'ytd',
            labelTitle: `TAHUN INI (${reportDate.getFullYear()})`,
            labelSub: '',
            start: formatISO(tahunIniAwal),
            end: formatISO(reportDate)
        },
        {
            key: 'mtd',
            labelTitle: `BULAN ${months[reportDate.getMonth()]}`,
            labelSub: '',
            start: formatISO(bulanIniAwal),
            end: formatISO(reportDate)
        },
        {
            key: 'wtd',
            labelTitle: `Minggu ${mingguLabel} ( ${mingguIniAwal.getDate()} - ${formatUpperDate(reportDate)} )`,
            labelSub: '',
            start: formatISO(mingguIniAwal),
            end: formatISO(reportDate)
        },
        {
            key: 'today',
            labelTitle: `${days[reportDate.getDay()]} ( ${formatDate(reportDate)} )`,
            labelSub: '',
            start: formatISO(reportDate),
            end: formatISO(reportDate)
        }
    ];
}

// 2. Ambil Data
async function ambilData(periode_array, userId = null) {
    // Ambil data users dengan urutan berdasarkan role/department sesuai screenshot
    let userQuery = `
        SELECT id, employee_id, name, department, role, jam_masuk, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at 
        FROM users 
    `;
    const userParams = [];
    
    if (userId) {
        userQuery += ` WHERE id = ? `;
        userParams.push(userId);
    }
    
    userQuery += `
        ORDER BY 
          CASE 
            WHEN department LIKE '%ADMIN%' THEN 1
            WHEN department LIKE '%MANAGER%' THEN 2
            WHEN role = 'ADMIN' THEN 1
            ELSE 0
          END ASC, 
          name ASC
    `;
    const [users] = await pool.query(userQuery, userParams);

    const minDate = periode_array[0].start; // Tahun ini start
    const maxDate = periode_array[0].end; // Hari ini

    const [attendance] = await pool.query(`
        SELECT user_id, date, status, check_in_time, working_hours
        FROM attendance_records 
        WHERE date BETWEEN ? AND ?
    `, [minDate, maxDate]);

    const [requests] = await pool.query(`
        SELECT user_id, date, end_date, type, reason 
        FROM requests 
        WHERE status = 'APPROVED' AND date <= ? AND (end_date IS NULL OR end_date >= ?)
    `, [maxDate, minDate]);

    // Hitung late_minutes secara real berdasarkan jam_masuk dari tiap user
    attendance.forEach(att => {
        att.late_minutes = 0;
        if (att.status === 'LATE' && att.check_in_time) {
            const checkIn = new Date(att.check_in_time);
            const user = users.find(u => u.id === att.user_id);
            
            const shiftStart = new Date(checkIn);
            if (user && user.jam_masuk) {
                const [h, m, s] = user.jam_masuk.split(':');
                shiftStart.setHours(parseInt(h, 10), parseInt(m, 10), parseInt(s || 0, 10), 0);
            } else {
                shiftStart.setHours(8, 0, 0, 0); // Default 08:00 jika kosong
            }

            const diffMs = checkIn.getTime() - shiftStart.getTime();
            if (diffMs > 0) {
                att.late_minutes = Math.floor(diffMs / 60000);
            }
        }
    });

    const results = users.map(user => {
        const userData = {
            id: user.id,
            employee_id: user.employee_id,
            name: user.name,
            created_at: user.created_at,
            group: user.department?.toUpperCase().includes('ADMIN') ? 'ADMIN' : 
                   user.department?.toUpperCase().includes('MANAGER') ? 'MANAGER' : 'STAFF',
            periods: {}
        };

        periode_array.forEach(p => {
            userData.periods[p.key] = {
                terlambat_kali: 0,
                terlambat_mnt: 0,
                izin: 0,
                sakit: 0,
                cuti: 0,
                alpa: 0
            };
        });

        return userData;
    });

    // Populate data
    attendance.forEach(att => {
        const dateStr = formatISO(att.date);
        
        results.forEach(user => {
            if (user.id === att.user_id) {
                periode_array.forEach(p => {
                    if (dateStr >= p.start && dateStr <= p.end) {
                        if (att.status === 'LATE') {
                            user.periods[p.key].terlambat_kali += 1;
                            user.periods[p.key].terlambat_mnt += att.late_minutes || 0;
                        } else if (att.status === 'ABSENT') {
                            user.periods[p.key].alpa += 1;
                        }
                    }
                });
            }
        });
    });

    requests.forEach(req => {
        const dateStr = formatISO(req.date);
        
        results.forEach(user => {
            if (user.id === req.user_id) {
                periode_array.forEach(p => {
                    if (dateStr >= p.start && dateStr <= p.end) {
                        if (req.type === 'PERMISSION') {
                            user.periods[p.key].izin += 1;
                        } else if (req.type === 'SICK') {
                            user.periods[p.key].sakit += 1;
                        } else if (req.type === 'LEAVE') {
                            user.periods[p.key].cuti += 1;
                        }
                    }
                });
            }
        });
    });
    
    // Fungsi bantuan untuk Dynamic Alpa
    const getWorkingDates = (sDate, eDate, empCreatedStr) => {
        const dates = [];
        let start = new Date(sDate);
        const end = new Date(eDate);
        const today = new Date();
        
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        today.setHours(12, 0, 0, 0);

        if (empCreatedStr) {
            const empCreated = new Date(empCreatedStr);
            empCreated.setHours(12, 0, 0, 0);
            if (start < empCreated) {
                start = empCreated;
            }
        }

        const finalEnd = end > today ? today : end;
        
        let d = new Date(start);
        while (d <= finalEnd) {
            const day = d.getDay();
            if (day >= 1 && day <= 5) {
                dates.push(d.toISOString().split('T')[0]);
            }
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    const calcDynamicAlpa = (workingDates, attList, reqList) => {
        let alpa = 0;
        const attSet = new Set(attList.map(a => formatISO(a.date)));
        const reqSet = new Set();
        for (const r of reqList) {
            let current = new Date(r.date);
            current.setHours(12, 0, 0, 0);
            let endD = new Date(r.end_date || r.date);
            endD.setHours(12, 0, 0, 0);
            while (current <= endD) {
                reqSet.add(current.toISOString().split('T')[0]);
                current.setDate(current.getDate() + 1);
            }
        }

        for (const wd of workingDates) {
            if (!attSet.has(wd) && !reqSet.has(wd)) {
                alpa++;
            }
        }
        return alpa;
    };

    // Calculate dynamic Alpa per user per period
    results.forEach(user => {
        const userAtt = attendance.filter(a => a.user_id === user.id);
        const userReq = requests.filter(r => r.user_id === user.id);
        
        periode_array.forEach(p => {
            const workingDates = getWorkingDates(p.start, p.end, user.created_at);
            const dynamicAlpa = calcDynamicAlpa(workingDates, userAtt, userReq);
            user.periods[p.key].alpa += dynamicAlpa;
        });
    });

    // Grouping
    const grouped = {
        STAFF: results.filter(r => r.group === 'STAFF'),
        ADMIN: results.filter(r => r.group === 'ADMIN'),
        MANAGER: results.filter(r => r.group === 'MANAGER')
    };

    return grouped;
}

function formatISO(dateObj) {
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
}

// 3. Build Header
function buildHeader(worksheet, periode_array, tanggalLaporan) {
    const reportDate = new Date(tanggalLaporan);
    const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
    const monthsTitleCase = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const hari = days[reportDate.getDay()];
    const tgl = `${reportDate.getDate()} ${monthsTitleCase[reportDate.getMonth()].toUpperCase()} ${reportDate.getFullYear()}`;

    // Baris 1: Judul
    const titleRow = worksheet.addRow([`LAPORAN HARIAN KEHADIRAN KARYAWAN HRD CTI ${reportDate.getFullYear()}`]);
    titleRow.font = { name: 'Calibri', size: 24, bold: true };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:Z1'); // 26 kolom (A sampai Z)
    titleRow.height = 35;
    
    worksheet.addRow([]); // Baris 2 kosong

    // Baris 3 & 4
    worksheet.addRow([`HARI        : ${hari}`]);
    worksheet.addRow([`TANGGAL : ${tgl}`]);

    worksheet.addRow([]); // Baris 5 kosong

    // Table Header - Baris 6 (Tingkat 1)
    const headerRow1 = worksheet.addRow(['NO', 'Nama']);
    // Table Header - Baris 7 (Tingkat 2)
    const headerRow2 = worksheet.addRow(['', '']);
    // Table Header - Baris 8 (Tingkat 3)
    const headerRow3 = worksheet.addRow(['', '']);

    let currentCol = 3; // Mulai dari kolom C
    
    periode_array.forEach(p => {
        // Tingkat 1: Nama periode
        headerRow1.getCell(currentCol).value = p.labelTitle;
        worksheet.mergeCells(6, currentCol, 6, currentCol + 5); // Merge 6 kolom per periode
        
        // Tingkat 2
        headerRow2.getCell(currentCol).value = 'Terlambat';
        worksheet.mergeCells(7, currentCol, 7, currentCol + 1); // Merge 2 kolom untuk Terlambat
        
        headerRow2.getCell(currentCol + 2).value = 'Izin';
        worksheet.mergeCells(7, currentCol + 2, 8, currentCol + 2);
        
        headerRow2.getCell(currentCol + 3).value = 'Sakit';
        worksheet.mergeCells(7, currentCol + 3, 8, currentCol + 3);
        
        headerRow2.getCell(currentCol + 4).value = 'Cuti';
        worksheet.mergeCells(7, currentCol + 4, 8, currentCol + 4);
        
        headerRow2.getCell(currentCol + 5).value = 'Alpa';
        worksheet.mergeCells(7, currentCol + 5, 8, currentCol + 5);
        
        // Tingkat 3 untuk Terlambat
        headerRow3.getCell(currentCol).value = 'Kali';
        headerRow3.getCell(currentCol + 1).value = 'Mnt';

        currentCol += 6; // Lanjut ke periode berikutnya
    });

    // Merge vertikal untuk NO dan Nama (Baris 6 sampai 8)
    worksheet.mergeCells('A6:A8');
    worksheet.mergeCells('B6:B8');

    // Styling Headers
    [6, 7, 8].forEach(rowIndex => {
        const row = worksheet.getRow(rowIndex);
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDCE6F1' }
            };
            cell.font = { name: 'Calibri', size: 11, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });
    
    // Set widths
    worksheet.getColumn(1).width = 5;  // NO
    worksheet.getColumn(2).width = 28; // Nama
    for(let i = 3; i <= 26; i++) {
        worksheet.getColumn(i).width = 7;
    }
}

// 4. Build Body
function buildBody(worksheet, data, periode_array) {
    let rowNum = 1;

    const addRowData = (item) => {
        const rowData = [rowNum++, item.name]; // Kolom NO urutan angka
        
        periode_array.forEach(p => {
            const pd = item.periods[p.key];
            rowData.push(
                pd.terlambat_kali || 0,
                pd.terlambat_mnt || 0,
                pd.izin || 0,
                pd.sakit || 0,
                pd.cuti || 0,
                pd.alpa || 0
            );
        });
        
        const row = worksheet.addRow(rowData);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.font = { name: 'Calibri', size: 11 };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            if(colNumber === 1 || colNumber > 2) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    };

    const addSeparator = (title) => {
        const row = worksheet.addRow(['', title]); // Kosong di NO, text di Nama
        
        // Blank cells for the rest
        for(let i = 3; i <= 26; i++) {
            row.getCell(i).value = '';
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDCE6F1' }
            };
            cell.font = { name: 'Calibri', size: 11, bold: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            if (colNumber === 2) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Align center for Title in Nama col
            }
        });
    };

    // STAFF / UNCATEGORIZED
    if (data.STAFF && data.STAFF.length > 0) {
        data.STAFF.forEach(addRowData);
    }
    
    // ADMIN
    if (data.ADMIN && data.ADMIN.length > 0) {
        addSeparator('ADMIN');
        data.ADMIN.forEach(addRowData);
    }
    
    // MANAGER
    if (data.MANAGER && data.MANAGER.length > 0) {
        addSeparator('MANAGER');
        data.MANAGER.forEach(addRowData);
    }
}

export async function generateDailyReportExcel(tanggalLaporan, userId = null) {
    const periode_array = hitungPeriode(tanggalLaporan);
    const data = await ambilData(periode_array, userId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Kehadiran');
    
    // Page Setup
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;
    worksheet.pageSetup.fitToHeight = 0;

    buildHeader(worksheet, periode_array, tanggalLaporan);
    
    // Kolom per periode sekarang menjadi 6 (Kali, Mnt, Izin, Sakit, Cuti, Alpa)
    // Total kolom = 2 + (4 periode * 6 kolom) = 26 kolom

    buildBody(worksheet, data, periode_array);

    // Freeze panes
    worksheet.views = [
        { state: 'frozen', xSplit: 2, ySplit: 8 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

export { hitungPeriode, ambilData, buildHeader, buildBody };
