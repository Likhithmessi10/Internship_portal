const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudent() {
  try {
    const student = await prisma.studentProfile.findFirst({
      where: { fullName: { contains: 'Mukkamala' } },
      include: {
        user: true,
        applications: {
          include: {
            attendance: true
          }
        }
      }
    });

    console.log(JSON.stringify(student, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();
