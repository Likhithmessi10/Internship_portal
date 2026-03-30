const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttendanceStatus() {
  try {
    const students = await prisma.studentProfile.findMany({
      where: { fullName: { contains: 'Mukkamala' } },
      include: {
        applications: {
          include: {
            attendance: true
          }
        }
      }
    });

    students.forEach(s => {
      console.log(`Student: ${s.fullName}`);
      s.applications.forEach(app => {
        console.log(`  App ID: ${app.id}`);
        console.log(`  Status: ${app.status}`);
        console.log(`  Attendance: ${app.attendance ? JSON.stringify(app.attendance) : 'NONE'}`);
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceStatus();
