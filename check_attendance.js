const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttendance() {
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

    console.log(JSON.stringify(students, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendance();
