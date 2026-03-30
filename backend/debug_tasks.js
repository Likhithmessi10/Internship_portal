const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.studentProfile.findFirst({
    where: { fullName: { contains: 'Likhith', mode: 'insensitive' } },
    include: {
      applications: true,
      workAssignments: true
    }
  });

  if (!student) {
    console.log('STUDENT_NOT_FOUND');
    return;
  }

  const appIds = student.applications.map(a => a.id);
  const assignmentsViaApp = await prisma.workAssignment.findMany({
    where: { applicationId: { in: appIds } }
  });

  console.log('STUDENT_ID:', student.id);
  console.log('ASSIGNMENTS_COUNT:', assignmentsViaApp.length);
  console.log('ASSIGNMENTS:', JSON.stringify(assignmentsViaApp, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
