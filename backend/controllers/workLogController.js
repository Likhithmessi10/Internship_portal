const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

const ACTIVE_STATUSES = ['HIRED', 'ONGOING', 'COMPLETED'];

// POST /students/applications/:id/work-log
const submitWorkLog = async (req, res) => {
    try {
        const { id: applicationId } = req.params;
        const { date, description, hoursWorked } = req.body;

        if (!date || !description?.trim()) {
            return res.status(400).json({ success: false, message: 'Date and description are required.' });
        }

        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: true }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
        if (app.student.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your application.' });
        if (!ACTIVE_STATUSES.includes(app.status)) {
            return res.status(400).json({ success: false, message: 'Work logs can only be submitted after hiring.' });
        }

        // Parse date to "YYYY-MM-DD" format timezone-independently
        const logDateObj = new Date(date);
        const logDateStr = logDateObj.toISOString().split('T')[0];

        // Get today's date in IST "YYYY-MM-DD"
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const todayISTStr = nowIST.getFullYear() + '-' + 
            String(nowIST.getMonth() + 1).padStart(2, '0') + '-' + 
            String(nowIST.getDate()).padStart(2, '0');

        if (logDateStr !== todayISTStr) {
            return res.status(400).json({
                success: false,
                message: `You are only allowed to submit/update work logs for the present day (${todayISTStr}).`
            });
        }

        const logDate = new Date(date);
        logDate.setUTCHours(0, 0, 0, 0);

        const log = await prisma.workLog.upsert({
            where: { applicationId_date: { applicationId, date: logDate } },
            update: { description: description.trim(), hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null },
            create: {
                applicationId,
                studentId: app.studentId,
                date:      logDate,
                description: description.trim(),
                hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null
            }
        });

        res.json({ success: true, data: log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /students/applications/:id/work-logs
const getStudentWorkLogs = async (req, res) => {
    try {
        const { id: applicationId } = req.params;

        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: true }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
        if (app.student.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your application.' });

        const logs = await prisma.workLog.findMany({
            where: { applicationId },
            orderBy: { date: 'asc' }
        });

        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /admin/applications/:id/work-logs  (mentor, HOD, PRTI)
const getApplicationWorkLogs = async (req, res) => {
    try {
        const { id: applicationId } = req.params;

        const logs = await prisma.workLog.findMany({
            where: { applicationId },
            include: {
                student: { select: { fullName: true, rollNumber: true } }
            },
            orderBy: { date: 'asc' }
        });

        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /admin/applications/:id/work-logs/export  (mentor, HOD, PRTI)
const exportApplicationWorkLogs = async (req, res) => {
    try {
        const { id: applicationId } = req.params;

        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                student: { select: { fullName: true, rollNumber: true, branch: true, collegeName: true } },
                internship: { select: { title: true } },
                field: { select: { fieldName: true } },
                mentor: { select: { name: true } }
            }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

        const logs = await prisma.workLog.findMany({
            where: { applicationId },
            orderBy: { date: 'asc' }
        });

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Daily Work Log');

        // Header info block
        ws.mergeCells('A1:E1');
        ws.getCell('A1').value = 'APTRANSCO INTERNSHIP — DAILY WORK LOG';
        ws.getCell('A1').font = { bold: true, size: 14 };
        ws.getCell('A1').alignment = { horizontal: 'center' };

        const info = [
            ['Intern Name', app.student?.fullName],
            ['Roll Number', app.student?.rollNumber || 'Pending'],
            ['Internship',  app.internship?.title],
            ['Field',       app.field?.fieldName],
            ['Mentor',      app.mentor?.name || '—'],
            ['College',     app.student?.collegeName],
        ];
        let row = 3;
        info.forEach(([k, v]) => {
            ws.getCell(`A${row}`).value = k;
            ws.getCell(`A${row}`).font = { bold: true };
            ws.getCell(`B${row}`).value = v || '';
            row++;
        });

        // Log table header
        const tableRow = row + 1;
        const headers = ['#', 'Date', 'Day', 'Work Description', 'Hours'];
        const colWidths = [5, 14, 12, 60, 8];
        headers.forEach((h, i) => {
            const cell = ws.getCell(tableRow, i + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { horizontal: 'center' };
            ws.getColumn(i + 1).width = colWidths[i];
        });

        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        logs.forEach((log, idx) => {
            const dataRow = tableRow + 1 + idx;
            const d = new Date(log.date);
            ws.getRow(dataRow).values = [
                idx + 1,
                d.toLocaleDateString('en-IN'),
                DAYS[d.getDay()],
                log.description,
                log.hoursWorked ?? ''
            ];
            if (idx % 2 === 0) {
                ws.getRow(dataRow).eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
                });
            }
        });

        // Summary
        const summaryRow = tableRow + logs.length + 2;
        ws.getCell(summaryRow, 1).value = 'Total Days Logged';
        ws.getCell(summaryRow, 1).font = { bold: true };
        ws.getCell(summaryRow, 2).value = logs.length;
        const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);
        if (totalHours > 0) {
            ws.getCell(summaryRow + 1, 1).value = 'Total Hours';
            ws.getCell(summaryRow + 1, 1).font = { bold: true };
            ws.getCell(summaryRow + 1, 2).value = totalHours;
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="worklog_${app.student?.rollNumber || applicationId}.xlsx"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /admin/internships/:id/work-logs/export  — all interns for an internship (HOD/PRTI/Mentor)
const exportInternshipWorkLogs = async (req, res) => {
    try {
        const { id: internshipId } = req.params;
        const { dept } = req.query;

        const whereClause = { internshipId };
        if (dept) whereClause.departmentGroup = { department: dept };

        const applications = await prisma.application.findMany({
            where: { ...whereClause, status: { in: ACTIVE_STATUSES } },
            include: {
                student:   { select: { fullName: true, rollNumber: true, branch: true, collegeName: true } },
                field:     { select: { fieldName: true } },
                mentor:    { select: { name: true } },
                workLogs:  { orderBy: { date: 'asc' } }
            },
            orderBy: { createdAt: 'asc' }
        });

        const wb = new ExcelJS.Workbook();

        applications.forEach(app => {
            const name = (app.student?.rollNumber || app.student?.fullName || 'intern').replace(/[^a-z0-9]/gi, '_').slice(0, 28);
            const ws = wb.addWorksheet(name);

            ws.getRow(1).values = ['Intern', app.student?.fullName, '', 'Roll No', app.student?.rollNumber || 'Pending'];
            ws.getRow(2).values = ['Field', app.field?.fieldName, '', 'Mentor', app.mentor?.name || '—'];
            ws.getRow(1).font = ws.getRow(2).font = { bold: true };

            const hdr = ws.getRow(4);
            hdr.values = ['#', 'Date', 'Day', 'Work Description', 'Hours'];
            hdr.eachCell(c => {
                c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            });
            ws.columns = [
                { key: 'no',   width: 5 },
                { key: 'date', width: 14 },
                { key: 'day',  width: 12 },
                { key: 'desc', width: 60 },
                { key: 'hrs',  width: 8 },
            ];

            const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            app.workLogs.forEach((log, idx) => {
                const d = new Date(log.date);
                ws.addRow([idx + 1, d.toLocaleDateString('en-IN'), DAYS[d.getDay()], log.description, log.hoursWorked ?? '']);
            });
        });

        // Summary sheet
        const summary = wb.addWorksheet('Summary');
        summary.getRow(1).values = ['Roll No', 'Name', 'Field', 'Mentor', 'Days Logged', 'Total Hours'];
        summary.getRow(1).font = { bold: true };
        applications.forEach((app, i) => {
            const totalH = app.workLogs.reduce((s, l) => s + (l.hoursWorked || 0), 0);
            summary.getRow(i + 2).values = [
                app.student?.rollNumber || '—',
                app.student?.fullName,
                app.field?.fieldName,
                app.mentor?.name || '—',
                app.workLogs.length,
                totalH || ''
            ];
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="worklogs_${internshipId}.xlsx"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { submitWorkLog, getStudentWorkLogs, getApplicationWorkLogs, exportApplicationWorkLogs, exportInternshipWorkLogs };
